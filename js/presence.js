/* Presence is an approximate 65-second heartbeat, not a live screen feed. */
(function(){
 const sb=window.Backend&&Backend.sb;if(!sb)return;
 let uid=null,busy=false;
 async function heartbeat(){
  if(busy)return;busy=true;
  try{const {data:{session}}=await sb.auth.getSession();uid=session?.user?.id||null;if(!uid)return;
   await sb.from("player_presence").upsert({user_id:uid,last_seen:new Date().toISOString()},{onConflict:"user_id"});
  }catch(e){}finally{busy=false}
 }
 sb.auth.onAuthStateChange(()=>{setTimeout(heartbeat,1000)});
 heartbeat();setInterval(heartbeat,20000);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)heartbeat()});
})();
