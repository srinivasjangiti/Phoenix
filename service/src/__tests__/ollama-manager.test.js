import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { RECOMMENDED_MODELS, getRecommendedModel } from '../models-catalog.js';
import {
  getOllamaBinaryPath,
  probeOllamaHttp,
  getOllamaStatus,
  pullModelStream,
  cancelActivePull,
  getActivePullProgress,
  testModelInference,
  selectLocalModel,
} from '../ollama-manager.js';
import { getReadinessState } from '../readiness.js';
import { getModelForPurpose, setModelForPurpose } from '../db.js';

describe('Phase 3: Ollama & Local AI Productization Tests', () => {
  describe('1. Model Catalog Integrity', () => {
    it('should export RECOMMENDED_MODELS with required schema', () => {
      assert.ok(Array.isArray(RECOMMENDED_MODELS), 'RECOMMENDED_MODELS should be an array');
      assert.ok(RECOMMENDED_MODELS.length >= 2, 'Should have at least 2 recommended models');

      for (const m of RECOMMENDED_MODELS) {
        assert.ok(m.id, 'Model must have id');
        assert.ok(m.name, 'Model must have name');
        assert.ok(m.tag, 'Model must have tag');
        assert.ok(m.purpose, 'Model must have purpose');
        assert.ok(m.estimatedDownloadSize, 'Model must display estimated download size');
        assert.match(m.estimatedDownloadSize, /estimate/i, 'Download size must be clearly labeled as estimate');
        assert.ok(m.estimatedMemoryUsage, 'Model must display estimated memory usage');
        assert.match(m.estimatedMemoryUsage, /estimate/i, 'Memory usage must be clearly labeled as estimate');
      }
    });

    it('should recommend llama3.2:1b as default lightweight assistant', () => {
      const rec = getRecommendedModel('llama3.2:1b');
      assert.ok(rec, 'llama3.2:1b must exist in catalog');
      assert.equal(rec.recommended, true, 'llama3.2:1b should be marked as recommended');
    });
  });

  describe('2. Detection & Lifecycle Ownership', () => {
    it('should detect binary or return valid path/null without crashing', () => {
      const bin = getOllamaBinaryPath();
      if (bin) {
        assert.equal(typeof bin, 'string');
        assert.ok(bin.length > 0);
      } else {
        assert.equal(bin, null);
      }
    });

    it('should detect Ollama status with ownership classification', async () => {
      const status = await getOllamaStatus();
      assert.ok(status, 'Status must not be null');
      assert.equal(typeof status.installed, 'boolean', 'installed must be boolean');
      assert.equal(typeof status.running, 'boolean', 'running must be boolean');
      assert.ok(['EXTERNAL_UNMANAGED', 'PHOENIX_MANAGED', 'UNKNOWN'].includes(status.ownership),
        `Ownership must be valid enum, got ${status.ownership}`);
      assert.ok(Array.isArray(status.models), 'models must be an array');
      assert.ok(Array.isArray(status.recommended), 'recommended must be an array');
    });

    it('should never kill or stop external unmanaged Ollama', async () => {
      const status = await getOllamaStatus();
      if (status.running) {
        // If Ollama is currently running externally, ownership must be EXTERNAL_UNMANAGED
        assert.equal(status.ownership, 'EXTERNAL_UNMANAGED',
          'Phoenix must treat pre-existing running Ollama as EXTERNAL_UNMANAGED');
      }
    });
  });

  describe('3. Pull Progress State & Cancellation', () => {
    it('should cleanly initialize and cancel pull state without orphan operations', () => {
      // Check initial progress
      const initial = getActivePullProgress();
      assert.equal(typeof initial.active, 'boolean');

      // Cancel pull should return clean response
      const cancelRes = cancelActivePull();
      assert.ok(cancelRes.ok, 'Cancel must return ok: true');

      const afterCancel = getActivePullProgress();
      assert.equal(afterCancel.active, false, 'active must be false after cancellation');
    });
  });

  describe('4. Readiness Truth Integration (Zero Fake Readiness)', () => {
    let originalSelection = null;

    before(() => {
      const current = getModelForPurpose('chat_local');
      originalSelection = current ? current.model : null;
    });

    after(() => {
      if (originalSelection) {
        setModelForPurpose('chat_local', originalSelection);
      }
    });

    it('should report NEEDS_ACTION honestly if selected model is not installed', async () => {
      // Set a deliberately missing model
      const nonexistentModel = 'completely-fake-model-xyz:999b';
      setModelForPurpose('chat_local', 'ollama@local', nonexistentModel);

      const readiness = await getReadinessState();
      const comp = readiness.components.selected_model;

      assert.ok(comp, 'selected_model component must exist');
      // If Ollama is running, it must report NEEDS_ACTION with honest message
      if (readiness.components.local_ai.status === 'READY') {
        assert.equal(comp.status, 'NEEDS_ACTION', 'Selected model must be NEEDS_ACTION when model is not installed');
        assert.match(comp.message, /not installed/i, 'Message must state model is not installed');
        assert.doesNotMatch(comp.message, /substituted/i, 'Must never fabricate substitution');
      }
    });
  });
});
