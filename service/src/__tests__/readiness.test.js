import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getReadinessState, completeSetup } from '../readiness.js';
import { get, run } from '../db.js';

const VALID_STATES = new Set([
  'READY',
  'CHECKING',
  'INSTALLING',
  'NEEDS_ACTION',
  'UNAVAILABLE',
  'DISABLED',
  'ERROR',
]);

const EXPECTED_COMPONENTS = [
  'core',
  'database',
  'memory',
  'permissions',
  'local_ai',
  'selected_model',
  'cloud_ai',
  'devices',
];

describe('Phoenix Centralized Readiness State Machine Tests', () => {
  it('should return all 8 required components with normalized status', async () => {
    const report = await getReadinessState();

    assert.ok(report, 'Report should be non-null');
    assert.equal(typeof report.ok, 'boolean', 'report.ok should be boolean');
    assert.equal(typeof report.first_run_complete, 'boolean', 'report.first_run_complete should be boolean');
    assert.ok(VALID_STATES.has(report.overall), `Overall state "${report.overall}" must be a valid normalized state`);

    for (const key of EXPECTED_COMPONENTS) {
      const comp = report.components[key];
      assert.ok(comp, `Component "${key}" must exist in report.components`);
      assert.ok(comp.label, `Component "${key}" must have a human-readable label`);
      assert.ok(
        VALID_STATES.has(comp.status),
        `Component "${key}" status "${comp.status}" must be one of: ${Array.from(VALID_STATES).join(', ')}`
      );
      assert.ok(typeof comp.message === 'string' && comp.message.length > 0, `Component "${key}" must have a non-empty message`);
    }
  });

  it('should accurately report database and memory local presence', async () => {
    const report = await getReadinessState();
    assert.equal(report.components.database.status, 'READY', 'Database should report READY');
    assert.equal(report.components.memory.status, 'READY', 'Memory should report READY');
    assert.match(report.components.database.message, /operational/i, 'Database message should confirm operational state');
    assert.match(report.components.memory.message, /local memory/i, 'Memory message should confirm local storage');
  });

  it('should persist first-run onboarding completion and update readiness state', async () => {
    // Complete setup with test parameters
    const testUser = 'Alex Testing';
    const res = completeSetup({
      userName: testUser,
      aiChoice: 'local',
      screenEnabled: true,
      voiceEnabled: false,
      activityEnabled: true,
    });

    assert.ok(res.ok, 'completeSetup should return ok: true');
    assert.equal(res.first_run_complete, true, 'completeSetup should return first_run_complete: true');

    // Verify written to database settings
    const row = get("SELECT value FROM settings WHERE key = 'first_run_complete'");
    assert.ok(row, 'first_run_complete row must exist in settings');
    assert.equal(row.value, '1', 'first_run_complete should be 1');

    const userRow = get("SELECT value FROM settings WHERE key = 'user_name'");
    assert.ok(userRow, 'user_name row must exist in settings');
    assert.equal(userRow.value, testUser, 'user_name should match saved name');

    // Query readiness state again and confirm first_run_complete is true
    const updatedReport = await getReadinessState();
    assert.equal(updatedReport.first_run_complete, true, 'Updated report should report first_run_complete: true');
    assert.equal(updatedReport.components.permissions.status, 'READY', 'Permissions should now be READY');
  });
});
