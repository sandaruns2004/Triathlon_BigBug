import test from 'node:test';
import assert from 'node:assert/strict';
import {clientConfig} from './configure-connected.mjs';
const server = {FIREBASE_PROJECT_ID:'test-project', NEXT_PUBLIC_FIREBASE_PROJECT_ID:'test-project', NEXT_PUBLIC_FIREBASE_API_KEY:'public-key'};
const mobile = {FIREBASE_PROJECT_ID:'test-project', FIREBASE_API_KEY:'public-key', FIREBASE_APP_ID:'1:123:web:abc', FIREBASE_SENDER_ID:'123'};
test('allowlist excludes copied server secrets and emulator settings', () => {
  const config = clientConfig({...mobile, FIREBASE_PRIVATE_KEY:'private', AWS_SECRET_ACCESS_KEY:'secret', NEXTAUTH_SECRET:'secret', AUTH_EMULATOR_HOST:'127.0.0.1'}, server);
  assert.equal(config.APP_MODE, 'connected');
  assert.equal(config.API_BASE_URL, 'http://localhost:4183/api/mobile/v1/');
  assert.deepEqual(Object.keys(config).sort(), ['APP_ENV','APP_MODE','API_BASE_URL','SOCKET_URL','FIREBASE_PROJECT_ID','FIREBASE_API_KEY','FIREBASE_APP_ID','FIREBASE_SENDER_ID'].sort());
});
test('rejects wrong project, key, app, endpoint and insecure production', () => {
  for (const patch of [{FIREBASE_PROJECT_ID:'other'}, {FIREBASE_API_KEY:'other'}, {NEXT_PUBLIC_FIREBASE_API_KEY:'other'}, {FIREBASE_APP_ID:''}, {FIREBASE_SENDER_ID:'999'}, {API_BASE_URL:'http://localhost/api'}, {API_BASE_URL:'http://user:password@localhost/api/mobile/v1/'}, {APP_ENV:'production'}]) {
    assert.throws(() => clientConfig({...mobile, ...patch}, server));
  }
});
