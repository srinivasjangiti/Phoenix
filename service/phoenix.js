#!/usr/bin/env node

const command = process.argv[2] || 'help';
const args = process.argv.slice(3);

async function main() {
  switch (command) {
    case 'start': {
      const { default: cmdStart } = await import('./src/cli/start.js');
      await cmdStart(args);
      break;
    }
    case 'status': {
      const { default: cmdStatus } = await import('./src/cli/status.js');
      cmdStatus();
      break;
    }
    case 'projects': {
      const { default: cmdProjects } = await import('./src/cli/projects.js');
      cmdProjects();
      break;
    }
    case 'query': {
      const { default: cmdQuery } = await import('./src/cli/query.js');
      cmdQuery(args);
      break;
    }
    case 'launch': {
      const { default: cmdLaunch } = await import('./src/cli/launch.js');
      cmdLaunch();
      break;
    }
    case 'classify': {
      const { classify } = await import('./src/classifier.js');
      await classify();
      break;
    }
    case 'help':
    default:
      console.log(`
Phoenix — Local-First AI Memory Layer

Usage: phoenix <command>

Commands:
  start         Start the Phoenix service (receives Claude Code hooks)
  start -d      Start detached (background)
  status        Show stats and recent events
  projects      List auto-detected projects
  query <text>  Search memory items
  launch        Open Windows Terminal tabs for all projects
  classify      Run classification manually
  help          Show this message
`);
  }
}

// Top-level safety net — log and continue instead of dying. node-pty's
// conpty_console_list_agent.js can throw "AttachConsole failed" when Phoenix
// runs without a real console (e.g. as a Windows service in Session 0),
// and that uncaught error was killing the entire server. Logging keeps Phoenix
// alive so the dashboard, API, and background services don't go down because
// of one PTY spawn helper crashing.
process.on('uncaughtException', (err) => {
  console.error('[Phoenix] uncaughtException:', err && err.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Phoenix] unhandledRejection:', reason && reason.stack || reason);
});

main().catch(err => {
  console.error('[Phoenix] Fatal:', err.message);
  process.exit(1);
});
