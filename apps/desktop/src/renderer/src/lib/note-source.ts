/** Source embeds mirror Ancher's URL preview, with an exact provider allowlist. */
export function getSourceEmbedUrl(source: string): string | null {
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:') return null;
    let videoId: string | null = null;
    if (url.hostname === 'youtu.be') videoId = url.pathname.split('/')[1] ?? null;
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      videoId = url.pathname === '/watch' ? url.searchParams.get('v') : /^\/(?:embed|shorts|v)\/([^/]+)/.exec(url.pathname)?.[1] ?? null;
    }
    return videoId && /^[\w-]{11}$/.test(videoId) ? `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0` : null;
  } catch { return null; }
}
