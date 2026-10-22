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
  if(!Backend.sb)return "Sign in as the owner to edit the shared shop.";
  await fetchSlots();
  const categories={
   Characters:D().CH.filter(x=>!x.ex).map(x=>({id:x.id,name:x.name})),
   Skins:D().SKINS.map((x,id)=>({id,name:x[0]})),
   Moves:(window.PC_EXTRA_MOVES||[]).map((x,id)=>({id,name:x.n})),
   Weapons:D().WP.filter(x=>!x.ex).map(x=>({id:x.id,name:x.name})),
   Emotes:["Wave","Cheer","Dance","Bow","Victory Pose"].map((name,id)=>({id,name}))
  };
  const clean=x=>String(x).toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const query=clean(message),mentioned=Object.entries(categories).flatMap(([category,items])=>items.filter(x=>query.includes(clean(x.name))&&clean(x.name).length>2).map(x=>({...x,category})));
  const cat=Object.keys(categories).find(c=>new RegExp("\\b"+c.toLowerCase().replace(/s$/,"")+"s?\\b").test(query));
  const priceMatch=message.match(/(?:for|cost|price|at|to)\s*\$?([\d,]+)\s*(?:coins?)?\b/i);
  const price=priceMatch?Number(priceMatch[1].replaceAll(",","")):null;
  const slotMatch=message.match(/(?:slot|position|spot|number|#)\s*([1-5])\b/i)||message.match(/\b(first|second|third|fourth|fifth)\b/i);
  const wordSlots={first:0,second:1,third:2,fourth:3,fifth:4};
  let slot=slotMatch?(Number.isInteger(Number(slotMatch[1]))?Number(slotMatch[1])-1:wordSlots[slotMatch[1].toLowerCase()]):null;
  const listed=serverSlots||[];
  if(!/(shop|item|replace|swap|change|put|feature|stock|sell|price|cost|slot|remove|add)/i.test(message))return "I only manage the item shop. Tell me naturally what item to change, where to put it, or what it should cost.";
  const target=mentioned.length===1?mentioned[0]:mentioned.length>1?mentioned[mentioned.length-1]:null;
  const old=mentioned.length>1?mentioned[0]:null;
  const category=cat||target?.category||old?.category;
  if(!category)return "Which shop category should I change: characters, skins, moves, weapons, or emotes?";
  if(mentioned.length>2)return "I found several item names. Which item should be featured?";
  if(old&&target&&old.category!==target.category)return "Those items are from different categories. Which category should I edit?";
  if(slot===null&&old){const current=listed.filter(x=>x.category===category&&x.item_id===old.id);if(current.length===1)slot=current[0].slot}
  if(slot===null&&target&&/price|cost/i.test(message)){const current=listed.filter(x=>x.category===category&&x.item_id===target.id);if(current.length===1)slot=current[0].slot}
  if(slot===null)return "Which of the five "+category.toLowerCase()+" shop positions should I change? You can say 'the first one' or 'slot 3'.";
  const current=listed.find(x=>x.category===category&&x.slot===slot);
  const item=target||categories[category].find(x=>x.id===current?.item_id);
  if(!item)return "Which "+category.toLowerCase()+" item should go there? Tell me its name.";
  const finalPrice=price??current?.price??500;
  if(!Number.isSafeInteger(finalPrice)||finalPrice<1||finalPrice>100000000)return "Choose a valid price from 1 to 100,000,000 coins.";
  const description=category+" slot "+(slot+1)+": "+item.name+" for "+finalPrice.toLocaleString()+" coins";
  if(!confirm("Update everyone's item shop?\n"+description))return "Cancelled. The shop was not changed.";
  const {error}=await Backend.sb.rpc("owner_shop_slot",{p_category:category,p_slot:slot,p_item_id:item.id,p_price:finalPrice});
  if(error)throw error;
  await fetchSlots();shop();return "Updated the shared shop: "+description+".";
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