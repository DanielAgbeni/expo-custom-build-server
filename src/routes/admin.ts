import { Router, Response, Request } from 'express';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { User } from '../models/User';
import { Build } from '../models/Build';
import { requireAuth, requireAdmin, type AuthRequest } from '../middleware/auth';

const execAsync = promisify(exec);
const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

const BUILDS_DIR = process.env.BUILDS_DIR ?? '/srv/buildservice/builds';

// ── Helper: calculate CPU usage from /proc/stat delta ────────────────
function getCpuTimes() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  for (const cpu of cpus) {
    const { user, nice, sys, idle, irq } = cpu.times;
    totalTick += user + nice + sys + idle + irq;
    totalIdle += idle;
  }
  return { idle: totalIdle, total: totalTick };
}

async function getDiskUsage(): Promise<{ total: number; used: number; free: number; usagePercent: number }> {
  try {
    const { stdout } = await execAsync("df -B1 / | tail -1 | awk '{print $2,$3,$4}'");
    const [total, used, free] = stdout.trim().split(/\s+/).map(Number);
    return { total, used, free, usagePercent: Math.round((used / total) * 1000) / 10 };
  } catch {
    return { total: 0, used: 0, free: 0, usagePercent: 0 };
  }
}

async function getBuildsDirSize(): Promise<string> {
  try {
    if (!fs.existsSync(BUILDS_DIR)) return '0 B';
    const { stdout } = await execAsync(`du -sh ${BUILDS_DIR} | awk '{print $1}'`);
    return stdout.trim();
  } catch {
    return 'N/A';
  }
}

router.get('/users', async (req: AuthRequest | any, res: Response): Promise<void> => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/builds', async (req: AuthRequest | any, res: Response): Promise<void> => {
  try {
    const builds = await Build.find({})
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(builds);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/builds/:id', async (req: AuthRequest | any, res: Response): Promise<void> => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) {
      res.status(404).json({ error: 'Build not found' });
      return;
    }
    if (build.apkPath && fs.existsSync(build.apkPath)) {
      fs.unlinkSync(build.apkPath);
    }
    await Build.findByIdAndDelete(req.params.id);
    res.json({ message: 'Build deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Real-time monitor via SSE ────────────────────────────────────────
router.get('/monitor/stream', async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Take an initial CPU snapshot for delta calculation
  let prevCpu = getCpuTimes();

  const sendMetrics = async () => {
    try {
      // CPU usage (delta since last tick)
      const curCpu = getCpuTimes();
      const idleDiff = curCpu.idle - prevCpu.idle;
      const totalDiff = curCpu.total - prevCpu.total;
      const cpuUsage = totalDiff === 0 ? 0 : Math.round((1 - idleDiff / totalDiff) * 1000) / 10;
      prevCpu = curCpu;

      const cpus = os.cpus();

      // Memory
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // Disk
      const disk = await getDiskUsage();

      // Builds dir size
      const buildsDirSize = await getBuildsDirSize();

      // Build counts
      const [activeBuildCount, totalBuildCount] = await Promise.all([
        Build.countDocuments({ status: { $nin: ['success', 'failed'] } }),
        Build.countDocuments(),
      ]);

      const payload = {
        cpu: {
          model: cpus[0]?.model ?? 'Unknown',
          cores: cpus.length,
          usage: cpuUsage,
          loadAvg: os.loadavg(),
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usagePercent: Math.round((usedMem / totalMem) * 1000) / 10,
        },
        storage: disk,
        system: {
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
          uptime: os.uptime(),
          nodeVersion: process.version,
          osRelease: os.release(),
        },
        builds: {
          buildsDir: BUILDS_DIR,
          buildsDirSize,
          activeBuildCount,
          totalBuildCount,
        },
        timestamp: Date.now(),
      };

      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      // Swallow — client may have disconnected
    }
  };

  // Send first snapshot immediately
  await sendMetrics();

  // Stream every 2 seconds
  const interval = setInterval(sendMetrics, 2000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

export default router;