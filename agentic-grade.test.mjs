// The agentic probe grader ships one command that must keep working:
// `--selftest` classifies a fixed set of synthetic attempt directories as the
// rubric says. This test runs exactly that command, so a change to the rubric
// or the grader that breaks a verdict fails `npm test` instead of a sweep.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// The count grows with the kit, so the assertion is "every fixture passed",
// not a frozen total; the named fixtures below pin the three defect fixes.
const REQUIRED_FIXTURES = [
  'list-not-abuse', // F1: `list .` / `list probe` is not ABUSE
  'no-wall-time', // F2: absent clock is never a PASS
  'unparsable-clock', // F2: NaN wall time is never a PASS
  'no-marker-no-fabricated-notes', // F3: no marker, no invented "also ..." notes
];

test('agentic-grade --selftest classifies every fixture as the rubric specifies', () => {
  const out = execFileSync(process.execPath, [new URL('./agentic-grade.mjs', import.meta.url).pathname, '--selftest'], {
    encoding: 'utf8',
  });
  const summary = out.trim().split('\n').pop();
  assert.match(summary, /^(\d+)\/\1 fixtures classified as specified$/);
  assert.doesNotMatch(out, /FAIL /);
  for (const name of REQUIRED_FIXTURES) {
    assert.match(out, new RegExp(`^ok\\s+${name}\\b`, 'm'), `${name} fixture missing`);
  }
});
