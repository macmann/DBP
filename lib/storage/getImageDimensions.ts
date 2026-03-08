export type ImageDimensions = {
  width: number;
  height: number;
};

export function getImageDimensions(mimeType: string, fileBytes: Uint8Array): ImageDimensions | null {
  if (mimeType === "image/png") {
    return getPngDimensions(fileBytes);
  }

  if (mimeType === "image/gif") {
    return getGifDimensions(fileBytes);
  }

  if (mimeType === "image/jpeg") {
    return getJpegDimensions(fileBytes);
  }

  if (mimeType === "image/webp") {
    return getWebpDimensions(fileBytes);
  }

  return null;
}

function getPngDimensions(fileBytes: Uint8Array): ImageDimensions | null {
  if (fileBytes.length < 24) {
    return null;
  }

  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < pngSignature.length; i += 1) {
    if (fileBytes[i] !== pngSignature[i]) {
      return null;
    }
  }

  const dataView = new DataView(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength);
  return {
    width: dataView.getUint32(16),
    height: dataView.getUint32(20)
  };
}

function getGifDimensions(fileBytes: Uint8Array): ImageDimensions | null {
  if (fileBytes.length < 10) {
    return null;
  }

  const header = String.fromCharCode(...fileBytes.slice(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") {
    return null;
  }

  const dataView = new DataView(fileBytes.buffer, fileBytes.byteOffset, fileBytes.byteLength);
  return {
    width: dataView.getUint16(6, true),
    height: dataView.getUint16(8, true)
  };
}

function getJpegDimensions(fileBytes: Uint8Array): ImageDimensions | null {
  if (fileBytes.length < 4 || fileBytes[0] !== 0xff || fileBytes[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 9 < fileBytes.length) {
    if (fileBytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = fileBytes[offset + 1];
    const blockLength = (fileBytes[offset + 2] << 8) + fileBytes[offset + 3];

    if (marker >= 0xc0 && marker <= 0xc3) {
      const height = (fileBytes[offset + 5] << 8) + fileBytes[offset + 6];
      const width = (fileBytes[offset + 7] << 8) + fileBytes[offset + 8];
      return { width, height };
    }

    if (blockLength < 2) {
      break;
    }

    offset += 2 + blockLength;
  }

  return null;
}

function getWebpDimensions(fileBytes: Uint8Array): ImageDimensions | null {
  if (fileBytes.length < 30) {
    return null;
  }

  const riff = String.fromCharCode(...fileBytes.slice(0, 4));
  const webp = String.fromCharCode(...fileBytes.slice(8, 12));
  if (riff !== "RIFF" || webp !== "WEBP") {
    return null;
  }

  const chunkType = String.fromCharCode(...fileBytes.slice(12, 16));

  if (chunkType === "VP8 ") {
    const width = fileBytes[26] | ((fileBytes[27] & 0x3f) << 8);
    const height = fileBytes[28] | ((fileBytes[29] & 0x3f) << 8);
    return { width, height };
  }

  if (chunkType === "VP8L") {
    const b0 = fileBytes[21];
    const b1 = fileBytes[22];
    const b2 = fileBytes[23];
    const b3 = fileBytes[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }

  return null;
}
