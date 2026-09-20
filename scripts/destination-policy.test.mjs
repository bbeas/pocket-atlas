import test from 'node:test';
import assert from 'node:assert/strict';
import { canBrowsePlace } from '../src/destination-policy.js';

test('Shanghai stays hoverable but cannot open an album or appear in Travel Trails', () => {
  const shanghai = { id: 'shanghai', visited: true, hoverOnly: true };
  const paris = { id: 'paris', visited: true };
  assert.equal(shanghai.visited, true);
  assert.equal(canBrowsePlace(shanghai), false);
  assert.deepEqual([shanghai, paris].filter(canBrowsePlace), [paris]);
});
test('Other visited places stay selectable; decorative or missing landmarks do not', () => {
  assert.equal(canBrowsePlace({ visited: true }), true);
  assert.equal(canBrowsePlace({ visited: false }), false);
  assert.equal(canBrowsePlace(null), false);
  assert.equal(canBrowsePlace(undefined), false);
});
