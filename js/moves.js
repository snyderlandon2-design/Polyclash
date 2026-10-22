/* Extra unlockable moves for each elemental kit; chosen in Locker. */
(function(){
const H=(f,k,damage)=>({dmg:damage*(f.S?.dmg||1),kind:k,col:f.kitDef.col});
window.PC_EXTRA_MOVES=[
 {n:"Rising Breaker",cd:8,rng:6,unlockXP:100,fn(f,K){K.play(f,"uppercut",.48);K.later(f,.2,()=>{const h=Object.assign(H(f,"launch",9),{up:34,kb:4,stun:.6});K.cone(f,5.5,2.1,h,7);FX.ring(f.x,f.y+2,f.z,f.kitDef.col,5,.4);FX.shake(.35)})}},
 {n:"Phantom Rush",cd:11,rng:13,unlockXP:500,fn(f,K){K.play(f,"barrage",.8);K.lunge(f,34,.36);for(let i=0;i<6;i++)K.later(f,.09+i*.1,()=>{K.cone(f,4.6,2.1,Object.assign(H(f,"light",2.3),{stun:.45,kb:2}),6);FX.burst(f.x,f.y+3,f.z,f.kitDef.col,5,7,.2,.3)});K.later(f,.78,()=>{K.cone(f,5,2.3,Object.assign(H(f,"knock",8),{kb:30,up:9}),7);FX.ring(f.x,f.y+2,f.z,0xffffff,7,.4)})}}
];
})();