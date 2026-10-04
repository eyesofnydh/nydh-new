const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
for (const entry of ['index.html', 'index.js', 'style.css', 'package.json', 'netlify.toml', ...fs.readdirSync(path.join(root, 'css')).map(name => `css/${name}`), ...fs.readdirSync(path.join(root, 'js')).map(name => `js/${name}`)]) {
  if (/^(<<<<<<<|=======|>>>>>>>)\s/m.test(fs.readFileSync(path.join(root, entry), 'utf8'))) {
    throw new Error(`Unresolved merge conflict in ${entry}`);
  }
}
JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = html.replace(/<!--[\s\S]*?-->/g, '');
if (/<script\s*>|<style\s*>/.test(source)) throw new Error('Keep scripts and styles in their maintained files.');
const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const [, reference] of source.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(https?:|data:|mailto:|tel:)/.test(reference)) continue;
  if (reference.startsWith('#')) {
    if (!ids.includes(reference.slice(1))) throw new Error(`Missing anchor: ${reference}`);
  } else if (!fs.existsSync(path.join(root, reference))) throw new Error(`Missing asset: ${reference}`);
}
for (const file of ['index.js', ...fs.readdirSync(path.join(root, 'js')).map(name => `js/${name}`)]) {
  new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}
fs.mkdirSync(output, { recursive: true });
// Only publish the static site, never repository metadata or test scripts.
for (const entry of ['index.html', 'index.js', 'style.css', 'css', 'js', 'images', 'icons', 'sound']) {
  fs.cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
console.log('Build validated and written to dist/');
