// Script font choice (spec 0002 §9.4: 设置 → 编辑器 可以换成宋体或系统字体). Per-machine preference.
export type ScriptFont = 'typewriter' | 'song' | 'system';
export const SCRIPT_FONTS: Record<ScriptFont, { label: string; stack: string }> = {
  typewriter: { label: '打字机（Courier Prime + 仿宋）', stack: '"Courier Prime", "Courier New", Courier, "Zhuque Fangsong", "STFangsong", "FangSong", "Songti SC", monospace' },
  song: { label: '宋体', stack: '"Courier Prime", "Courier New", "Songti SC", "STSong", "SimSun", serif' },
  system: { label: '系统字体', stack: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", "Microsoft YaHei", sans-serif' },
};

export function currentFont(): ScriptFont {
  try { const v = localStorage.getItem('script-font') as ScriptFont | null; return v && v in SCRIPT_FONTS ? v : 'typewriter'; } catch { return 'typewriter'; }
}

export function applyFont(f: ScriptFont = currentFont()): void {
  document.documentElement.style.setProperty('--font-script', SCRIPT_FONTS[f].stack);
  try { localStorage.setItem('script-font', f); } catch { /* storage may be unavailable */ }
}
