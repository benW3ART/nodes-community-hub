import { promises as fs } from 'fs';
import path from 'path';

export interface ConvergenceConfig {
  announceAt: string;
  snapshotAt: string;
  intermediateAt: string;
  revealAt: string;
  updatedAt: string;
}

const CONFIG_DIR = path.join(process.cwd(), 'public', 'data');
const CONFIG_PATH = path.join(CONFIG_DIR, 'convergence-config.json');
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function readConvergenceConfig(): Promise<ConvergenceConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ConvergenceConfig>;
    if (
      typeof parsed?.announceAt !== 'string' ||
      typeof parsed?.snapshotAt !== 'string' ||
      typeof parsed?.intermediateAt !== 'string' ||
      typeof parsed?.revealAt !== 'string' ||
      typeof parsed?.updatedAt !== 'string'
    ) {
      return null;
    }
    return parsed as ConvergenceConfig;
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

function parseIsoOrThrow(label: string, value: string): number {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty ISO string`);
  }
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) {
    throw new Error(`${label} is not a valid date`);
  }
  return ms;
}

export async function writeConvergenceConfig(dates: {
  announceAt: string;
  snapshotAt: string;
  intermediateAt: string;
  revealAt: string;
}): Promise<ConvergenceConfig> {
  const announceMs = parseIsoOrThrow('announceAt', dates.announceAt);
  const snapshotMs = parseIsoOrThrow('snapshotAt', dates.snapshotAt);
  const intermediateMs = parseIsoOrThrow('intermediateAt', dates.intermediateAt);
  const revealMs = parseIsoOrThrow('revealAt', dates.revealAt);

  // Monotonic order: announce < snapshot < intermediate < reveal
  if (!(announceMs < snapshotMs)) {
    throw new Error('announceAt must be before snapshotAt');
  }
  if (!(snapshotMs < intermediateMs)) {
    throw new Error('snapshotAt must be before intermediateAt');
  }
  if (!(intermediateMs < revealMs)) {
    throw new Error('intermediateAt must be before revealAt');
  }

  const now = Date.now();
  if (revealMs <= now) {
    throw new Error('revealAt must be in the future');
  }
  if (revealMs - now > ONE_YEAR_MS) {
    throw new Error('revealAt must be less than 1 year in the future');
  }

  const config: ConvergenceConfig = {
    announceAt: new Date(announceMs).toISOString(),
    snapshotAt: new Date(snapshotMs).toISOString(),
    intermediateAt: new Date(intermediateMs).toISOString(),
    revealAt: new Date(revealMs).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };

  await fs.mkdir(CONFIG_DIR, { recursive: true });

  // Atomic write: write to tmp then rename
  const tmpPath = `${CONFIG_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(config, null, 2), 'utf-8');
  await fs.rename(tmpPath, CONFIG_PATH);

  return config;
}
