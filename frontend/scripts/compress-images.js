const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../src/assets/club-images');
const OUT = path.join(__dirname, '../src/assets/club-images-webp');

fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

(async () => {
  let saved = 0;
  for (const file of files) {
    const input = path.join(SRC, file);
    const outName = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const output = path.join(OUT, outName);

    const info = await sharp(input)
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(output);

    const before = fs.statSync(input).size;
    const after = info.size;
    saved += before - after;
    console.log(`${file} → ${outName}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`);
  }
  console.log(`\nTotal saved: ${(saved / 1024 / 1024).toFixed(1)} MB`);
})();
