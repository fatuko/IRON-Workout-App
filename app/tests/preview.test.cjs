const test = require('node:test');
const assert = require('node:assert/strict');
require('./register-typescript.cjs');
const preview = require('../src/auth/preview.ts');
const Module = require('node:module');
const resolve = Module._resolveFilename;
let repositories;
try {
  Module._resolveFilename = function(request, ...args) {
    return resolve.call(this, request === '@/lib/storage' ? require.resolve('../src/lib/storage.ts') : request, ...args);
  };
  repositories = require('../src/repositories/index.ts');
} finally { Module._resolveFilename = resolve; }

test('a late preview save cannot populate the next preview', async () => {
  repositories.setWorkoutUser('development-preview', true);
  const pending = repositories.workoutRepository.saveWorkoutTemplate({ id: 'old', name: 'Old preview', exercises: [] });
  repositories.setWorkoutUser(null);
  repositories.clearPreviewWorkouts();
  await pending;
  repositories.setWorkoutUser('development-preview', true);
  assert.deepEqual(await repositories.workoutRepository.getWorkoutTemplates(), []);
  repositories.setWorkoutUser(null);
  repositories.clearPreviewWorkouts();
});

test('preview is development-only, uses no real tokens, and resets on exit', async () => {
  global.__DEV__ = false;
  preview.startPreview();
  assert.equal(preview.getPreview().enabled, false);
  global.__DEV__ = true;
  preview.startPreview();
  assert.equal(preview.getPreview().session, null);
  const signup = await preview.previewAuth.signUp({ email: 'sample@example.com' });
  assert.equal(signup.data.session, null);
  preview.enterPreviewAccount();
  assert.equal(preview.getPreview().session.access_token, '');
  await preview.previewAuth.updateUser({ data: { first_name: 'Taylor', onboarding_complete: true }, password: 'not-saved' });
  assert.equal(preview.getPreview().session.user.user_metadata.first_name, 'Taylor');
  assert.equal(JSON.stringify(preview.getPreview()).includes('not-saved'), false);
  await assert.rejects(preview.previewAuth.setSession({}), /disabled in preview/);
  preview.exitPreview();
  assert.deepEqual(preview.getPreview(), { enabled: false, session: null });
});
