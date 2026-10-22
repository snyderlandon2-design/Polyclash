/* Owner AI Developer and featured item shop. All purchases use the existing profile save path. */
(()=>{"use strict";
const $=id=>document.getElementById(id),D=()=>window.DATA,P=()=>window.App?.P?.(),esc=s=>String(s).replace(/[&<>"']/g,c=>"&#"+c.charCodeAt(0)+";");
let aiMode="add",history=[],serverSlots=null,slotFetched=0;
const day=86400000;
const cycle=()=>Math.floor(Date.now()/day);
const remaining=()=>{let n=(cycle()+1)*day-Date.now();return [Math.floor(n/3600000),Math.floor(n%3600000/60000),Math.floor(n%60000/1000)].map(x=>String(x).padStart(2,"0")).join(":")};
function timer(){const e=$("shopCountdown");if(e)e.textContent="Featured shop refreshes in "+remaining()+" (UTC midnight)";if(cycle()!==timer.last){timer.last=cycle();if($("shopScreen")?.classList.contains("on"))shop()}}
function aiOwner(){return P()?.role==="mega"&&!P()?.guest}
async function fetchSlots(){if(!window.Backend?.sb)return;try{const {data,error}=await Backend.sb.from("featured_shop_slots").select("category,slot,item_id,price").order("slot");if(error)throw error;serverSlots=data;slotFetched=Date.now()}catch(e){console.warn("Shop catalog unavailable",e)}}
function shop(){
 const p=P();if(!p)return;
 const bagPrices=[1800,600,900,1100,400];
 const categories=[
  ["Characters",[0,1,2,3,5].map(r=>D().CH.find(x=>!x.ex&&x.rar===r)).filter(Boolean).map(x=>({id:x.id,name:x.name,rar:x.rar,price:2400+(x.rar||0)*900,field:"chars"}))],
  ["Skins",D().SKINS.slice(1,6).map((x,i)=>({id:i+1,name:x[0],rar:i===4?5:i,price:500+i*180,field:"skins"}))],
  ["Moves",(window.PC_EXTRA_MOVES||[]).slice(0,5).map((x,i)=>({id:i,name:x.n,rar:i===4?5:i,price:900+i*250,field:"boughtMoves"}))],
  ["Weapons",[0,1,2,3,5].map(r=>D().WP.find(x=>!x.ex&&x.rar===r)).filter(Boolean).map(x=>({id:x.id,name:x.name,rar:x.rar,price:1200+(x.rar||0)*350,field:"weapons"}))],
  ["Emotes",["Wave","Cheer","Dance","Bow","Victory Pose"].map((name,i)=>({id:i,name,rar:i===4?5:i,price:250+i*125,field:"emotes"}))]
 ];
 const target=$("featuredShop");if(!target)return;
 // Owner-controlled slots are stored on the server, not in each player browser.
 if(serverSlots){for(const [category,items] of categories){const slots=serverSlots.filter(x=>x.category===category).sort((a,b)=>a.slot-b.slot);if(slots.length){const pool=category==="Characters"?D().CH.filter(x=>!x.ex).map(x=>({id:x.id,name:x.name,rar:x.rar,field:"chars"})):
 category==="Weapons"?D().WP.filter(x=>!x.ex).map(x=>({id:x.id,name:x.name,rar:x.rar,field:"weapons"})):
 category==="Skins"?D().SKINS.map((x,id)=>({id,name:x[0],rar:0,field:"skins"})):
 category==="Moves"?(window.PC_EXTRA_MOVES||[]).map((x,id)=>({id,name:x.n,rar:0,field:"boughtMoves"})):
 ["Wave","Cheer","Dance","Bow","Victory Pose"].map((name,id)=>({id,name,rar:0,field:"emotes"}));
 const selected=slots.map(slot=>{const match=pool.find(x=>x.id===slot.item_id);return match?{...match,price:slot.price}:null}).filter(Boolean);if(selected.length)items.splice(0,items.length,...selected)}}}
 else for(const [,items] of categories){if(items.length>1){const offset=cycle()%items.length;items.push(...items.splice(0,offset))}}
 target.innerHTML=categories.map(([name,items])=>'<h4>'+name+'</h4><div class="bags">'+items.map(x=>'<button class="bag" data-field="'+x.field+'" data-id="'+x.id+'"><b>'+esc(x.name)+'</b><small>'+((p[x.field]||[]).includes(x.id)?"OWNED":x.price+" coins")+'</small></button>').join("")+'</div>').join("");
 target.querySelectorAll("button").forEach(btn=>btn.onclick=async()=>{
  const field=btn.dataset.field,id=+btn.dataset.id,entry=categories.flatMap(c=>c[1]).find(x=>x.field===field&&x.id===id);
  if(!entry)return;p[field]=p[field]||[];if(p[field].includes(id)){App.toast("Already owned");return}
  if(p.coins<entry.price){App.toast("Not enough coins");return}
  p.coins-=entry.price;p[field].push(id);await App.save();App.toast("Purchased "+entry.name);shop();
 });
 const bag=$("categoryBags");
 const rarities=["Common","Uncommon","Rare","Epic","Legendary","Secret"];
 bag.innerHTML=categories.map(([name],ci)=>'<h4>'+name+' Bags</h4><div class="bags">'+rarities.map((tier,t)=>'<button class="bag" data-ci="'+ci+'" data-tier="'+t+'"><b>'+tier+'</b><small>'+bagPrices[ci]*(t+1)+' coins</small></button>').join("")+'</div>').join("");
 bag.querySelectorAll("button").forEach(btn=>btn.onclick=async()=>{
  const ci=+btn.dataset.ci,tier=+btn.dataset.tier,cost=bagPrices[ci]*(tier+1);
  if(p.coins<cost){App.toast("Not enough coins");return}
  const items=categories[ci][1],pool=items.map(x=>({x,w:Math.max(1,100/Math.pow(3,Math.abs((x.rar||0)-tier)))}));
  let roll=Math.random()*pool.reduce((n,y)=>n+y.w,0),result=pool[0].x;
  for(const y of pool){roll-=y.w;if(roll<=0){result=y.x;break}}
  p.coins-=cost;p[result.field]=p[result.field]||[];
  if(p[result.field].includes(result.id)){p.coins+=Math.floor(cost*.3);App.toast("Duplicate "+result.name+" — partial refund")}
  else{p[result.field].push(result.id);App.toast("You won "+result.name+"!")}
  await App.save();shop();
 });
}
function aiSetup(){
 const send=$("aiSend");if(!send)return;
 const runCommand=async(message)=>{
  const coin=message.match(/^(?:give|add)\s+(?:user(?:name)?\s+)?([a-z0-9_]{2,24})\s+(\d{1,9})\s+coins?$/i)||message.match(/^(?:give|add)\s+(\d{1,9})\s+coins?\s+to\s+([a-z0-9_]{2,24})$/i);
  if(coin){const first=/^\d+$/.test(coin[1]),username=first?coin[2]:coin[1],amount=Number(first?coin[1]:coin[2]);if(amount<1||amount>1000000)return "Choose 1 to 1,000,000 coins per command.";
   const found=await Backend.aFind(username),player=found.find(x=>x.username.toLowerCase()===username.toLowerCase());if(!player)return "No exact username match: "+username+". Nothing changed.";
   if(!confirm("Give "+player.username+" "+amount.toLocaleString()+" coins?"))return "Cancelled. Nothing changed.";
   await Backend.aCoins(player.id,amount);return "Done: added "+amount.toLocaleString()+" coins to "+player.username+". The server recorded this admin action.";
  }
  const shopCmd=message.match(/^(?:replace|set|change)\s+(characters?|skins?|moves?|weapons?|emotes?)\s+(?:slot\s*)?([1-5])\s+(?:with|to)\s+(.+?)(?:\s+for\s+(\d+)\s+coins?)?$/i);
  if(shopCmd){if(!Backend.sb)return "Shop editing requires online owner login.";const names={character:"Characters",skin:"Skins",move:"Moves",weapon:"Weapons",emote:"Emotes"};const cat=names[shopCmd[1].toLowerCase().replace(/s$/,"")],slot=Number(shopCmd[2])-1,search=shopCmd[3].trim().toLowerCase();let items=[];
   if(cat==="Characters")items=D().CH.filter(x=>!x.ex).map(x=>({id:x.id,name:x.name}));
   if(cat==="Weapons")items=D().WP.filter(x=>!x.ex).map(x=>({id:x.id,name:x.name}));
   if(cat==="Skins")items=D().SKINS.map((x,i)=>({id:i,name:x[0]}));
   if(cat==="Moves")items=(window.PC_EXTRA_MOVES||[]).map((x,i)=>({id:i,name:x.n}));
   if(cat==="Emotes")items=["Wave","Cheer","Dance","Bow","Victory Pose"].map((name,i)=>({id:i,name}));
   const match=items.find(x=>x.name.toLowerCase()===search);if(!match)return "No exact "+cat+" item named "+shopCmd[3]+". Nothing changed.";
   const old=serverSlots?.find(x=>x.category===cat&&x.slot===slot),price=shopCmd[4]?Number(shopCmd[4]):old?.price||500;
   if(!Number.isSafeInteger(price)||price<1||price>100000000)return "Invalid price.";
   if(!confirm("Set "+cat+" slot "+(slot+1)+" to "+match.name+" for "+price.toLocaleString()+" coins for all players?"))return "Cancelled.";
   const {error}=await Backend.sb.rpc("owner_shop_slot",{p_category:cat,p_slot:slot,p_item_id:match.id,p_price:price});if(error)throw error;
   await fetchSlots();shop();return "Updated "+cat+" slot "+(slot+1)+" to "+match.name+" at "+price.toLocaleString()+" coins for all online players.";
  }
  if(/\b(?:replace|swap|change|shop|item)\b/i.test(message))return "Use: Replace Skins slot 1 with [exact skin name] for 900 coins. No change made.";
  return "I only handle specific game commands. Try: Give Landon2 500 coins, or: Replace [item] with [item] in the shop. I will not answer unrelated questions or make random changes.";
 };
 const paint=()=>{$("aiHistory").innerHTML=history.map(m=>'<p><b>'+ (m.role==="user"?"YOU":"AI")+'</b>: '+esc(m.content)+'</p>').join("");$("aiHistory").scrollTop=$("aiHistory").scrollHeight};
 for(const [id,mode] of [["aiModeChat","chat"],["aiModeAdd","add"]])$(id).onclick=()=>{aiMode="add";App.toast("Owner command mode only — no general questions")};
 send.onclick=async()=>{
  if(!aiOwner()){App.toast("Owner access required");return}
  const input=$("aiPrompt"),message=input.value.trim();if(!message)return;
  input.value="";const prior=history.slice(-8);history.push({role:"user",content:message});paint();send.disabled=true;
  try{
   if(aiMode==="add"){history.push({role:"assistant",content:await runCommand(message)});send.disabled=false;paint();return}
   const session=await window.Backend.sb.auth.getSession(),jwt=session.data.session?.access_token;
   if(!jwt)throw Error("Sign in to your online owner account");
   const base=window.PC_CONFIG.SUPABASE_URL;
   const res=await fetch(base+"/functions/v1/owner-game-ai",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+jwt,apikey:window.PC_CONFIG.SUPABASE_ANON_KEY},body:JSON.stringify({message,mode:aiMode,history:prior})});
   const data=await res.json();if(!res.ok)throw Error(data.error||"AI unavailable");
   history.push({role:"assistant",content:data.answer});
  }catch(e){history.push({role:"assistant",content:"AI unavailable: "+e.message})}
  send.disabled=false;paint();
 };
}
function init(){
 aiSetup();fetchSlots().then(shop);timer();setInterval(timer,1000);setInterval(()=>fetchSlots().then(()=>{if($("shopScreen")?.classList.contains("on"))shop()}),30000);const btn=$("aiDevBtn");if(btn)btn.classList.toggle("hide",!aiOwner());
 const obs=new MutationObserver(()=>{if($("shopScreen")?.classList.contains("on"))shop();if(btn)btn.classList.toggle("hide",!aiOwner());});
 obs.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();