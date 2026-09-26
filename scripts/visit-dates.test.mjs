import test from 'node:test';
import assert from 'node:assert/strict';
import { validVisitMonth, readVisitDates, saveVisitDates, formatVisitMonth } from '../src/visit-dates.js';
test('Chinese month uses numeric year / month while English keeps its month label', () => {
  assert.equal(formatVisitMonth('2026-02','zh'),'2026 / 02');
  assert.equal(formatVisitMonth('2026-02','en'),'Feb 2026');
});
test('Travel month validates complete year/month or clearing', () => {
  for(const month of ['', '2026-01','2024-12']) assert.ok(validVisitMonth(month));
  for(const month of [null,'2026','2026-00','2026-13','2026-1','0000-01','2026-01-01']) assert.equal(validVisitMonth(month),false);
});
test('Months persist by city, clear, migrate older arrival dates and report failures', () => {
  const data=new Map(), storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  saveVisitDates(storage,'japan/东京',{month:'2026-09'});
  assert.equal(readVisitDates(storage,'japan/东京').month,'2026-09');
  assert.equal(readVisitDates(storage,'japan/大阪').month,'');
  saveVisitDates(storage,'japan/东京',{month:''});
  assert.equal(readVisitDates(storage,'japan/东京').month,'');
  assert.equal(readVisitDates({getItem:()=>JSON.stringify({start:'2024-02-29',end:'2024-03-01'})},'city').month,'2024-02');
  assert.throws(()=>saveVisitDates({setItem(){throw new Error('Blocked');}},'city',{month:'2026-01'}));
  assert.throws(()=>readVisitDates({getItem:()=>'{broken'},'city'));
});
