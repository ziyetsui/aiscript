import { useEffect, useState } from 'react';
import { Icon, useToast } from '../lib/ui.tsx';

export function ThemeToggle() {
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const toast = useToast();
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return <button className="no-drag" aria-label="切换亮暗模式" title={dark ? '切换到亮色模式' : '切换到暗色模式'} onClick={async () => {
    try {
      await window.api.app.setTheme(matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark');
    } catch { toast('主题切换失败，请重试'); }
  }}><Icon name={dark ? 'moon' : 'sun'} size={17} /></button>;
}
