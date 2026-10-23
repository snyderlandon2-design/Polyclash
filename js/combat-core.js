/* Shared deterministic rules. No DOM, renderer or account dependencies. */
(function(root){
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(n)?n:a));
 const level=xp=>Math.min(100,1+Math.floor(Math.sqrt(Math.max(0,Number(xp)||0)/100)));
 function progression(xp){const lv=level(xp),start=(lv-1)**2*100,next=lv**2*100;return{level:lv,start,next,progress:lv===100?1:clamp((xp-start)/(next-start),0,1),health:100+Math.min(15,(lv-1)*.5)}}
 const LIGHT=Object.freeze([
  {startup:.105,active:.06,recovery:.17,damage:4.5,animation:.335},
  {startup:.115,active:.06,recovery:.18,damage:4.5,animation:.355},
  {startup:.14,active:.07,recovery:.20,damage:5,animation:.41},
  {startup:.17,active:.08,recovery:.32,damage:7,animation:.57}
 ]);
 function validLoadout(slots,pool,xp=0,owned=[]){
  const result=[];for(let i=0;i<4;i++){let id=Array.isArray(slots)?slots[i]:i;
   if(!Number.isInteger(id)||!pool[id]||result.includes(id)||((pool[id].unlockXP||0)>xp&&!owned.includes(id-4)))id=pool.findIndex((m,j)=>!result.includes(j)&&(m.unlockXP||0)<=xp);
   result.push(id<0?i:id);
  }return result;
 }
 function hitAllowed(h,att,target){
  if(!h||!att||!target||!Number.isFinite(h.dmg)||h.dmg<0||h.dmg>80)return false;
  if(![att.x,att.z,target.x,target.z].every(Number.isFinite))return false;
  return Math.hypot(target.x-att.x,target.z-att.z)<=60;
 }
 const api={clamp,level,progression,LIGHT,validLoadout,hitAllowed};
 if(typeof module==='object')module.exports=api;root.PC_COMBAT=api;
})(typeof window==='object'?window:globalThis);
