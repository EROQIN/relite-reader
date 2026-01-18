import { writeFileSync } from 'fs'
import { deflateSync } from 'zlib'

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

const crc32 = (buf) => {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const name = Buffer.from(type)
  const crc = crc32(Buffer.concat([name, data]))
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc, 0)
  return Buffer.concat([len, name, data, crcBuf])
}

const makeIcon = (size) => {
  const bg = [0xf6, 0xf3, 0xee, 0xff]
  const fg = [0x1f, 0x1d, 0x1a, 0xff]
  const width = size
  const height = size
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)

  const setPixel = (x, y, color) => {
    const offset = y * (stride + 1) + 1 + x * 4
    raw[offset] = color[0]
    raw[offset + 1] = color[1]
    raw[offset + 2] = color[2]
    raw[offset + 3] = color[3]
  }

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (stride + 1)
    raw[rowOffset] = 0
    for (let x = 0; x < width; x += 1) {
      const offset = rowOffset + 1 + x * 4
      raw[offset] = bg[0]
      raw[offset + 1] = bg[1]
      raw[offset + 2] = bg[2]
      raw[offset + 3] = bg[3]
    }
  }

  const rectX0 = Math.floor(width * 0.3)
  const rectX1 = Math.floor(width * 0.7)
  const rectY0 = Math.floor(height * 0.18)
  const rectY1 = Math.floor(height * 0.82)
  const notchHeight = Math.floor(height * 0.12)
  const notchWidth = Math.floor(width * 0.22)
  const notchY0 = rectY1 - notchHeight
  const centerX = Math.floor((rectX0 + rectX1) / 2)

  for (let y = rectY0; y <= rectY1; y += 1) {
    for (let x = rectX0; x <= rectX1; x += 1) {
      if (y >= notchY0) {
        const t = (y - notchY0) / notchHeight
        const half = Math.floor((notchWidth / 2) * (1 - t))
        if (x >= centerX - half && x <= centerX + half) {
          continue
        }
      }
      setPixel(x, y, fg)
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const idat = deflateSync(raw)
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])

  return png
}

const icon192 = makeIcon(192)
const icon512 = makeIcon(512)

writeFileSync(new URL('../public/pwa-192.png', import.meta.url), icon192)
writeFileSync(new URL('../public/pwa-512.png', import.meta.url), icon512)

console.log('Generated pwa-192.png and pwa-512.png')
