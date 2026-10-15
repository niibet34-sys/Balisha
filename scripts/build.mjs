import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = resolve(root, 'site');
const output = resolve(root, 'dist');
await stat(join(input, 'index.html'));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(input, output, { recursive: true });

// Public-only preview files from the 496-page October 2026 edition.
// Stored in split Git blobs because of upload limits. The paid book stays private.
const bundleDir = join(root, '_asset_payload');
const chunks = (await readdir(bundleDir)).filter(name => /^chunk-\d{2}\.bin$/.test(name)).sort();
if (chunks.length !== 18) throw new Error(`Expected 18 media chunks, found ${chunks.length}`);
const archive = Buffer.concat(await Promise.all(chunks.map(name => readFile(join(bundleDir, name)))));
const expectedHash = 'c1f96a0ec9f149c55afd21fe6167afce8e5d6b75e4d1ed266a5cd58cce12f521';
const actualHash = createHash('sha256').update(archive).digest('hex');
if (actualHash !== expectedHash) throw new Error(`Media archive hash mismatch: ${actualHash}`);
const eocd = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
if (eocd < 0) throw new Error('Missing ZIP directory');
const count = archive.readUInt16LE(eocd + 10);
let offset = archive.readUInt32LE(eocd + 16);
let deployedAssets = 0;
for (let i = 0; i < count; i++) {
  if (archive.readUInt32LE(offset) !== 0x02014b50) throw new Error('Bad ZIP central directory');
  const method = archive.readUInt16LE(offset + 10);
  const compressedSize = archive.readUInt32LE(offset + 20);
  const uncompressedSize = archive.readUInt32LE(offset + 24);
  const nameLength = archive.readUInt16LE(offset + 28);
  const extraLength = archive.readUInt16LE(offset + 30);
  const commentLength = archive.readUInt16LE(offset + 32);
  const localOffset = archive.readUInt32LE(offset + 42);
  const filename = archive.toString('utf8', offset + 46, offset + 46 + nameLength);
  offset += 46 + nameLength + extraLength + commentLength;
  if (!(/^site\/assets\/(?:previews|photography)\/[a-zA-Z0-9_.-]+\.(?:webp|avif)$/.test(filename)
      || filename === 'site/samples/balisha-preview.pdf')) continue;
  if (archive.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`Invalid entry: ${filename}`);
  const localNameLength = archive.readUInt16LE(localOffset + 26);
  const localExtraLength = archive.readUInt16LE(localOffset + 28);
  const from = localOffset + 30 + localNameLength + localExtraLength;
  const compressed = archive.subarray(from, from + compressedSize);
  const bytes = method === 8 ? inflateRawSync(compressed) : method === 0 ? compressed : null;
  if (!bytes || bytes.length !== uncompressedSize) throw new Error(`Invalid asset: ${filename}`);
  const destination = join(output, filename.slice('site/'.length));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  deployedAssets++;
}
if (deployedAssets < 30) throw new Error(`Media bundle incomplete: ${deployedAssets} assets`);
console.log(`Balisha: published ${deployedAssets} verified 2026 media assets to dist/`);
