// Game er file gulo www/ e copy kore (Capacitor er webDir).
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'www');
const items = ['index.html', 'css', 'js', 'assets', 'lib'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

let files = 0;
for (const item of items) {
  const from = path.join(root, item);
  if (!fs.existsSync(from)) {
    console.warn('[warn] nai, skip kora holo:', item);
    continue;
  }
  fs.cpSync(from, path.join(out, item), {
    recursive: true,
    filter: (src) => {
      if (/^README/i.test(path.basename(src))) return false; // README gulo APK te lage na
      if (fs.statSync(src).isFile()) files++;
      return true;
    },
  });
}

if (!fs.existsSync(path.join(out, 'index.html'))) {
  console.error('[error] www/index.html toiri hoy nai');
  process.exit(1);
}
console.log(`www ready: ${files} files`);
