const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../js/combat-core.js');
test('level health advantage is capped and independent of legacy fighters',()=>{
 assert.equal(C.progression(0).health,100);assert.equal(C.progression(1e9).health,115);
 assert.equal(C.level(-100),1);assert.equal(C.level(100),2);assert.equal(C.progression(100).progress,0);
});
test('loadout rejects locked moves, duplicate moves and malicious IDs',()=>{
 const pool=Array.from({length:7},(_,i)=>({unlockXP:i<4?0:1000}));
 assert.deepEqual(C.validLoadout([0,0,6,-1],pool,0),[0,1,2,3]);
 assert.deepEqual(C.validLoadout([4,1,2,3],pool,0,[0]),[4,1,2,3]);
 assert.deepEqual(C.validLoadout([Infinity,NaN,{},null],pool,0),[0,1,2,3]);
});
test('attack phases include readable startup and recovery',()=>{
 for(const hit of C.LIGHT){assert.ok(hit.startup>=.1);assert.ok(hit.active>0);assert.ok(hit.recovery>=.17);assert.ok(Math.abs(hit.animation-hit.startup-hit.active-hit.recovery)<1e-10)}
});
test('peer packet sanity rejects non-finite, excessive and distant damage',()=>{
 const a={x:0,z:0},b={x:4,z:0};assert.ok(C.hitAllowed({dmg:5},a,b));
 for(const dmg of [NaN,Infinity,-1,1e9])assert.equal(C.hitAllowed({dmg},a,b),false);
 assert.equal(C.hitAllowed({dmg:5},a,{x:100,z:0}),false);
});
