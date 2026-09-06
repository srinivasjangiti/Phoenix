// Phoenix MCP — HTTP transport (Streamable HTTP).
//
// Mirrors the stdio mcp-server.js so the Claude desktop app, Claude in
// Chrome, Claude.ai, and Cowork can reach the same tools via "Add
// custom connector → Remote MCP server URL".
//
// Paste one of these:
//   Same machine:                  http://127.0.0.1:7777/mcp/phoenix
//   Phone/other PC over Tailscale: http://100.x.x.x:7777/mcp/phoenix
//   Cloud (Claude.ai, Cowork):     needs a public tunnel pointed at /mcp/phoenix

import { Router } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerPhoenixTools, PHOENIX_MCP_INSTRUCTIONS } from '../mcp/phoenix-tools.js';
import { logEvent } from '../db.js';

const router = Router();

const SKIP_PASSIVE_LOG = new Set(['phoenix_search', 'phoenix_log_exchange', 'pan_search', 'pan_log_exchange']);
function logToolCall(req) {
  try {
    const b = req.body;
    if (!b || b.method !== 'tools/call' || !b.params?.name) return;
    if (SKIP_PASSIVE_LOG.has(b.params.name)) return;
    const ua = String(req.headers['user-agent'] || '').slice(0, 120);
    logEvent('mcp-remote', 'McpToolCall', {
      tool: b.params.name,
      arg_keys: Object.keys(b.params.arguments || {}),
      ua,
      ts: Date.now(),
    });
  } catch { /* never block a tool call on logging */ }
}

async function handle(req, res) {
  try {
    logToolCall(req);
    const server = new McpServer({ name: 'phoenix', version: '2.1.0' }, { instructions: PHOENIX_MCP_INSTRUCTIONS });
    registerPhoenixTools(server, {
      phoenixBaseUrl: process.env.PHOENIX_BASE_URL || 'http://127.0.0.1:7777',
    });

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    res.on('close', () => {
      try { transport.close(); } catch {}
      try { server.close(); } catch {}
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error: ' + e.message },
        id: null,
      });
    }
  }
}

router.post('/',   handle);
router.get('/',    handle);
router.delete('/', handle);

export default router;
