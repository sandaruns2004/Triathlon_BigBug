// Only public client settings may become Flutter compile-time defines.
import {readFile, writeFile} from 'node:fs/promises';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';

export function clientConfig(mobile, server) {
  const project = mobile.FIREBASE_PROJECT_ID || mobile.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const key = mobile.FIREBASE_API_KEY || mobile.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!project || project !== server.FIREBASE_PROJECT_ID ||
      project !== server.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      key !== server.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw Error('Mobile Firebase project/API key must match the website configuration.');
  }
  if (mobile.FIREBASE_API_KEY && mobile.NEXT_PUBLIC_FIREBASE_API_KEY &&
      mobile.FIREBASE_API_KEY !== mobile.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw Error('Conflicting mobile Firebase API key aliases.');
  }
  const app = mobile.FIREBASE_APP_ID;
  const sender = mobile.FIREBASE_SENDER_ID;
  if (!app || !sender || !app.startsWith(`1:${sender}:web:`)) {
    throw Error('Set FIREBASE_APP_ID and FIREBASE_SENDER_ID from the matching Firebase Web app.');
  }
  const api = new URL(mobile.API_BASE_URL || 'http://localhost:4183/api/mobile/v1/');
  if (!['http:', 'https:'].includes(api.protocol) || api.username || api.password ||
      !/\/api\/mobile\/v1\/?$/.test(api.pathname) || api.search || api.hash) {
    throw Error('API_BASE_URL must be an HTTP(S) mobile v1 endpoint.');
  }
  const socket = new URL(mobile.SOCKET_URL || mobile.NEXT_PUBLIC_SOCKET_URL || api.origin);
  if (!['http:', 'https:'].includes(socket.protocol) || socket.username || socket.password || socket.search || socket.hash) {
    throw Error('SOCKET_URL must be an HTTP(S) endpoint without credentials.');
  }
  const environment = mobile.APP_ENV || 'development';
  if (!['development', 'staging', 'production'].includes(environment) ||
      (environment !== 'development' && (api.protocol !== 'https:' || socket.protocol !== 'https:'))) {
    throw Error('Staging/production require HTTPS and a valid APP_ENV.');
  }
  return {APP_ENV: environment, APP_MODE: 'connected', API_BASE_URL: api.href,
    SOCKET_URL: socket.href, FIREBASE_PROJECT_ID: project, FIREBASE_API_KEY: key,
    FIREBASE_APP_ID: app, FIREBASE_SENDER_ID: sender};
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const mobile = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'));
    const server = parseEnv(await readFile(new URL('../../waypoint-flow/.env', import.meta.url), 'utf8'));
    const config = clientConfig(mobile, server);
    await writeFile(new URL('../config/chrome-connected.local.json', import.meta.url), JSON.stringify(config, null, 2)+'\n');
    console.log('Connected Chrome configuration generated; project matches website; server secrets excluded.');
  } catch (error) {
    console.error(error.code === 'ENOENT' ? 'Add waypoint-mobile/.env and waypoint-flow/.env first.' : error.message);
    process.exitCode = 1;
  }
}
