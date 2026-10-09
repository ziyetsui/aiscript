// Package the target architecture, even when building both macOS architectures on one host.
const { spawn } = require('node:child_process');
const { mkdir, copyFile, chmod, readFile } = require('node:fs/promises');
const { join } = require('node:path');
const { Arch } = require('electron-builder');

module.exports = async context => {
  const platform = context.packager.platform.nodeName;
  const arch = Arch[context.arch];
  const name = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const cache = join(context.packager.projectDir, 'buildres', 'ffmpeg', `${platform}-${arch}`);
  await mkdir(cache, { recursive: true });
  const binary = join(cache, name);
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [require.resolve('ffmpeg-static/install.js')], {
      env: { ...process.env, npm_config_platform: platform, npm_config_arch: arch, FFMPEG_BIN: binary },
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`FFmpeg ${platform}-${arch} download failed`)));
  });
  // Include upstream notices with the executable and reject known non-redistributable builds.
  const readme = await readFile(`${binary}.README`, 'utf8');
  const license = await readFile(`${binary}.LICENSE`, 'utf8');
  if (!license.trim() || /--enable-nonfree/.test(readme)) throw new Error('FFmpeg build lacks a distributable license');
  const resources = platform === 'darwin'
    ? join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources')
    : join(context.appOutDir, 'resources');
  const target = join(resources, 'ffmpeg');
  await mkdir(target, { recursive: true });
  await copyFile(binary, join(target, name));
  await chmod(join(target, name), 0o755);
  await copyFile(`${binary}.README`, join(target, 'README.txt'));
  await copyFile(`${binary}.LICENSE`, join(target, 'LICENSE.txt'));
};
