/**
 * @file connectivityService.ts
 * @description Background polling service that pings the active Subsonic server
 *   every 15 s and updates networkStore.isOffline. Used by ConnectivityMonitor
 *   and the Home screen auto-recovery logic.
 * @author DoodzProg
 * @version 0.9.1
 * @license CC-BY-NC-4.0
 */
import {getActiveServer, pingServer} from '../api/client';
import {useNetworkStore} from '../store/networkStore';

// ─── Utils ────────────────────────────────────────────────────────────────────

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('connectivity_timeout')), ms),
    ),
  ]);
}

// ─── Ping loop ────────────────────────────────────────────────────────────────

const INTERVAL_NORMAL_MS = 10_000;
const INTERVAL_DEGRADED_MS = 5_000;
const PING_TIMEOUT_MS = 5_000;

let timerId: ReturnType<typeof setTimeout> | null = null;
let active = false;

async function tick() {
  if (!active) return;
  const server = getActiveServer();
  if (!server) {
    schedule(INTERVAL_DEGRADED_MS);
    return;
  }
  try {
    await withTimeout(pingServer(server), PING_TIMEOUT_MS);
    // setOffline(false) + setServerReachable(true) handled by axios interceptor on success
    useNetworkStore.getState().setServerReachable(true);
    schedule(INTERVAL_NORMAL_MS);
  } catch {
    useNetworkStore.getState().setServerReachable(false);
    schedule(INTERVAL_DEGRADED_MS);
  }
}

function schedule(ms: number) {
  if (timerId) clearTimeout(timerId);
  if (!active) return;
  timerId = setTimeout(tick, ms);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function start(): () => void {
  active = true;
  tick();
  return stop;
}

export function stop() {
  active = false;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}
