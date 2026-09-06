#!/usr/bin/env node

// Phoenix MCP Server — stdio transport for the Claude CLI.
//
// Tool definitions live in mcp/phoenix-tools.js so they can be reused by the HTTP
// transport (routes/mcp-phoenix.js) without drift.
//
// For the Claude desktop app / Claude in Chrome / Claude.ai / Cowork, use the
// HTTP transport instead: paste http://127.0.0.1:7777/mcp/phoenix into
// the "Add custom connector → Remote MCP server URL" dialog.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerPhoenixTools, PHOENIX_MCP_INSTRUCTIONS } from './mcp/phoenix-tools.js';

const PHOENIX = process.env.PHOENIX_BASE_URL || 'http://127.0.0.1:7777';

const server = new McpServer({ name: 'phoenix', version: '2.1.0' }, { instructions: PHOENIX_MCP_INSTRUCTIONS });
registerPhoenixTools(server, { phoenixBaseUrl: PHOENIX });

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[Phoenix MCP] stdio server started');
