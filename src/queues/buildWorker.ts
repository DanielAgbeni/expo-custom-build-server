import { Worker, Job } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import unzipper from 'unzipper';
import { redisConnection } from './buildQueue';
import { Build } from '../models/Build';
import { connectDB } from '../config/db';
import type { BuildJob } from '../types';

const execAsync = promisify(exec);
const BUILDS_DIR = process.env.BUILDS_DIR ?? '/srv/buildservice/builds';
const ANDROID_HOME = process.env.ANDROID_HOME ?? '/opt/android-sdk';

/** Ensure the top-level builds directory exists on startup. */
function ensureBuildsDir(): void {
  try {
    fs.mkdirSync(BUILDS_DIR, { recursive: true });
    console.log(`[worker] Builds directory ready: ${BUILDS_DIR}`);
  } catch (err: any) {
    console.error(
      `[worker] FATAL: Cannot create builds directory "${BUILDS_DIR}": ${err.message}\n` +
      `  Fix: sudo mkdir -p ${BUILDS_DIR} && sudo chown -R $(whoami) ${BUILDS_DIR}`
    );
    process.exit(1);
  }
}

const setStatus = (id: string, status: string) =>
  Build.findByIdAndUpdate(id, { status });

const appendLog = (id: string, logs: string) =>
  Build.findByIdAndUpdate(id, { logs });

async function runCmd(cmd: string, cwd: string, logLines: string[]): Promise<void> {
  const { stdout, stderr } = await execAsync(cmd, {
    cwd,
    timeout: 900_000,
    env: { ...process.env, ANDROID_HOME, ANDROID_SDK_ROOT: ANDROID_HOME },
  });
  logLines.push(`$ ${cmd}\n${[stdout, stderr].filter(Boolean).join('\n')}`);
}

/** Get file size in a human-readable format */
function humanFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
  return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/** Extract a zip file into a target directory, handling single-root-folder zips */
async function extractZip(zipPath: string, destDir: string): Promise<void> {
  fs.mkdirSync(destDir, { recursive: true });

  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: destDir }))
    .promise();

  // If the zip contains a single root directory, move its contents up
  const entries = fs.readdirSync(destDir);
  if (entries.length === 1) {
    const singleEntry = path.join(destDir, entries[0]);
    if (fs.statSync(singleEntry).isDirectory()) {
      const innerFiles = fs.readdirSync(singleEntry);
      for (const f of innerFiles) {
        fs.renameSync(path.join(singleEntry, f), path.join(destDir, f));
      }
      fs.rmdirSync(singleEntry);
    }
  }
}

async function processBuild(job: Job<BuildJob>): Promise<void> {
  await connectDB();

  const { buildId, repoUrl, branch, sourceType = 'repo', zipPath } = job.data;
  const workDir = path.join(BUILDS_DIR, buildId);
  const logLines: string[] = [];

  const flush = () => appendLog(buildId, logLines.join('\n\n---\n\n'));

  try {
    fs.mkdirSync(workDir, { recursive: true });

    if (sourceType === 'upload' && zipPath) {
      // ── Extract uploaded ZIP ──────────────────────────────────────
      await Build.findByIdAndUpdate(buildId, { status: 'extracting', startedAt: new Date() });
      logLines.push(`[upload] Extracting ${path.basename(zipPath)} ...`);
      await extractZip(zipPath, workDir);
      logLines.push(`[upload] Extraction complete`);
      // Clean up the uploaded zip to free disk space
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      await flush();
    } else {
      // ── Clone from Git ────────────────────────────────────────────
      await Build.findByIdAndUpdate(buildId, { status: 'cloning', startedAt: new Date() });
      await runCmd(`git clone --depth 1 -b ${branch} ${repoUrl} .`, workDir, logLines);
      await flush();
    }

    await setStatus(buildId, 'installing');
    await runCmd('npm install', workDir, logLines);
    await flush();

    await setStatus(buildId, 'building');
    await runCmd('npx expo prebuild --platform android --clean', workDir, logLines);

    // Write local.properties so Gradle can locate the Android SDK
    const localPropsPath = path.join(workDir, 'android', 'local.properties');
    fs.writeFileSync(localPropsPath, `sdk.dir=${ANDROID_HOME}\n`);
    logLines.push(`[setup] Wrote ${localPropsPath} with sdk.dir=${ANDROID_HOME}`);

    await runCmd('./gradlew assembleRelease --no-daemon', path.join(workDir, 'android'), logLines);
    await flush();

    const apkSrc  = path.join(workDir, 'android/app/build/outputs/apk/release/app-release.apk');
    const apkDest = path.join(BUILDS_DIR, `${buildId}.apk`);
    fs.copyFileSync(apkSrc, apkDest);

    // Get APK file size for display in the dashboard
    const apkStats = fs.statSync(apkDest);
    const apkSize = apkStats.size;

    await Build.findByIdAndUpdate(buildId, {
      status:      'success',
      apkPath:     apkDest,
      apkUrl:      `/api/builds/${buildId}/download`,
      apkSize:     apkSize,
      completedAt: new Date(),
      logs:        logLines.join('\n\n---\n\n'),
    });

    logLines.push(`\n✅ APK built successfully (${humanFileSize(apkSize)})`);
    await flush();

    fs.rmSync(workDir, { recursive: true, force: true });
    console.log(`[worker] Build ${buildId} succeeded — APK size: ${humanFileSize(apkSize)}`);

  } catch (err: any) {
    logLines.push(`\nFATAL ERROR: ${err.message}`);
    await Build.findByIdAndUpdate(buildId, {
      status:      'failed',
      completedAt: new Date(),
      logs:        logLines.join('\n\n---\n\n'),
    });
    fs.rmSync(workDir, { recursive: true, force: true });
    console.error(`[worker] Build ${buildId} failed:`, err.message);
  }
}

export const startWorker = () => {
  // Ensure the builds directory exists before accepting any jobs
  ensureBuildsDir();

  const worker = new Worker<BuildJob>('builds', processBuild, {
    connection: redisConnection,
    concurrency: 2,
  });

  worker.on('completed', (job) => console.log(`[worker] Job ${job.id} done`));
  worker.on('failed', (job, err) => console.error(`[worker] Job ${job?.id} failed`, err.message));

  console.log('[worker] Build worker started');
  return worker;
};