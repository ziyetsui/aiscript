import type { AncherSdk } from '@ancher-ai/sdk';

export interface ClipboardImage { name: string; dataUrl: string }
export interface DecodedChatImage { name: string; mime: string; bytes: Buffer }
export const MAX_CHAT_IMAGES = 5;
export const MAX_CHAT_IMAGE_BYTES = 20 * 1024 * 1024;
export function decodeChatImages(images: ClipboardImage[]): DecodedChatImage[] {
  if (!Array.isArray(images) || images.length > MAX_CHAT_IMAGES) throw new Error('每条消息最多5张图片');
  return images.map((image) => {
    if (!image || typeof image.dataUrl !== 'string' || image.dataUrl.length > Math.ceil(MAX_CHAT_IMAGE_BYTES / 3) * 4 + 100) throw new Error('图片超过20MB或格式不正确');
    const m = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.dataUrl);
    if (!m) throw new Error('只支持PNG、JPEG、WebP和GIF图片');
    const bytes = Buffer.from(m[2]!, 'base64');
    if (!bytes.length || bytes.length > MAX_CHAT_IMAGE_BYTES || bytes.toString('base64') !== m[2]) throw new Error('图片超过20MB或数据不完整');
    const mime = m[1]!;
    const valid = mime === 'image/png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : mime === 'image/gif' ? /^GIF8[79]a$/.test(bytes.subarray(0,6).toString())
      : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
    if (!valid) throw new Error('图片内容与格式不一致');
    const name = typeof image.name === 'string' ? image.name.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0,100) : '粘贴图片';
    return { name: name || '粘贴图片', mime, bytes };
  });
}
export async function uploadChatImages(sdk: Pick<AncherSdk, 'File'>, images: DecodedChatImage[], signal: AbortSignal) {
  const attachments: { type: 'file'; id: string }[] = [];
  for (const image of images) {
    signal.throwIfAborted();
    const file = await sdk.File.uploadDirect(new File([new Uint8Array(image.bytes)], image.name, { type: image.mime }), { signal });
    attachments.push({ type: 'file', id: file.id });
  }
  return attachments;
}
