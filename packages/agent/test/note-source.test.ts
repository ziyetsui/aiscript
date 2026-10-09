import { describe, expect, it } from 'vitest';
import { getSourceEmbedUrl } from '../../../apps/desktop/src/renderer/src/lib/note-source.ts';

describe('source preview URL', () => {
  it('supports YouTube watch, short and embedded links', () => {
    for (const url of ['https://www.youtube.com/watch?t=20&v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?si=test', 'https://youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ']) {
      expect(getSourceEmbedUrl(url)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0');
    }
  });
  it('never embeds arbitrary or spoofed origins', () => {
    for (const url of ['https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'https://evil.test/?next=youtube.com/watch?v=dQw4w9WgXcQ', 'javascript:alert(1)', 'https://youtube.com/watch?v=invalid', 'file:///video']) expect(getSourceEmbedUrl(url)).toBeNull();
  });
});
