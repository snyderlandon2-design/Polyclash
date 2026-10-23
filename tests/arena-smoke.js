/* Poly-Clash interactive smoke test.
   Run in the browser console after entering GRIND ARENA. Does not change saved profiles. */
(async function(){
 const game=window.Game;
 if(!game?.active)throw Error("Enter GRIND ARENA before running this test");
 const d=game._debug(),fail=[],pass=[];
 const check=(name,ok)=>{(ok?pass:fail).push(name)};
 check("Player exists and is alive",!!d.me&&!d.me.dead&&d.me.hp>0);
 check("Health maximum positive",d.me.mhp>0);
 check("Player rig is attached",!!d.me.rig?.g?.parent);
 check("Floor height nonnegative",d.me.y>=-.1);
 check("Move kit has four skills",d.me.kitDef?.moves?.length>=4);
 check("Scene render stats available",Number.isFinite(d.info().meshes));
 const oldAuto=d.training.auto;d.training.auto=false;
 const oldCount=d.bots.length;
 d.trainSpawn();
 check("Test bot spawned",d.bots.length===oldCount+1);
 const bot=d.bots[d.bots.length-1];
 if(bot){
  check("Bot has health",bot.hp>0&&bot.mhp>=bot.hp);
  check("Bot rig attached",!!bot.rig?.g?.parent);
  check("Bot level within bounds",bot.lv>=1&&bot.lv<=10);
  check("Bot is not inside building",!d.World.blocked(bot.x,bot.y+1,bot.z));
  d.step(12,1/60);
  check("Bot survives simulation",Number.isFinite(bot.x)&&Number.isFinite(bot.y)&&Number.isFinite(bot.z));
 }
 d.training.auto=oldAuto;
 console.table([...pass.map(test=>({test,result:"PASS"})),...fail.map(test=>({test,result:"FAIL"}))]);
 console.log("Poly-Clash smoke test",pass.length,"passed,",fail.length,"failed");
 return{pass,fail};
})();