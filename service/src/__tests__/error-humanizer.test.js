import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { humanizeError, sanitizeDiagnostics } from '../error-humanizer.js';

describe('Phase 4: Error Humanizer & Recovery System Tests', () => {

  describe('1. PII and Secret Diagnostics Sanitizer', () => {
    it('should scrub Anthropic API keys from technical strings', () => {
      const raw = 'Error calling https://api.anthropic.com with key sk-ant-api03-abcdef1234567890abcdef1234567890';
      const clean = sanitizeDiagnostics(raw);
      assert(!clean.includes('sk-ant-api03-'), 'Must scrub Anthropic key');
      assert(clean.includes('[REDACTED_ANTHROPIC_KEY]'), 'Must replace with redaction token');
    });

    it('should scrub generic sk API keys, Cerebras, and Groq keys', () => {
      const raw = 'Keys: sk-123456789012345678901234 and csk-abcdef1234567890 and gsk_1234567890abcdef';
      const clean = sanitizeDiagnostics(raw);
      assert(!clean.includes('sk-123456789012345678901234'));
      assert(!clean.includes('csk-abcdef1234567890'));
      assert(!clean.includes('gsk_1234567890abcdef'));
      assert(clean.includes('[REDACTED_API_KEY]'));
      assert(clean.includes('[REDACTED_CEREBRAS_KEY]'));
      assert(clean.includes('[REDACTED_GROQ_KEY]'));
    });

    it('should scrub Bearer authorization tokens', () => {
      const raw = 'Request header Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const clean = sanitizeDiagnostics(raw);
      assert(!clean.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
      assert(clean.includes('Bearer [REDACTED_TOKEN]'));
    });

    it('should scrub 64-char hex database encryption keys', () => {
      const raw = 'Key: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      const clean = sanitizeDiagnostics(raw);
      assert(!clean.includes('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'));
      assert(clean.includes('[REDACTED_KEY_HEX]'));
    });

    it('should scrub user home directory paths', () => {
      const raw = 'Exception at C:\\Users\\Administrator\\Personal Coding\\Phoenix\\service\\src\\server.js:42';
      const clean = sanitizeDiagnostics(raw);
      assert(!clean.includes('Administrator'), 'Must not leak Windows username');
      assert(clean.includes('~\\') || clean.includes('<user>'));
    });
  });

  describe('2. Local AI & Ollama Failure Modes', () => {
    it('should humanize ECONNREFUSED 11434 to LOCAL_AI_OFFLINE with start action', () => {
      const err = new Error('connect ECONNREFUSED 127.0.0.1:11434');
      err.code = 'ECONNREFUSED';
      const card = humanizeError(err);

      assert.equal(card.code, 'LOCAL_AI_OFFLINE');
      assert.equal(card.severity, 'warning');
      assert.equal(card.title, 'Local AI Engine is Sleeping');
      assert(card.description.includes('Ollama is installed'), 'Must explain Ollama in plain language');
      assert.equal(card.primary_action?.action_type, 'api_call');
      assert.equal(card.primary_action?.endpoint, '/api/v1/ollama/start');
      assert.equal(card.primary_action?.method, 'POST');
      assert.equal(card.primary_action?.label, 'Wake Up Local AI');
      assert.equal(card.secondary_action?.action_type, 'navigate');
      assert.equal(card.secondary_action?.target, '/settings');
    });

    it('should humanize Ollama 404 to MODEL_NOT_DOWNLOADED with pull action', () => {
      const err = new Error('Ollama 404: {"error":"model \'llama3.2:1b\' not found"}');
      const card = humanizeError(err);

      assert.equal(card.code, 'MODEL_NOT_DOWNLOADED');
      assert.equal(card.severity, 'warning');
      assert.equal(card.title, 'AI Model Needs Download');
      assert(card.description.includes('llama3.2:1b'), 'Description must include detected model name');
      assert.equal(card.primary_action?.action_type, 'api_call');
      assert.equal(card.primary_action?.endpoint, '/api/v1/ollama/pull');
      assert.equal(card.primary_action?.method, 'POST');
      assert.deepEqual(card.primary_action?.body, { model: 'llama3.2:1b' });
      assert.equal(card.primary_action?.label, 'Download llama3.2:1b');
    });
  });

  describe('3. Database & System Failure Modes', () => {
    it('should humanize SQLITE_BUSY to DATABASE_BUSY with retry action', () => {
      const err = new Error('SqliteError: database is locked');
      err.code = 'SQLITE_BUSY';
      const card = humanizeError(err);

      assert.equal(card.code, 'DATABASE_BUSY');
      assert.equal(card.severity, 'info');
      assert.equal(card.title, 'Memory is Saving Notes');
      assert.equal(card.primary_action?.action_type, 'retry');
      assert.equal(card.secondary_action?.action_type, 'dismiss');
    });

    it('should humanize EADDRINUSE to PORT_IN_USE', () => {
      const err = new Error('listen EADDRINUSE: address already in use :::7777');
      err.code = 'EADDRINUSE';
      const card = humanizeError(err);

      assert.equal(card.code, 'PORT_IN_USE');
      assert.equal(card.severity, 'error');
      assert.equal(card.title, 'Port is Already in Use');
      assert.equal(card.primary_action?.action_type, 'retry');
    });
  });

  describe('4. Cloud & Network Failure Modes', () => {
    it('should humanize 401 Unauthorized to CLOUD_AUTH_ERROR with settings navigation', () => {
      const err = new Error('Claude API error: 401 unauthorized - invalid x-api-key');
      err.status = 401;
      const card = humanizeError(err);

      assert.equal(card.code, 'CLOUD_AUTH_ERROR');
      assert.equal(card.severity, 'warning');
      assert.equal(card.title, 'Cloud AI Key Needs Attention');
      assert.equal(card.primary_action?.action_type, 'navigate');
      assert.equal(card.primary_action?.target, '/settings');
      assert.equal(card.secondary_action?.action_type, 'api_call');
      assert.deepEqual(card.secondary_action?.body, { ai_choice: 'local' });
    });

    it('should humanize 429 Rate Limit to CLOUD_RATE_LIMIT', () => {
      const err = new Error('Rate limit exceeded: 429 too many requests');
      err.status = 429;
      const card = humanizeError(err);

      assert.equal(card.code, 'CLOUD_RATE_LIMIT');
      assert.equal(card.severity, 'warning');
      assert.equal(card.title, 'Cloud Provider is Busy');
      assert.equal(card.primary_action?.action_type, 'api_call');
      assert.deepEqual(card.primary_action?.body, { ai_choice: 'local' });
    });

    it('should humanize fetch failure / network disconnect to NETWORK_DISCONNECTED', () => {
      const err = new Error('TypeError: fetch failed');
      err.code = 'ENOTFOUND';
      const card = humanizeError(err);

      assert.equal(card.code, 'NETWORK_DISCONNECTED');
      assert.equal(card.severity, 'warning');
      assert.equal(card.title, 'Connection Interrupted');
    });

    it('should fall back cleanly to RUNTIME_ERROR for unknown exceptions', () => {
      const err = new TypeError('Cannot read properties of undefined (reading "foo")');
      const card = humanizeError(err);

      assert.equal(card.code, 'RUNTIME_ERROR');
      assert.equal(card.severity, 'error');
      assert.equal(card.title, 'Something Interrupted Phoenix');
      assert.equal(card.primary_action?.action_type, 'retry');
      assert.equal(card.secondary_action?.action_type, 'copy');
    });
  });

});
