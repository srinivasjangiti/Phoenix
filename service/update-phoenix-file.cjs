// Hook script: updates .phoenix file in the project directory with current session ID
// Called by Claude Code on SessionStart via stdin JSON
//
// The .phoenix file is the source of truth for Phoenix's project awareness.
// It tracks: project name, last session ID (for --resume), the claude project
// dir where sessions are stored, and previous paths (for rename tracking).
//
// On launch, Phoenix reads .phoenix files to know what to resume. This hook keeps
// them up to date as new sessions start.

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', d => input += d);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const cwd = data.cwd;
    const sessionId = data.session_id;

    if (!cwd || !sessionId) process.exit(0);

    const phoenixFile = path.join(cwd, '.phoenix');
    const legacyPanFile = path.join(cwd, '.pan');
    let projData = {};

    // Read existing .phoenix or fallback to .pan file if it exists
    if (fs.existsSync(phoenixFile)) {
      try { projData = JSON.parse(fs.readFileSync(phoenixFile, 'utf-8')); } catch {}
    } else if (fs.existsSync(legacyPanFile)) {
      try { projData = JSON.parse(fs.readFileSync(legacyPanFile, 'utf-8')); } catch {}
    }

    // Set project name from folder name if not already set
    if (!projData.project_name) {
      projData.project_name = path.basename(cwd);
    }

    // Update with current session
    projData.last_session_id = sessionId;
    projData.last_session_time = new Date().toISOString();

    // Track the claude project dir for this cwd (so renames don't lose sessions)
    const cwdEncoded = 'C--' + cwd.replace(/^[A-Z]:[\\\/]/, '').replace(/[\\\/]/g, '-');
    const claudeProjectDir = path.join(
      process.env.USERPROFILE || require('os').homedir(),
      '.claude', 'projects', cwdEncoded
    );
    if (fs.existsSync(claudeProjectDir)) {
      // Track current and any previous claude project dirs
      const prev = projData.claude_project_dir;
      projData.claude_project_dir = claudeProjectDir;

      if (!projData.all_session_dirs) projData.all_session_dirs = [];
      const dirName = path.basename(claudeProjectDir);
      if (!projData.all_session_dirs.includes(dirName)) {
        projData.all_session_dirs.push(dirName);
      }
    }

    // Keep history of previous sessions (last 10)
    if (!projData.session_history) projData.session_history = [];
    projData.session_history.unshift({
      id: sessionId,
      time: new Date().toISOString()
    });
    projData.session_history = projData.session_history.slice(0, 10);

    fs.writeFileSync(phoenixFile, JSON.stringify(projData, null, 2));
    process.exit(0);
  } catch (e) {
    // Silently fail — don't block Claude
    process.exit(0);
  }
});
