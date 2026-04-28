import axios from 'axios';
import qs from 'qs';
import type {Server} from '../store/settingsStore';
import {useNetworkStore} from '../store/networkStore';

const PERMANENT_ERROR_PATTERNS = [
  'ext-deezer',
  'media file not found',
  'local track not available',
];

export class SubsonicError extends Error {
  isPermanent: boolean;
  constructor(message: string) {
    super(message);
    this.name = 'SubsonicError';
    this.isPermanent = PERMANENT_ERROR_PATTERNS.some(p =>
      message.toLowerCase().includes(p.toLowerCase()),
    );
  }
}

axios.interceptors.response.use(
  res => {
    const store = useNetworkStore.getState();
    store.setOffline(false);
    store.setServerReachable(true);
    return res;
  },
  err => {
    if (!err.response && err.message === 'Network Error') {
      useNetworkStore.getState().setOffline(true);
    }
    return Promise.reject(err);
  },
);

let _server: Server | null = null;

export function configureClient(server: Server) {
  _server = server;
}

export function getActiveServer(): Server | null {
  return _server;
}

export function getStreamUrl(songId: string): string {
  if (!_server) throw new Error('No server configured');
  const {url, username, password} = _server;
  const base = url.replace(/\/$/, '');
  const p = new URLSearchParams({id: songId, u: username, p: password, v: '1.16.1', c: 'Musonic'});
  return `${base}/rest/stream.view?${p.toString()}`;
}

export function getCoverArtUrl(id: string, size = 300): string {
  if (!_server) throw new Error('No server configured');
  const {url, username, password} = _server;
  const base = url.replace(/\/$/, '');
  const p = new URLSearchParams({id, size: String(size), u: username, p: password, v: '1.16.1', c: 'Musonic'});
  return `${base}/rest/getCoverArt.view?${p.toString()}`;
}

export async function subsonicGet<T>(
  endpoint: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  if (!_server) throw new Error('No server configured');
  const {url, username, password} = _server;

  const res = await axios.get(`${url.replace(/\/$/, '')}/rest/${endpoint}`, {
    params: {
      u: username,
      p: password,
      v: '1.16.1',
      c: 'Musonic',
      f: 'json',
      ...params,
    },
    paramsSerializer: {
      serialize: p => qs.stringify(p, {arrayFormat: 'repeat'}),
    },
    timeout: 10000,
  });

  const body = res.data['subsonic-response'];
  if (body.status !== 'ok') {
    throw new SubsonicError(body.error?.message ?? 'Subsonic error');
  }
  return body as T;
}

export async function pingServer(server: Server): Promise<void> {
  const res = await axios.get(
    `${server.url.replace(/\/$/, '')}/rest/ping.view`,
    {
      params: {
        u: server.username,
        p: server.password,
        v: '1.16.1',
        c: 'Musonic',
        f: 'json',
      },
      timeout: 8000,
    },
  );
  const body = res.data['subsonic-response'];
  if (body.status !== 'ok') {
    throw new Error(body.error?.message ?? 'Auth failed');
  }
}
