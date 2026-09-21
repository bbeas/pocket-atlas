export const messages = {
  en: {
    pageTitle: 'Pocket Atlas — A Personal Travel Journal',
    description: 'A personal travel journal, one little brick-built place at a time.',
    travelIndex: 'Travel Trails', chooseDestination: 'Little stops along the way', mainMenu: 'Main menu', switchLanguage: 'Switch to Chinese',
    taglineTop: 'A PERSONAL', taglineBottom: 'TRAVEL JOURNAL',
    canvas: 'Brick globe: drag or use the arrow keys to rotate. Select a place to browse photos, or open the pin icon for Travel Trails. Press Escape to return to the globe.',
    closeAlbum: 'Close album and return to the globe', chooseCity: 'Choose a city', album: 'Travel album',
    count: '{count} photos', countOne: '{count} photo', preview: 'Preview your photos',
    previewNotice: 'Local preview only. Nothing is uploaded or saved. Up to 10 photos.',
    photoViewer: 'Photo viewer', closePhoto: 'Close photo', previous: 'Previous photo', next: 'Next photo',
    photoError: 'This photo could not be loaded. Please try again later.',
    thumbnailError: 'Photo {number} could not be loaded', viewPhoto: 'View photo: {caption}',
    albumError: 'The album is unavailable', loading: 'Opening the album…', emptyTitle: 'Little moments, collected',
    albumErrorCopy: 'The photo list could not be loaded. Please try again.',
    emptyCopy: 'No photos from {city} yet.', loadingCopy: 'Your memories are on their way.', retry: 'Try again',
    invalidFiles: 'Choose JPEG, PNG, WebP or AVIF images, up to 25 MB each.',
    previewReady: 'Previewing {count} photos. Refreshing the page will clear them.',
    skippedFiles: 'Some files were skipped because of their format, size or the 10-photo limit.',
  },
  zh: {
    pageTitle: 'Pocket Atlas — 私人旅行手记',
    description: 'Pocket Atlas，一本在积木地球上慢慢展开的私人旅行手记。',
    travelIndex: '旅行足迹', chooseDestination: '一路走过的小小风景', mainMenu: '主菜单', switchLanguage: '切换到 English',
    taglineTop: '私人', taglineBottom: '旅行手记',
    canvas: '积木地球：拖动或使用方向键旋转，点击地点查看相册。也可点击定位图标打开旅行足迹，按 Escape 返回地球。',
    closeAlbum: '关闭相册，返回地球', chooseCity: '选择城市', album: '旅行相册',
    count: '{count} 张', countOne: '{count} 张', preview: '选择本机照片预览',
    previewNotice: '仅在当前页面预览，不会上传或保存。最多 10 张。',
    photoViewer: '照片大图', closePhoto: '关闭大图', previous: '上一张', next: '下一张',
    photoError: '这张照片暂时无法加载，请稍后重试。',
    thumbnailError: '照片 {number} 暂时无法加载', viewPhoto: '查看照片：{caption}',
    albumError: '相册暂时无法加载', loading: '正在打开相册…', emptyTitle: '风景，慢慢收藏',
    albumErrorCopy: '照片清单读取失败，可以重试。',
    emptyCopy: '还没有添加{city}的照片。', loadingCopy: '正在读取照片清单。', retry: '重新加载',
    invalidFiles: '请选择 JPEG、PNG、WebP 或 AVIF 图片，每张不超过 25MB。',
    previewReady: '已预览 {count} 张照片，刷新页面后会清除。',
    skippedFiles: '部分文件因格式、大小或数量限制未加入。',
  },
};

// Legacy Chinese album/place keys remain stable for compatibility; English is the default label.
const placeNames = {
  '巴黎': 'Paris', '日本': 'Japan', '东京': 'Tokyo', '大阪': 'Osaka',
  '纽约': 'New York', '开罗': 'Cairo', '上海': 'Shanghai', '济州岛': 'Jeju Island',
  '巴塞罗那': 'Barcelona', '冰岛': 'Iceland', '英国': 'United Kingdom',
  '伦敦': 'London', '爱丁堡': 'Edinburgh', '新加坡': 'Singapore', '马尔代夫': 'Maldives',
};
export const STORAGE_KEY = 'pocket-atlas-language';
export function readLanguage(storage) {
  try { return storage?.getItem(STORAGE_KEY) === 'zh' ? 'zh' : 'en'; }
  catch { return 'en'; }
}
let language = 'en';
try { language = readLanguage(globalThis.localStorage); } catch { /* Storage may be unavailable. */ }
const listeners = new Set();
export const getLanguage = () => language;
export const placeName = name => language === 'en' ? placeNames[name] || name : name;
export function localizedContent(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return [value[language], value.en, value.zh].find(text => typeof text === 'string' && text.trim()) || '';
}
export function t(key, values = {}) {
  const message = messages[language][key] ?? messages.en[key] ?? key;
  return message.replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));
}
export function translatePage(root = globalThis.document) {
  if (!root) return;
  root.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  root.title = t('pageTitle');
  root.querySelector('meta[name="description"]')?.setAttribute('content', t('description'));
  root.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  root.querySelectorAll('[data-i18n-label]').forEach(node => { node.setAttribute('aria-label', t(node.dataset.i18nLabel)); });
  root.querySelectorAll('[data-i18n-hint]').forEach(node => { node.dataset.hint = t(node.dataset.i18nHint); });
  root.querySelectorAll('[data-language]').forEach(button => { button.dataset.currentLanguage = language; });
}
export function setLanguage(next) {
  if (!Object.hasOwn(messages, next)) return;
  language = next;
  try { globalThis.localStorage?.setItem(STORAGE_KEY, next); } catch { /* Still switch in memory. */ }
  translatePage();
  listeners.forEach(listener => listener());
}
export function onLanguageChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function toggleLanguage() { setLanguage(language === 'en' ? 'zh' : 'en'); }
translatePage();
globalThis.document?.querySelector('[data-language]')?.addEventListener('click', toggleLanguage);
