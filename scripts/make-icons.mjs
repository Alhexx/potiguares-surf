// Gera os ícones a partir de assets/images/logo-source.png (PNG transparente).
// Uso: npm i -D jimp@0.22.12 && node scripts/make-icons.mjs
import Jimp from 'jimp';

const SRC = 'assets/images/logo-source.png';
const CANVAS = 1024;

const src = await Jimp.read(SRC);

// logo.png — fundo branco, arte grande (login, splash, ícone iOS)
{
  const art = src.clone().scaleToFit(940, 940);
  const out = new Jimp(CANVAS, CANVAS, 0xffffffff);
  out.composite(art, (CANVAS - art.bitmap.width) / 2, (CANVAS - art.bitmap.height) / 2);
  await out.writeAsync('assets/images/logo.png');
}

// icon-adaptive.png — transparente, arte pequena no centro (safe zone do Android)
{
  const art = src.clone().scaleToFit(540, 540);
  const out = new Jimp(CANVAS, CANVAS, 0x00000000);
  out.composite(art, (CANVAS - art.bitmap.width) / 2, (CANVAS - art.bitmap.height) / 2);
  await out.writeAsync('assets/images/icon-adaptive.png');
}

console.log('ok: logo.png + icon-adaptive.png');
