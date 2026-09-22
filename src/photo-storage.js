// Photo blobs live in IndexedDB, never localStorage or a remote service.
export const MAX_PHOTOS = 10;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export function fittedSize(width, height, limit) {
  const scale = Math.min(1, limit / Math.max(width, height));
  return [Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale))];
}
let database;
function openDatabase() {
  if (!database) database = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('Storage unavailable'));
    const request = indexedDB.open('pocket-atlas-photos', 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('photos', { keyPath: 'id' });
      store.createIndex('album', 'album');
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); database = undefined; };
      resolve(db);
    };
    request.onerror = () => { database = undefined; reject(request.error); };
    request.onblocked = () => { database = undefined; reject(new Error('Storage blocked')); };
  });
  return database;
}
export async function readPhotos(album) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readonly');
    const request = tx.objectStore('photos').index('album').getAll(album);
    tx.oncomplete = () => resolve(request.result.sort((a,b) => a.created - b.created));
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('Storage read failed'));
  });
}
export async function appendPhotos(album, photos, limit = MAX_PHOTOS) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    const store = tx.objectStore('photos');
    const count = store.index('album').count(album);
    let added = 0;
    count.onsuccess = () => {
      // Count and insert in one transaction so multiple tabs cannot exceed the limit.
      const selected = photos.slice(0, Math.max(0, limit - count.result));
      for (const photo of selected) store.add({ ...photo, album });
      added = selected.length;
    };
    tx.oncomplete = () => resolve(added);
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('Storage write failed'));
  });
}
export async function deletePhoto(id) {
  const db = await openDatabase();
  return new Promise((resolve,reject) => {
    const tx = db.transaction('photos','readwrite');
    tx.objectStore('photos').delete(id);
    tx.oncomplete = resolve;
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('Storage delete failed'));
  });
}
export async function preparePhoto(file) {
  if (!file.size || file.size > MAX_FILE_BYTES || !(/^(image\/(jpeg|png|webp|avif|heic|heif))$/.test(file.type) || (!file.type && /\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name)))) throw new Error('Unsupported image');
  const url = URL.createObjectURL(file);
  const img = new Image();
  try {
    await new Promise((resolve,reject) => { img.onload=resolve;img.onerror=()=>reject(new Error('Image decode failed'));img.src=url; });
    async function encode(limit, quality) {
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = fittedSize(img.naturalWidth,img.naturalHeight,limit);
      const context = canvas.getContext('2d');
      context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(img,0,0,canvas.width,canvas.height);
      const blob = await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
      canvas.width=canvas.height=1;
      if (!blob) throw new Error('Image conversion failed');
      return blob;
    }
    return {id:crypto.randomUUID(),created:Date.now(),blob:await encode(1920,.86),thumbnailBlob:await encode(480,.78),caption:file.name.replace(/\.[^.]+$/,'')};
  } finally { URL.revokeObjectURL(url);img.src=''; }
}
