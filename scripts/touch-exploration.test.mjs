import test from 'node:test';
import assert from 'node:assert/strict';
import { usesTouchExploration, tapAction, placePreview } from '../src/touch-exploration.js';
test('Preview is centered just above the resting building bottom',()=>{
  const position=placePreview({left:100,right:250,top:350,bottom:600},130,44,390,844);
  assert.deepEqual(position,{x:110,y:598});
});
test('Only screen edges constrain the fixed below-building position',()=>{
  const position=placePreview({left:0,right:20,top:600,bottom:820},130,44,390,844);
  assert.deepEqual(position,{x:12,y:788});
});
test('Touch and pen preview while mouse retains direct opening',()=>{
  assert.equal(usesTouchExploration('touch',false),true);
  assert.equal(usesTouchExploration('pen',false),true);
  assert.equal(usesTouchExploration('mouse',false),false);
  assert.equal(usesTouchExploration('mouse',true),true);
  assert.equal(tapAction({touch:true,sameTarget:true,browsable:true,visited:true}),'preview');
  assert.equal(tapAction({touch:false,sameTarget:true,browsable:true,visited:true}),'open');
});
test('Easter eggs preview without albums; decorative or mismatched taps dismiss',()=>{
  assert.equal(tapAction({touch:true,sameTarget:true,browsable:false,visited:true}),'preview');
  assert.equal(tapAction({touch:true,sameTarget:true,browsable:false,visited:false}),'dismiss');
  assert.equal(tapAction({touch:true,sameTarget:false,browsable:true,visited:true}),'dismiss');
});
