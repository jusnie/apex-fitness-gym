const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const webDir = path.join(root, 'www');
const copyFile = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};

fs.rmSync(webDir, { recursive: true, force: true });
fs.mkdirSync(webDir, { recursive: true });

for (const file of ['index.html', 'style.css', 'script.js', 'video-guide.js', 'video-index.json', 'manifest.json', 'service-worker.js']) {
  copyFile(path.join(root, file), path.join(webDir, file));
}

fs.cpSync(path.join(root, 'assets'), path.join(webDir, 'assets'), { recursive: true });
fs.cpSync(path.join(root, 'licenses'), path.join(webDir, 'licenses'), { recursive: true });

copyFile(
  path.join(root, 'node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2'),
  path.join(webDir, 'vendor/fonts/sora-latin.woff2'),
);
copyFile(
  path.join(root, 'node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2'),
  path.join(webDir, 'vendor/fonts/manrope-latin.woff2'),
);
fs.writeFileSync(
  path.join(webDir, 'vendor/fonts/fonts.css'),
  '@font-face{font-family:"APEX Sora";font-style:normal;font-weight:100 800;font-display:swap;src:url("sora-latin.woff2") format("woff2");}\n' +
  '@font-face{font-family:"APEX Manrope";font-style:normal;font-weight:200 800;font-display:swap;src:url("manrope-latin.woff2") format("woff2");}\n',
);
copyFile(
  path.join(root, 'node_modules/@phosphor-icons/web/src/regular/style.css'),
  path.join(webDir, 'vendor/phosphor/style.css'),
);
copyFile(
  path.join(root, 'node_modules/@phosphor-icons/web/src/regular/Phosphor.woff2'),
  path.join(webDir, 'vendor/phosphor/Phosphor.woff2'),
);

// All first-launch, UI, font, and icon assets are local. No runtime CDN is used.
fs.writeFileSync(path.join(webDir, 'config.js'), '// Reserved for optional future cloud configuration.\n');
console.log('Prepared local APEX Workout web bundle.');
