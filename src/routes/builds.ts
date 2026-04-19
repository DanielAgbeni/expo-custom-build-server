import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import multer from 'multer';
import { buildQueue } from '../queues/buildQueue';
import { Build } from '../models/Build';
import { requireAuth, type AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const BUILDS_DIR = process.env.BUILDS_DIR ?? '/srv/buildservice/builds';

// Multer config — store zips in the builds directory
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(BUILDS_DIR, { recursive: true });
    cb(null, BUILDS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `upload-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}.zip`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.originalname.endsWith('.zip')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .zip files are allowed'));
    }
  },
});

// ── Trigger build from Git repo ──────────────────────────────────────
router.post('/', async (req: AuthRequest | any, res: Response): Promise<void> => {
  try {
    const { repoUrl, branch = 'main' } = req.body;
    if (!repoUrl) {
      res.status(400).json({ error: 'repoUrl is required' });
      return;
    }
    const build = await Build.create({ userId: new mongoose.Types.ObjectId(req.userId), repoUrl, branch, sourceType: 'repo' });
    await buildQueue.add('build', {
      buildId: build._id.toString(),
      repoUrl,
      userId:  req.userId,
      branch,
      sourceType: 'repo',
    });
    res.status(201).json(build);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Trigger build from uploaded ZIP ──────────────────────────────────
router.post('/upload', upload.single('file'), async (req: AuthRequest | any, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'A .zip file is required' });
      return;
    }

    const zipPath = req.file.path;
    const originalFilename = req.file.originalname;

    const build = await Build.create({
      userId: new mongoose.Types.ObjectId(req.userId),
      repoUrl: `upload://${originalFilename}`,
      branch: 'n/a',
      sourceType: 'upload',
      originalFilename,
    });

    await buildQueue.add('build', {
      buildId: build._id.toString(),
      repoUrl: `upload://${originalFilename}`,
      userId:  req.userId,
      branch:  'n/a',
      sourceType: 'upload',
      zipPath,
    });

    res.status(201).json(build);
  } catch (err: any) {
    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req: AuthRequest | any, res: Response): Promise<void> => {
  const builds = await Build.find({ userId: new mongoose.Types.ObjectId(req.userId) })
    .sort({ createdAt: -1 })
    .select('-logs')
    .limit(50);
  res.json(builds);
});

router.get('/:id', async (req: AuthRequest | any, res: Response): Promise<void> => {
  const build = await Build.findOne({ _id: req.params.id, userId: new mongoose.Types.ObjectId(req.userId) });
  if (!build) { res.status(404).json({ error: 'Build not found' }); return; }
  res.json(build);
});

router.get('/:id/download', async (req: AuthRequest | any, res: Response): Promise<void> => {
  const build = await Build.findOne({ _id: req.params.id, userId: new mongoose.Types.ObjectId(req.userId) });
  if (!build?.apkPath || !fs.existsSync(build.apkPath)) {
    res.status(404).json({ error: 'APK not ready or not found' });
    return;
  }
  res.download(build.apkPath, `build-${req.params.id}.apk`);
});

router.post('/:id/retry', async (req: AuthRequest | any, res: Response): Promise<void> => {
  try {
    const build = await Build.findOne({ _id: req.params.id, userId: new mongoose.Types.ObjectId(req.userId) });
    if (!build) { res.status(404).json({ error: 'Build not found' }); return; }
    if (build.status !== 'failed') {
      res.status(400).json({ error: 'Only failed builds can be retried' });
      return;
    }

    // Reset build state
    build.status = 'queued';
    build.logs = '';
    build.apkPath = undefined;
    build.apkUrl = undefined;
    build.apkSize = undefined;
    await build.save();

    // Re-queue the build job
    await buildQueue.add('build', {
      buildId: build._id.toString(),
      repoUrl: build.repoUrl,
      userId:  req.userId,
      branch:  build.branch,
      sourceType: build.sourceType ?? 'repo',
    });

    res.json(build);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/logs', async (req: AuthRequest | any, res: Response): Promise<void> => {
  const build = await Build.findOne({ _id: req.params.id, userId: new mongoose.Types.ObjectId(req.userId) });
  if (!build) {
    res.status(404).json({ error: 'Build not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  let lastLength = 0;
  const sendLogs = async () => {
    try {
      const currentBuild = await Build.findById(build._id);
      if (!currentBuild) return;
      const newLogs = currentBuild.logs.slice(lastLength);
      if (newLogs) {
        res.write(`data: ${JSON.stringify({ logs: newLogs })}\n\n`);
        lastLength = currentBuild.logs.length;
      }
      if (['success', 'failed'].includes(currentBuild.status)) {
        res.write(`data: ${JSON.stringify({ done: true, status: currentBuild.status })}\n\n`);
        res.end();
        return;
      }
    } catch (err) {
      res.end();
    }
  };

  // Send initial logs
  await sendLogs();

  // Poll every 2 seconds
  const interval = setInterval(sendLogs, 2000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

router.delete('/:id', async (req: AuthRequest | any, res: Response): Promise<void> => {
  try {
    const build = await Build.findOne({ _id: req.params.id, userId: new mongoose.Types.ObjectId(req.userId) });
    if (!build) {
      res.status(404).json({ error: 'Build not found' });
      return;
    }
    // Don't allow deleting active builds
    if (!['success', 'failed'].includes(build.status)) {
      res.status(400).json({ error: 'Cannot delete an active build' });
      return;
    }
    // Clean up APK file if it exists
    if (build.apkPath && fs.existsSync(build.apkPath)) {
      fs.unlinkSync(build.apkPath);
    }
    await Build.findByIdAndDelete(req.params.id);
    res.json({ message: 'Build deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;