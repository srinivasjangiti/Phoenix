export const THEMES = {
  'cool-guy': {
    '--phoenix-bg':         '#0a0a0f',
    '--phoenix-surface':    '#12121a',
    '--phoenix-surface2':   '#1a1a25',
    '--phoenix-base':       '#1e1e2e',
    '--phoenix-overlay':    '#313244',
    '--phoenix-muted':      '#45475a',
    '--phoenix-dim':        '#585b70',
    '--phoenix-faint':      '#6c7086',
    '--phoenix-sub':        '#a6adc8',
    '--phoenix-text':       '#cdd6f4',
    '--phoenix-accent':     '#89b4fa',
    '--phoenix-accent2':    '#a6e3a1',
    '--phoenix-red':        '#f38ba8',
    '--phoenix-yellow':     '#f9e2af',
    '--phoenix-orange':     '#fab387',
    '--phoenix-glow':       'rgba(137,180,250,0.18)',
    '--phoenix-logo-color': '#89b4fa',
    '--phoenix-logo-shadow':'0 0 18px rgba(137,180,250,0.5)',
  },
  'blinding-light': {
    '--phoenix-bg':         '#ffffff',
    '--phoenix-surface':    '#f5f5f5',
    '--phoenix-surface2':   '#eeeeee',
    '--phoenix-base':       '#e0e0e0',
    '--phoenix-overlay':    '#d0d0d0',
    '--phoenix-muted':      '#bdbdbd',
    '--phoenix-dim':        '#9e9e9e',
    '--phoenix-faint':      '#757575',
    '--phoenix-sub':        '#424242',
    '--phoenix-text':       '#111111',
    '--phoenix-accent':     '#1565c0',
    '--phoenix-accent2':    '#2e7d32',
    '--phoenix-red':        '#c62828',
    '--phoenix-yellow':     '#f57f17',
    '--phoenix-orange':     '#e64a19',
    '--phoenix-glow':       'rgba(21,101,192,0.15)',
    '--phoenix-logo-color': '#1565c0',
    '--phoenix-logo-shadow':'0 0 12px rgba(21,101,192,0.3)',
  },
  'silver-platter': {
    '--phoenix-bg':         '#d8d8e4',
    '--phoenix-surface':    '#c8c8d8',
    '--phoenix-surface2':   '#b8b8cc',
    '--phoenix-base':       '#a8a8bc',
    '--phoenix-overlay':    '#9898ac',
    '--phoenix-muted':      '#7878a0',
    '--phoenix-dim':        '#585890',
    '--phoenix-faint':      '#484878',
    '--phoenix-sub':        '#303060',
    '--phoenix-text':       '#1a1a2e',
    '--phoenix-accent':     '#5c6bc0',
    '--phoenix-accent2':    '#2e7d32',
    '--phoenix-red':        '#c62828',
    '--phoenix-yellow':     '#f9a825',
    '--phoenix-orange':     '#d84315',
    '--phoenix-glow':       'rgba(92,107,192,0.2)',
    '--phoenix-logo-color': '#5c6bc0',
    '--phoenix-logo-shadow':'2px 2px 0 rgba(0,0,0,0.15), 0 0 12px rgba(92,107,192,0.3)',
  },
  'vibe': {
    '--phoenix-bg':         '#0d0621',
    '--phoenix-surface':    '#1a0a2e',
    '--phoenix-surface2':   '#2d1040',
    '--phoenix-base':       '#4a1060',
    '--phoenix-overlay':    '#6b2080',
    '--phoenix-muted':      '#8a3898',
    '--phoenix-dim':        '#c060c0',
    '--phoenix-faint':      '#e080d0',
    '--phoenix-sub':        '#f0a8e0',
    '--phoenix-text':       '#ffe4f5',
    '--phoenix-accent':     '#ff1493',
    '--phoenix-accent2':    '#00e5ff',
    '--phoenix-red':        '#ff6b6b',
    '--phoenix-yellow':     '#ffb347',
    '--phoenix-orange':     '#ff6b35',
    '--phoenix-glow':       'rgba(255,20,147,0.25)',
    '--phoenix-logo-color': '#ff1493',
    '--phoenix-logo-shadow':'0 0 20px rgba(255,20,147,0.7), 0 0 40px rgba(0,229,255,0.3)',
  },
};

export const THEME_META = {
  'cool-guy':       { label: 'Cool Guy',       emoji: '😎' },
  'blinding-light': { label: 'Blinding Light', emoji: '☀️' },
  'silver-platter': { label: 'Silver Platter', emoji: '🪙' },
  'vibe':           { label: "It's a Vibe",    emoji: '🌴' },
};

export function applyTheme(name) {
  const theme = THEMES[name] || THEMES['cool-guy'];
  let el = document.getElementById('phoenix-theme-vars') || document.getElementById('pan-theme-vars');
  if (!el) {
    el = document.createElement('style');
    el.id = 'phoenix-theme-vars';
    document.head.appendChild(el);
  }
  const lines = [];
  for (const [k, v] of Object.entries(theme)) {
    lines.push(`  ${k}: ${v};`);
    if (k.startsWith('--phoenix-')) {
      lines.push(`  --phoenix-${k.slice(6)}: ${v};`);
    } else if (k.startsWith('--phoenix-')) {
      lines.push(`  --phoenix-${k.slice(10)}: ${v};`);
    }
  }
  el.textContent = `:root {\n${lines.join('\n')}\n}`;
  document.documentElement.dataset.theme = name;
  try {
    localStorage.setItem('phoenix-theme', name);
    localStorage.setItem('pan-theme', name);
  } catch {}
}

export function loadTheme() {
  const saved = (() => {
    try {
      return localStorage.getItem('phoenix-theme') || localStorage.getItem('pan-theme');
    } catch { return null; }
  })();
  applyTheme(saved || 'cool-guy');
  return saved || 'cool-guy';
}

// Legacy export kept for backward compat
export const dark = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceHover: '#1a1a25',
  border: '#1e1e2e',
  text: '#cdd6f4',
  textMuted: '#6c7086',
  accent: '#89b4fa',
  accent2: '#a6e3a1',
  accent3: '#f9e2af',
  danger: '#f38ba8',
  glow: 'rgba(137, 180, 250, 0.15)',
};
