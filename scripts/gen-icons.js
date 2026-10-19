const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function write32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const crc = write32(crc32(Buffer.concat([t, data])));
  return Buffer.concat([write32(data.length), t, data, crc]);
}

function createSolidPNG(width, height, r, g, b) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB

  // Build raw image data: filter byte + RGB per pixel per row
  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0; // filter type None
  for (let x = 0; x < width; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const rows = [];
  for (let y = 0; y < height; y++) rows.push(row);
  const raw = Buffer.concat(rows);
  const idat = zlib.deflateSync(raw);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });

// Brand teal: #0f6d5f => rgb(15, 109, 95)
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createSolidPNG(192, 192, 15, 109, 95));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createSolidPNG(512, 512, 15, 109, 95));

console.log('Generated icon-192.png and icon-512.png in public/icons/');
