import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { messages, readLanguage, setLanguage, toggleLanguage, getLanguage, t, placeName, localizedContent, onLanguageChange, STORAGE_KEY } from '../src/i18n.js';

test('English is the default even without usable storage', () => {
  assert.equal(getLanguage(), 'en');
  for (const stored of [null, undefined, '', 'fr', 'zh-CN', 'en'])
    assert.equal(readLanguage({ getItem: () => stored }), 'en');
  assert.equal(readLanguage({ getItem: () => 'zh' }), 'zh');
  assert.equal(readLanguage({ getItem() { throw Error('Blocked'); } }), 'en');
});
test('Both dictionaries cover the same keys and placeholders', () => {
  assert.deepEqual(Object.keys(messages.en).sort(), Object.keys(messages.zh).sort());
  for (const key of Object.keys(messages.en)) {
    assert.deepEqual(messages.en[key].match(/\{\w+\}/g)?.sort(), messages.zh[key].match(/\{\w+\}/g)?.sort(), key);
  }
});
test('Every city in the album manifest has an English label', () => {
  setLanguage('en');
  const albums = JSON.parse(readFileSync(new URL('../src/albums.json', import.meta.url), 'utf8'));
  for (const album of Object.values(albums)) for (const city of Object.keys(album.cities))
    assert.doesNotMatch(placeName(city), /\p{Script=Han}/u);
  assert.equal(placeName('日本'), 'Japan');
  assert.equal(placeName('英国'), 'United Kingdom');
});
test('Static translation attributes and literal message references exist in both catalogs', () => {
  for (const file of ['index.html','travel-ui.js']) {
    const source=readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');
    const keys=[...source.matchAll(/data-i18n(?:-label|-hint)?="([\w]+)"/g),...source.matchAll(/\bt\('([\w]+)'/g)].map(match=>match[1]);
    for(const key of keys)for(const locale of ['en','zh'])assert.ok(Object.hasOwn(messages[locale],key),`${file}: ${locale}.${key}`);
  }
});
test('Language change persists, notifies, interpolates and supports caption fallback', () => {
  const writes=[];
  globalThis.localStorage={setItem:(...args)=>writes.push(args)};
  let changes=0;
  const stop=onLanguageChange(()=>changes++);
  setLanguage('zh');
  assert.deepEqual(writes.at(-1),[STORAGE_KEY,'zh']);
  assert.equal(t('emptyCopy',{city:placeName('大阪')}),'还没有添加大阪的照片。');
  assert.equal(localizedContent({en:'By the sea',zh:'海边'}),'海边');
  assert.equal(localizedContent({en:'By the sea'}),'By the sea');
  assert.equal(localizedContent('A user-written caption'),'A user-written caption');
  setLanguage('en');
  assert.equal(t('emptyCopy',{city:placeName('大阪')}),'No photos from Osaka yet.');
  assert.equal(changes,2);
  setLanguage('invalid');assert.equal(changes,2);assert.equal(getLanguage(),'en');
  stop();delete globalThis.localStorage;
});
test('Blocked persistence does not stop an in-memory language change', () => {
  globalThis.localStorage={setItem(){throw Error('Blocked');}};
  setLanguage('zh');assert.equal(getLanguage(),'zh');
  setLanguage('en');delete globalThis.localStorage;
});
test('Language icon toggles directly and announces the next language', () => {
  setLanguage('en');assert.equal(t('switchLanguage'),'Switch to Chinese');
  toggleLanguage();assert.equal(getLanguage(),'zh');assert.equal(t('switchLanguage'),'切换到 English');
  toggleLanguage();assert.equal(getLanguage(),'en');
});
