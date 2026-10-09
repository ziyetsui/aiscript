// Pinned upstream executables, verified before extracting or bundling.
const { spawn } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { createHash } = require('node:crypto');
const { mkdir, readFile, writeFile, chmod, copyFile } = require('node:fs/promises');
const { join } = require('node:path');
const { unzipSync } = require('fflate');
const { Arch } = require('electron-builder');
const YT = { version: '2026.08.19', darwin: ['yt-dlp_macos', '0f192b7ec147ab6288885d6351d9ab67367640029b4377576ef46dd79cf7b202'], win32: ['yt-dlp.exe', '66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a'] };
const DENO = {
  'darwin-arm64': ['aarch64-apple-darwin', '5cd46d6268f6f78f5d88bdc7159d20bd44cdaa4b3303474839f87ec6fe7ae25c'],
  'darwin-x64': ['x86_64-apple-darwin', '95daaff11c116a52ad54785e7914c8e9c9cdcaba793c5ed929c74ca2d8e6259a'],
  'win32-x64': ['x86_64-pc-windows-msvc', 'a0c3101b4158d1dfb7d6a78a7bf0f3de80c96bb423c152beec8beb22786f2238'],
};
async function get(url) {
  // curl honors the developer/CI proxy configuration and retries interrupted downloads.
  const dir = await mkdtemp(join(tmpdir(), 'youtube-build-'));
  const file = join(dir, 'download');
  try {
    await new Promise((resolve, reject) => {
      const child = spawn('curl', ['--fail', '--location', '--silent', '--show-error', '--retry', '2', '--connect-timeout', '20', '--max-time', '300', '--output', file, url], { stdio: ['ignore', 'ignore', 'pipe'] });
      let error = ''; child.stderr.on('data', chunk => { error += chunk; });
      child.on('error', reject); child.on('close', code => code === 0 ? resolve() : reject(new Error(`Download failed: ${url}: ${error}`)));
    });
    return await readFile(file);
  } finally { await rm(dir, { recursive: true, force: true }); }
}
async function verified(url, path, hash) {
  let bytes;
  try { bytes = await readFile(path); } catch {}
  if (!bytes || createHash('sha256').update(bytes).digest('hex') !== hash) bytes = await get(url);
  if (createHash('sha256').update(bytes).digest('hex') !== hash) throw new Error('Upstream binary checksum mismatch');
  await writeFile(path, bytes);
  return bytes;
}
async function prepare(projectDir, platform, arch) {
  const yt = YT[platform], deno = DENO[`${platform}-${arch}`];
  if (!yt || !deno) throw new Error(`Unsupported YouTube tool target ${platform}-${arch}`);
  const cache = join(projectDir, 'buildres', 'youtube', `${platform}-${arch}`);
  await mkdir(cache, { recursive: true });
  const ytName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const denoName = platform === 'win32' ? 'deno.exe' : 'deno';
  const [, zip] = await Promise.all([
    verified(`https://github.com/yt-dlp/yt-dlp/releases/download/${YT.version}/${yt[0]}`, join(cache, ytName), yt[1]),
    verified(`https://github.com/denoland/deno/releases/download/v2.9.7/deno-${deno[0]}.zip`, join(cache, 'deno.zip'), deno[1]),
  ]);
  const extracted = unzipSync(new Uint8Array(zip), { filter: file => file.name === denoName });
  if (!extracted[denoName]) throw new Error('Deno executable missing from verified archive');
  await writeFile(join(cache, denoName), extracted[denoName]);
  await chmod(join(cache, ytName), 0o755); await chmod(join(cache, denoName), 0o755);
  const notices = {
    'yt-dlp-SOURCE-LICENSE.txt': `https://raw.githubusercontent.com/yt-dlp/yt-dlp/${YT.version}/LICENSE`,
    'yt-dlp-THIRD_PARTY_LICENSES.txt': `https://raw.githubusercontent.com/yt-dlp/yt-dlp/${YT.version}/THIRD_PARTY_LICENSES.txt`,
    'yt-dlp-README.md': `https://raw.githubusercontent.com/yt-dlp/yt-dlp/${YT.version}/README.md`,
    'deno-LICENSE.txt': 'https://raw.githubusercontent.com/denoland/deno/v2.9.7/LICENSE.md',
    'GPL-3.0.txt': 'https://www.gnu.org/licenses/gpl-3.0.txt',
  };
  for (const [name, url] of Object.entries(notices)) {
    try { await readFile(join(cache, name)); } catch { await writeFile(join(cache, name), await get(url)); }
  }
  await writeFile(join(cache, 'NOTICE.txt'), `yt-dlp ${YT.version} standalone executable includes GPLv3+ components; see GPL-3.0.txt and upstream README/third-party notices.\nSource: https://github.com/yt-dlp/yt-dlp/tree/${YT.version}\nStandalone build recipes: https://github.com/yt-dlp/yt-dlp/tree/${YT.version}/bundle\nDeno v2.9.7 source and third-party notices: https://github.com/denoland/deno/tree/v2.9.7\n`);
  return { cache, names: [ytName, denoName, ...Object.keys(notices), 'NOTICE.txt'] };
}
module.exports = async context => {
  await require('./pack-ffmpeg.cjs')(context);
  const platform = context.packager.platform.nodeName;
  const { cache, names } = await prepare(context.packager.projectDir, platform, Arch[context.arch]);
  const resources = platform === 'darwin' ? join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources') : join(context.appOutDir, 'resources');
  const target = join(resources, 'youtube'); await mkdir(target, { recursive: true });
  for (const name of names) await copyFile(join(cache, name), join(target, name));
  for (const name of names.slice(0, 2)) await chmod(join(target, name), 0o755);
};
module.exports.prepare = prepare;
if (require.main === module) prepare(join(__dirname, '..'), process.platform, process.arch).then(result => console.log(`YouTube tools ready: ${result.cache}`)).catch(error => { console.error(error); process.exitCode = 1; });
