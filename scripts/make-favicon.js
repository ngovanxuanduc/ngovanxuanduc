/**
 * Generate dark-minimal monogram favicon.ico (letter D)
 * Matching site palette: bg #0a0a0b, accent #a78bfa
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(
      raw,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      (y + 1) * width * 4
    );
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(buf, w, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const i = (y * w + x) * 4;
  buf[i] = r;
  buf[i + 1] = g;
  buf[i + 2] = b;
  buf[i + 3] = a;
}

function mix(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function dist(x, y, cx, cy) {
  return Math.hypot(x - cx, y - cy);
}

const BG = [10, 10, 11];
const ACCENT = [167, 139, 250];
const FG = [232, 232, 236];

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const pad = size * 0.08;
  const rad = size * 0.22;
  const left = pad;
  const top = pad;
  const right = size - pad;
  const bottom = size - pad;

  function insideRoundedRect(x, y) {
    if (x >= left + rad && x <= right - rad && y >= top && y <= bottom) {
      return true;
    }
    if (y >= top + rad && y <= bottom - rad && x >= left && x <= right) {
      return true;
    }
    const corners = [
      [left + rad, top + rad],
      [right - rad, top + rad],
      [left + rad, bottom - rad],
      [right - rad, bottom - rad],
    ];
    for (let i = 0; i < corners.length; i++) {
      if (dist(x, y, corners[i][0], corners[i][1]) <= rad) return true;
    }
    return false;
  }

  function shapeAA(x, y, test) {
    let cover = 0;
    const n = 4;
    for (let sy = 0; sy < n; sy++) {
      for (let sx = 0; sx < n; sx++) {
        if (test(x + (sx + 0.5) / n, y + (sy + 0.5) / n)) cover++;
      }
    }
    return cover / (n * n);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const a = shapeAA(x, y, insideRoundedRect);
      if (a <= 0) {
        setPixel(buf, size, x, y, 0, 0, 0, 0);
        continue;
      }
      const t = y / size;
      let r0 = mix(BG[0], 18, t * 0.45);
      let g0 = mix(BG[1], 18, t * 0.45);
      let b0 = mix(BG[2], 24, t * 0.45);
      const glow =
        Math.max(0, 1 - dist(x, y, size * 0.3, size * 0.25) / (size * 0.85)) *
        0.14;
      r0 = mix(r0, ACCENT[0], glow);
      g0 = mix(g0, ACCENT[1], glow);
      b0 = mix(b0, ACCENT[2], glow);
      setPixel(buf, size, x, y, r0, g0, b0, Math.round(255 * a));
    }
  }

  // Geometric capital "D" = outer D minus inner hole
  const lx = size * 0.3;
  const ly = size * 0.22;
  const lw = size * 0.42;
  const lh = size * 0.56;
  const stroke = Math.max(2.2, size * 0.14);

  function inDShape(px, py, inset) {
    const left = lx + inset;
    const top = ly + inset;
    const right = lx + lw - inset;
    const bottom = ly + lh - inset;
    if (right <= left || bottom <= top) return false;
    const height = bottom - top;
    const cy = (top + bottom) / 2;
    // Arc center sits on the left of the bowl so right side is a half-circle
    const cx = left + height * 0.28;
    const R = height / 2;

    // Left rectangular body of the D
    if (px >= left && px <= cx && py >= top && py <= bottom) return true;

    // Right semicircle (including full disk on the right of cx)
    if (px >= cx) {
      return dist(px, py, cx, cy) <= R;
    }
    return false;
  }

  function coverLetter(px, py) {
    return inDShape(px, py, 0) && !inDShape(px, py, stroke);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const la = shapeAA(x, y, coverLetter);
      if (la <= 0) continue;
      const i = (y * size + x) * 4;
      if (buf[i + 3] === 0) continue;
      const fr = mix(ACCENT[0], FG[0], 0.4);
      const fg = mix(ACCENT[1], FG[1], 0.4);
      const fb = mix(ACCENT[2], FG[2], 0.4);
      setPixel(
        buf,
        size,
        x,
        y,
        mix(buf[i], fr, la),
        mix(buf[i + 1], fg, la),
        mix(buf[i + 2], fb, la),
        buf[i + 3]
      );
    }
  }

  return buf;
}

function makeICO(sizes) {
  const images = sizes.map((size) => ({
    size,
    png: encodePNG(size, size, drawIcon(size)),
  }));
  const count = images.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = images.map((img) => {
    const e = {
      width: img.size >= 256 ? 0 : img.size,
      height: img.size >= 256 ? 0 : img.size,
      size: img.png.length,
      offset,
      png: img.png,
    };
    offset += img.png.length;
    return e;
  });

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  let o = 6;
  for (const e of entries) {
    header[o] = e.width;
    header[o + 1] = e.height;
    header[o + 2] = 0;
    header[o + 3] = 0;
    header.writeUInt16LE(1, o + 4);
    header.writeUInt16LE(32, o + 6);
    header.writeUInt32LE(e.size, o + 8);
    header.writeUInt32LE(e.offset, o + 12);
    o += 16;
  }
  return Buffer.concat([header, ...entries.map((e) => e.png)]);
}

const root = path.join(__dirname, "..");
const ico = makeICO([16, 32, 48]);
fs.writeFileSync(path.join(root, "favicon.ico"), ico);
fs.writeFileSync(
  path.join(root, "favicon-preview.png"),
  encodePNG(64, 64, drawIcon(64))
);
console.log("favicon.ico", ico.length, "bytes");
console.log("favicon-preview.png written");
