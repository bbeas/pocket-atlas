import test from 'node:test';
import assert from 'node:assert/strict';
import { fittedSize, preparePhoto, MAX_PHOTOS, MAX_FILE_BYTES, readPhotos } from '../src/photo-storage.js';

test('Phone photos preserve aspect ratio and stay within the display/thumbnail limits',()=>{
  assert.deepEqual(fittedSize(4032,3024,1920),[1920,1440]);
  assert.deepEqual(fittedSize(3024,4032,480),[360,480]);
  assert.deepEqual(fittedSize(320,200,1920),[320,200]);
  assert.equal(MAX_PHOTOS,10);
});
test('Invalid, empty and oversized files are rejected before decoding',async()=>{
  for(const file of [{name:'x.txt',type:'text/plain',size:12},{name:'x.jpg',type:'image/jpeg',size:0},{name:'x.jpg',type:'image/jpeg',size:MAX_FILE_BYTES+1}])
    await assert.rejects(preparePhoto(file));
});
test('Missing browser storage rejects explicitly instead of pretending to save',async()=>{
  await assert.rejects(readPhotos('paris/巴黎'),/Storage unavailable/);
});
