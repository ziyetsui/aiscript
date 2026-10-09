// Spec 0006 F: capture the actual final prototype in an isolated browser profile.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES } from '../../../specs/images/prototypes/src/pages.mjs';
const output = join(import.meta.dirname, 'shots', 'prototype'); mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage({ reducedMotion: 'reduce' }); const evidence: unknown[] = [];
try {
  for (const [width,height] of [[1360,860],[1440,960]]) for (const os of ['mac','win']) for (const theme of ['d2','d3']) for (const p of PAGES) {
    await page.setViewportSize({ width, height });
    await page.goto(`http://localhost:4173/Ancher-Scripter-Prototype.html#${p.id}-${theme}-${os}-k2-a`);
    await page.waitForFunction((name) => document.querySelector<HTMLIFrameElement>('iframe.front')?.contentDocument?.title.startsWith(name), p.name);
    await page.waitForFunction(() => [...document.querySelectorAll('iframe.stage')].every((el) => !el.getAnimations().some((a) => a.playState === 'running')));
    const frame = await (await page.locator('iframe.front').elementHandle())!.contentFrame();
    if (frame) { await frame.evaluate(() => document.fonts.ready); await frame.waitForFunction(() => !document.querySelector('.fade-up')?.getAnimations().some((a) => a.playState === 'running')); }
    await page.screenshot({ path: join(output, `${p.id}-${theme}-${os}-${width}x${height}.png`) });
    const panels = await frame?.evaluate(() => ['.rail','.titlebar','.col2','.nt-side','.nt-panel','.agent','.wd-side','.rec-nav','.set-main'].flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)].map((el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return {selector,x:r.x,y:r.y,width:r.width,height:r.height,background:s.backgroundColor,borderRadius:s.borderRadius,font:s.fontFamily}; })));
    evidence.push({ page: p.id, name: p.name, os, theme, width, height, url: page.url(), panels });
  }
  writeFileSync(join(output,'manifest.json'), JSON.stringify(evidence,null,2)); console.log(`Captured ${evidence.length} prototype states`);
} finally { await browser.close(); }
