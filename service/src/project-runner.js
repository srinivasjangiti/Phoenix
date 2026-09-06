// Project Service Runner
// Each project can define services in its .phoenix file
// e.g. .phoenix: { "services": [{ "name": "frontend", "command": "npm run dev", "port": 5173 }] }
// This module manages starting, stopping, and monitoring these processes.

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { killProcessTree } from './platform.js';

class ProjectRunner extends EventEmitter {
  constructor() {
    super();
    // Map of projectPath -> { services: Map<serviceName, processInfo> }
    this.projects = new Map();
  }

  // Load .phoenix file and return parsed services
  loadProjectFile(projectPath) {
    const projFile = join(projectPath, '.phoenix');
    if (!existsSync(projFile)) return null;
    try {
      return JSON.parse(readFileSync(projFile, 'utf-8'));
    } catch { return null; }
  }

  // Get status of all services for a project
  getProjectStatus(projectPath) {
    const projConfig = this.loadProjectFile(projectPath);
    if (!projConfig || !projConfig.services) return { name: projConfig?.project_name, services: [] };

    const running = this.projects.get(projectPath)?.services || new Map();

    return {
      name: projConfig.project_name,
      runner: projConfig.runner || {},
      services: projConfig.services.map(svc => {
        const proc = running.get(svc.name);
        const alive = proc && !proc.process?.killed && proc.process?.exitCode === null;
        return {
          name: svc.name,
          port: svc.port,
          command: svc.command,
          dashboard: svc.dashboard,
          health: svc.health,
          status: alive ? 'running' : 'stopped',
          pid: proc?.process?.pid || null,
          uptime: proc ? Math.floor((Date.now() - proc.startedAt) / 1000) : 0,
          logs: proc?.logs?.slice(-100) || []
        };
      })
    };
  }

  // Start a service for a project
  async startService(projectPath, serviceName) {
    const projConfig = this.loadProjectFile(projectPath);
    if (!projConfig?.services) throw new Error('No services defined in .phoenix');

    const svcDef = projConfig.services.find(s => s.name === serviceName);
    if (!svcDef) throw new Error(`Service "${serviceName}" not found`);

    // Check if already running
    const running = this.projects.get(projectPath)?.services;
    if (running?.has(serviceName)) {
      const proc = running.get(serviceName);
      if (proc.process && !proc.process.killed && proc.process.exitCode === null) {
        return { status: 'already_running', pid: proc.process.pid };
      }
      // Dead process — clean up and allow restart
      running.delete(serviceName);
    }

    // Build the command
    const cwd = svcDef.cwd ? join(projectPath, svcDef.cwd) : projectPath;
    const parts = svcDef.command.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    // Merge env
    const env = { ...process.env, ...(svcDef.env || {}) };
    if (svcDef.port) env.PHOENIX_ATC_PORT = String(svcDef.port);

    const child = spawn(cmd, args, {
      cwd,
      env,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    const procInfo = {
      process: child,
      startedAt: Date.now(),
      logs: [],
      port: svcDef.port
    };

    // Capture output
    const addLog = (type, data) => {
      const line = { type, text: data.toString().trim(), time: Date.now() };
      procInfo.logs.push(line);
      if (procInfo.logs.length > 500) procInfo.logs.shift();
      this.emit('log', { projectPath, serviceName, ...line });
    };

    child.stdout.on('data', d => addLog('stdout', d));
    child.stderr.on('data', d => addLog('stderr', d));

    child.on('exit', (code, signal) => {
      addLog('system', `Process exited (code=${code}, signal=${signal})`);
      this.emit('exit', { projectPath, serviceName, code, signal });
    });

    child.on('error', err => {
      addLog('system', `Process error: ${err.message}`);
    });

    // Store
    if (!this.projects.has(projectPath)) {
      this.projects.set(projectPath, { services: new Map() });
    }
    this.projects.get(projectPath).services.set(serviceName, procInfo);

    // Wait a beat and check health
    await new Promise(r => setTimeout(r, 2000));

    if (svcDef.health && svcDef.port) {
      try {
        const res = await fetch(`http://localhost:${svcDef.port}${svcDef.health}`);
        const healthy = res.ok;
        return { status: healthy ? 'running' : 'started_unhealthy', pid: child.pid };
      } catch {
        return { status: 'started_no_health', pid: child.pid };
      }
    }

    return { status: 'started', pid: child.pid };
  }

  // Stop a service
  stopService(projectPath, serviceName) {
    const proj = this.projects.get(projectPath);
    if (!proj) throw new Error('Project not tracked');

    const proc = proj.services.get(serviceName);
    if (!proc || !proc.process) throw new Error('Service not running');

    // Kill the process tree (cross-platform via platform.js)
    const pid = proc.process.pid;
    killProcessTree(pid);

    proj.services.delete(serviceName);
    if (proj.services.size === 0) this.projects.delete(projectPath);

    return { status: 'stopped' };
  }

  // Stop all services for a project
  stopAll(projectPath) {
    const proj = this.projects.get(projectPath);
    if (!proj) return;

    for (const [name] of proj.services) {
      try { this.stopService(projectPath, name); } catch {}
    }
  }

  // Get all running projects
  getAllRunning() {
    const result = [];
    for (const [path, proj] of this.projects) {
      const projConfig = this.loadProjectFile(path);
      result.push({
        path,
        name: projConfig?.project_name || path.split(/[/\\]/).pop(),
        services: Array.from(proj.services.entries()).map(([name, info]) => ({
          name,
          pid: info.process?.pid,
          port: info.port,
          uptime: Math.floor((Date.now() - info.startedAt) / 1000),
          status: info.process?.killed ? 'stopped' : 'running'
        }))
      });
    }
    return result;
  }
}

// Singleton
export const runner = new ProjectRunner();
