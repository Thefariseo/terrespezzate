import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const partsDir = 'src/parts';
const encoded = readdirSync(partsDir)
  .filter(name => name.endsWith('.txt'))
  .sort()
  .map(name => readFileSync(`${partsDir}/${name}`, 'utf8').trim())
  .join('');
mkdirSync('dist', { recursive: true });
writeFileSync('dist/index.html', gunzipSync(Buffer.from(encoded, 'base64')));
console.log('Built dist/index.html from compressed game source parts.');
