import { promises as fs } from 'fs';
import path from 'path';

export interface ConvergenceConfig {
  revealAt: string;
  updatedAt: string;
}

const CONFIG_DIR = path.join(process.cwd(), 'public', 'data');
const CONFIG_PATH = path.join(CONFIG_DIR, 'convergence-config.json');
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function readConvergenceConfig(): Promise<ConvergenceConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as ConvergenceConfig;
    if (typeof parsed?.revealAt !== 'string' || typeof parsed?.updatedAt !== 'string') {
      return null;
    }
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

export async function writeConvergenceConfig(revealAtIso: string): Promise<ConvergenceConfig> {
  if (typeof revealAtIso !== 'string' || revealAtIso.length === 0) {
    throw new Error('revealAt must be a non-empty ISO string');
  }

  const revealDate = new Date(revealAtIso);
  const revealMs = revealDate.getTime();
  if (Number.isNaN(revealMs)) {
    throw new Error('revealAt is not a valid date');
  }

  const now = Date.now();
  if (revealMs <= now) {
    throw new Error('revealAt must be in the future');
  }
  if (revealMs - now > ONE_YEAR_MS) {
    throw new Error('revealAt must be less than 1 year in the future');
  }

  const config: ConvergenceConfig = {
    revealAt: revealDate.toISOString(),
    updatedAt: new Date(now).toISOString(),
  };

  await fs.mkdir(CONFIG_DIR, { recursive: true });

  // Atomic write: write to tmp then rename
  const tmpPath = `${CONFIG_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(config, null, 2), 'utf-8');
  await fs.rename(tmpPath, CONFIG_PATH);

  return config;
}
