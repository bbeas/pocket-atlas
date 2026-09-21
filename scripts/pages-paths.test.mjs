import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../src/', import.meta.url);
const site = new URL('https://bbeas.github.io/pocket-atlas/');
const read = file => readFileSync(new URL(file, root), 'utf8');

test('Local styles and modules stay inside the GitHub Pages project path', () => {
  for (const file of ['index.html', 'travel-ui.js', 'i18n.js', 'destination-policy.js']) {
    const source = read(file);
    const refs = [
      ...source.matchAll(/(?:src|href)=["']([^"']+)["']/g),
      ...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g),
      ...source.matchAll(/new URL\(['"]([^'"]+)['"],\s*import\.meta\.url\)/g),
    ].map(match => match[1]);
    for (const ref of refs) {
      if (/^(?:https?:|data:)/.test(ref) || ref === 'three' || ref.startsWith('three/')) continue;
      const resolved = new URL(ref, new URL(file, site));
      assert.equal(resolved.origin, site.origin, ref);
      assert.ok(resolved.pathname.startsWith(site.pathname), `${file}: ${ref} escapes /pocket-atlas/`);
      assert.ok(existsSync(new URL(resolved.pathname.slice(site.pathname.length), root)), `${file}: missing ${ref}`);
    }
  }
});

test('Album image URLs do not escape the project path', () => {
  const albums = JSON.parse(read('albums.json'));
  for (const album of Object.values(albums)) for (const photos of Object.values(album.cities)) {
    for (const photo of photos) for (const ref of [photo.src, photo.thumbnail].filter(Boolean)) {
      if (/^https?:/.test(ref)) continue;
      assert.ok(new URL(ref, site).pathname.startsWith(site.pathname), ref);
      assert.ok(existsSync(new URL(ref, root)), `Missing photo: ${ref}`);
    }
  }
});
