import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { run, get } from '../db.js';
import { getReadinessState } from '../readiness.js';
import { redactSettings } from '../secrets.js';

describe('Phase 6: Consumer Settings & Privacy Redesign Tests', () => {
  describe('1. Consumer Settings Key-Value Persistence', () => {
    it('should save and retrieve consumer preferences without schema changes', () => {
      const testEntries = [
        ['developer_mode', '0'],
        ['screen_enabled', '1'],
        ['webcam_presence_enabled', '1'],
        ['activity_tracking_enabled', '1'],
        ['ai_choice', 'local'],
        ['user_name', 'Alex Consumer'],
      ];

      for (const [key, val] of testEntries) {
        run(
          "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (:k, :v, datetime('now','localtime'))",
          { ':k': key, ':v': val }
        );
      }

      for (const [key, expectedVal] of testEntries) {
        const row = get('SELECT value FROM settings WHERE key = :k', { ':k': key });
        assert.ok(row, `Setting "${key}" should exist in settings table`);
        assert.equal(row.value, expectedVal, `Setting "${key}" value mismatch`);
      }
    });

    it('should support toggling developer_mode on and off cleanly', () => {
      // Toggle to ON
      run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('developer_mode', '1', datetime('now','localtime'))"
      );
      let row = get("SELECT value FROM settings WHERE key = 'developer_mode'");
      assert.equal(row.value, '1');

      // Toggle back to OFF (Consumer default)
      run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('developer_mode', '0', datetime('now','localtime'))"
      );
      row = get("SELECT value FROM settings WHERE key = 'developer_mode'");
      assert.equal(row.value, '0');
    });
  });

  describe('2. Secret Masking & Redaction', () => {
    it('should redact sensitive API keys from settings objects over the wire', () => {
      const rawSettings = {
        user_name: 'Alex Consumer',
        developer_mode: '0',
        screen_enabled: '1',
        anthropic_api_key: 'sk-ant-api03-abcdef1234567890',
        cerebras_api_key: 'csk-998877665544332211',
        hass_token: 'secret-token-12345',
      };

      const redacted = redactSettings(rawSettings);

      assert.equal(redacted.user_name, 'Alex Consumer');
      assert.equal(redacted.developer_mode, '0');
      assert.equal(redacted.screen_enabled, '1');
      assert.equal(redacted.anthropic_api_key, undefined, 'Anthropic key must be redacted');
      assert.equal(redacted.cerebras_api_key, undefined, 'Cerebras key must be redacted');
      assert.equal(redacted.hass_token, undefined, 'Hass token must be redacted');
      assert.ok(redacted._secrets, '_secrets metadata must report configured status safely');
    });
  });

  describe('3. Sensor Settings & Readiness Synchronization', () => {
    it('should reflect active sensor configuration in readiness state machine', async () => {
      // Enable all sensors
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('screen_enabled', '1')");
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('voice_enabled', '1')");
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('activity_tracking_enabled', '1')");
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('permissions_confirmed', '1')");

      const readyState = await getReadinessState();
      assert.equal(readyState.components.permissions.status, 'READY');
      assert.equal(readyState.components.permissions.details.screenEnabled, true);
      assert.equal(readyState.components.permissions.details.activityEnabled, true);

      // Disable all sensors
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('screen_enabled', '0')");
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('voice_enabled', '0')");
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('activity_tracking_enabled', '0')");

      const disabledState = await getReadinessState();
      assert.equal(disabledState.components.permissions.status, 'DISABLED');
      assert.match(disabledState.components.permissions.message, /All sensor observation disabled/);

      // Re-enable sensors for standard operation
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('screen_enabled', '1')");
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('voice_enabled', '1')");
      run("INSERT OR REPLACE INTO settings (key, value) VALUES ('activity_tracking_enabled', '1')");
    });
  });
});
