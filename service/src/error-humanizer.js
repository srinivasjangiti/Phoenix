/**
 * Phoenix Error Humanizer & Recovery System (Phase 4)
 *
 * Converts technical, cryptic exceptions into reassuring, consumer-grade error
 * cards with plain-language explanations, one-click automated recovery actions,
 * and sanitized diagnostic details.
 */

import os from 'os';

/**
 * Strips personal identifiers, Windows usernames, home paths, and API keys from technical strings.
 *
 * @param {string} text - Raw technical diagnostic string or stack trace
 * @returns {string} Sanitized diagnostic string safe for display
 */
export function sanitizeDiagnostics(text) {
  if (!text) return '';
  let sanitized = String(text);

  try {
    // 1. Scrub Windows user home directory & username
    const userProfile = process.env.USERPROFILE || (os.userInfo ? os.userInfo().homedir : '');
    if (userProfile && userProfile.length > 3) {
      const escaped = userProfile.replace(/\\/g, '\\\\');
      sanitized = sanitized.replace(new RegExp(escaped, 'gi'), '~');
    }

    const username = process.env.USERNAME || (os.userInfo ? os.userInfo().username : '');
    if (username && username.length > 2) {
      sanitized = sanitized.replace(new RegExp(`([A-Za-z]:[\\\\/](?:Users|home)[\\\\/])${username}`, 'gi'), '$1<user>');
    }

    // Generic Windows / Unix user folder patterns
    sanitized = sanitized.replace(/[A-Za-z]:\\Users\\[^\\]+\\/gi, '~\\');
    sanitized = sanitized.replace(/\/home\/[^\/]+\//gi, '~/');

    // 2. Scrub Phoenix repository absolute paths
    const cwd = process.cwd();
    if (cwd && cwd.length > 5) {
      const escapedCwd = cwd.replace(/\\/g, '\\\\');
      sanitized = sanitized.replace(new RegExp(escapedCwd, 'gi'), '<phoenix-root>');
    }

    // 3. Scrub API Keys and Authentication Tokens
    // Anthropic keys
    sanitized = sanitized.replace(/sk-ant-api03-[A-Za-z0-9_\-]{20,}/gi, '[REDACTED_ANTHROPIC_KEY]');
    sanitized = sanitized.replace(/sk-ant-[A-Za-z0-9_\-]{20,}/gi, '[REDACTED_ANTHROPIC_KEY]');
    // OpenAI / general sk keys
    sanitized = sanitized.replace(/sk-[A-Za-z0-9]{20,}/gi, '[REDACTED_API_KEY]');
    // Cerebras keys
    sanitized = sanitized.replace(/csk-[A-Za-z0-9_\-]{16,}/gi, '[REDACTED_CEREBRAS_KEY]');
    // Groq keys
    sanitized = sanitized.replace(/gsk_[A-Za-z0-9_\-]{16,}/gi, '[REDACTED_GROQ_KEY]');
    // Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9_\.\-]{16,}/gi, 'Bearer [REDACTED_TOKEN]');
    // Database encryption keys or hex strings (32 bytes = 64 hex chars)
    sanitized = sanitized.replace(/\b[0-9a-fA-F]{64}\b/g, '[REDACTED_KEY_HEX]');
  } catch {
    // Non-fatal fallback
  }

  return sanitized;
}

/**
 * Extracts model name from error message or context if available.
 */
function extractModelName(message, context = {}) {
  if (context.model) return String(context.model);
  const match = message.match(/model ['"]([^'"]+)['"] not found/i);
  if (match) return match[1];
  const ollamaMatch = message.match(/ollama:([a-zA-Z0-9_\.\-:]+)/i);
  if (ollamaMatch) return ollamaMatch[1];
  return null;
}

/**
 * Classifies an error and returns a normalized consumer-friendly HumanErrorCard.
 *
 * @param {Error|string|object} err - Error object, string, or failure payload
 * @param {object} context - Optional context (subsystem, model, path, etc.)
 * @returns {object} HumanErrorCard specification
 */
export function humanizeError(err, context = {}) {
  const rawMessage = typeof err === 'string'
    ? err
    : (err?.message || (err?.error ? String(err.error) : 'Unknown system error'));

  const rawCode = String(err?.code || context.code || '');
  const rawStatus = Number(err?.status || err?.statusCode || context.status || 0);
  const rawStack = err?.stack || '';
  const subsystem = context.subsystem || 'system';

  const sanitizedMessage = sanitizeDiagnostics(rawMessage);
  const sanitizedStack = sanitizeDiagnostics(rawStack);

  const baseTechnicalDetails = {
    raw_message: sanitizedMessage,
    code: rawCode || undefined,
    subsystem,
    timestamp: new Date().toISOString(),
    sanitized_stack: sanitizedStack || undefined,
  };

  // 1. Ollama Daemon Offline / Connection Refused (ECONNREFUSED 11434)
  if (
    rawCode === 'ECONNREFUSED' ||
    rawMessage.includes('ECONNREFUSED') ||
    (rawMessage.includes('11434') && (rawMessage.includes('connect') || rawMessage.includes('failed')))
  ) {
    return {
      code: 'LOCAL_AI_OFFLINE',
      severity: 'warning',
      title: 'Local AI Engine is Sleeping',
      description: "Ollama is installed on your computer but is not running right now. Phoenix needs it to think privately on this PC.",
      primary_action: {
        label: 'Wake Up Local AI',
        action_type: 'api_call',
        endpoint: '/api/v1/ollama/start',
        method: 'POST',
      },
      secondary_action: {
        label: 'Open Settings',
        action_type: 'navigate',
        target: '/settings',
      },
      technical_details: {
        ...baseTechnicalDetails,
        subsystem: 'local_ollama',
      },
    };
  }

  // 2. Local AI Model Not Downloaded (Ollama 404)
  if (
    rawMessage.includes('404') &&
    (rawMessage.includes('model') || rawMessage.includes('Ollama 404') || rawMessage.includes('not found'))
  ) {
    const modelName = extractModelName(rawMessage, context);
    return {
      code: 'MODEL_NOT_DOWNLOADED',
      severity: 'warning',
      title: 'AI Model Needs Download',
      description: modelName
        ? `The selected model "${modelName}" is not installed on this PC yet.`
        : "The selected AI model is not installed on this PC yet.",
      primary_action: {
        label: modelName ? `Download ${modelName}` : 'Download Model',
        action_type: 'api_call',
        endpoint: '/api/v1/ollama/pull',
        method: 'POST',
        body: modelName ? { model: modelName } : undefined,
      },
      secondary_action: {
        label: 'Choose Another Model',
        action_type: 'navigate',
        target: '/settings',
      },
      technical_details: {
        ...baseTechnicalDetails,
        subsystem: 'local_ollama',
        target_model: modelName || undefined,
      },
    };
  }

  // 3. SQLite Database Locked or Busy (SQLITE_BUSY / SQLITE_LOCKED)
  if (
    rawCode === 'SQLITE_BUSY' ||
    rawCode === 'SQLITE_LOCKED' ||
    rawMessage.includes('SQLITE_BUSY') ||
    rawMessage.includes('database is locked')
  ) {
    return {
      code: 'DATABASE_BUSY',
      severity: 'info',
      title: 'Memory is Saving Notes',
      description: 'Phoenix is busy organizing your notes and conversation history. This usually finishes in a few seconds.',
      primary_action: {
        label: 'Try Again',
        action_type: 'retry',
      },
      secondary_action: {
        label: 'Dismiss',
        action_type: 'dismiss',
      },
      technical_details: {
        ...baseTechnicalDetails,
        subsystem: 'database',
      },
    };
  }

  // 4. SQLite Database Corrupt
  if (rawCode === 'SQLITE_CORRUPT' || rawMessage.includes('SQLITE_CORRUPT') || rawMessage.includes('malformed')) {
    return {
      code: 'DATABASE_CORRUPT',
      severity: 'critical',
      title: 'Database Needs Attention',
      description: 'Phoenix encountered an integrity issue in the local database. Your previous notes can be restored from backup.',
      primary_action: {
        label: 'Open Settings',
        action_type: 'navigate',
        target: '/settings',
      },
      secondary_action: {
        label: 'Copy Diagnostics',
        action_type: 'copy',
      },
      technical_details: {
        ...baseTechnicalDetails,
        subsystem: 'database',
      },
    };
  }

  // 5. Port Already in Use (EADDRINUSE: 7777 / 17760)
  if (rawCode === 'EADDRINUSE' || rawMessage.includes('EADDRINUSE')) {
    return {
      code: 'PORT_IN_USE',
      severity: 'error',
      title: 'Port is Already in Use',
      description: 'Another instance of Phoenix or a background application is currently using port 7777.',
      primary_action: {
        label: 'Retry Connection',
        action_type: 'retry',
      },
      secondary_action: {
        label: 'Open in Browser',
        action_type: 'navigate',
        target: 'http://127.0.0.1:7777/v2/',
      },
      technical_details: {
        ...baseTechnicalDetails,
        subsystem: 'network',
      },
    };
  }

  // 6. Cloud Provider Authentication / Key Error (HTTP 401 / 403)
  if (
    rawStatus === 401 ||
    rawStatus === 403 ||
    rawMessage.includes('401') ||
    rawMessage.includes('403') ||
    rawMessage.toLowerCase().includes('unauthorized') ||
    rawMessage.toLowerCase().includes('invalid api key')
  ) {
    return {
      code: 'CLOUD_AUTH_ERROR',
      severity: 'warning',
      title: 'Cloud AI Key Needs Attention',
      description: 'Your cloud API key was not recognized, has expired, or has insufficient permissions.',
      primary_action: {
        label: 'Update API Key in Settings',
        action_type: 'navigate',
        target: '/settings',
      },
      secondary_action: {
        label: 'Switch to Local AI',
        action_type: 'api_call',
        endpoint: '/api/v1/settings',
        method: 'POST',
        body: { ai_choice: 'local' },
      },
      technical_details: {
        ...baseTechnicalDetails,
        subsystem: 'cloud_ai',
      },
    };
  }

  // 7. Cloud Rate Limit / Quota Exceeded (HTTP 429)
  if (
    rawStatus === 429 ||
    rawMessage.includes('429') ||
    rawMessage.toLowerCase().includes('rate limit') ||
    rawMessage.toLowerCase().includes('quota')
  ) {
    return {
      code: 'CLOUD_RATE_LIMIT',
      severity: 'warning',
      title: 'Cloud Provider is Busy',
      description: 'Your cloud AI provider is temporarily rate-limiting requests. You can wait a moment or switch to local AI.',
      primary_action: {
        label: 'Switch to Local AI',
        action_type: 'api_call',
        endpoint: '/api/v1/settings',
        method: 'POST',
        body: { ai_choice: 'local' },
      },
      secondary_action: {
        label: 'Wait and Retry',
        action_type: 'retry',
      },
      technical_details: {
        ...baseTechnicalDetails,
        subsystem: 'cloud_ai',
      },
    };
  }

  // 8. Network Connectivity Loss (ENOTFOUND / ETIMEDOUT / ECONNRESET)
  if (
    rawCode === 'ENOTFOUND' ||
    rawCode === 'ETIMEDOUT' ||
    rawCode === 'ECONNRESET' ||
    rawMessage.includes('ENOTFOUND') ||
    rawMessage.includes('ETIMEDOUT') ||
    rawMessage.includes('ECONNRESET') ||
    rawMessage.includes('fetch failed')
  ) {
    return {
      code: 'NETWORK_DISCONNECTED',
      severity: 'warning',
      title: 'Connection Interrupted',
      description: 'Phoenix lost network communication while processing your request.',
      primary_action: {
        label: 'Try Again',
        action_type: 'retry',
      },
      secondary_action: {
        label: 'Dismiss',
        action_type: 'dismiss',
      },
      technical_details: {
        ...baseTechnicalDetails,
        subsystem: 'network',
      },
    };
  }

  // 9. Generic Fallback for Unclassified Errors
  return {
    code: 'RUNTIME_ERROR',
    severity: 'error',
    title: 'Something Interrupted Phoenix',
    description: 'Phoenix ran into an unexpected hiccup while processing this step.',
    primary_action: {
      label: 'Try Again',
      action_type: 'retry',
    },
    secondary_action: {
      label: 'Copy Diagnostics',
      action_type: 'copy',
    },
    technical_details: {
      ...baseTechnicalDetails,
      subsystem: subsystem || 'runtime',
    },
  };
}
