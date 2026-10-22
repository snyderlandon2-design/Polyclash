/* Owner AI Developer and featured item shop. All purchases use the existing profile save path. */
(()=>{"use strict";
const $=id=>document.getElementById(id),D=()=>window.DATA,P=()=>window.App?.P?.(),esc=s=>String(s).replace(/[&<>"']/g,c=>"&#"+c.charCodeAt(0)+";");
let aiMode="chat",history=[];
function aiOwner(){return P()?.role==="mega"&&!P()?.guest}
function shop(){
 const p=P();if(!p)return;
 const categories=[
  ["Characters",D().CH.filter(x=>!x.ex).slice(0,5).map(x=>({id:x.id,name:x.name,rar:x.rar,price:2400+(x.rar||0)*900,field:"chars"}))],
  ["Skins",D().SKINS.slice(1,6).map((x,i)=>({id:i+1,name:x[0],rar:i%6,price:500+i*180,field:"skins"}))],
  ["Moves",(window.PC_EXTRA_MOVES||[]).slice(0,5).map((x,i)=>({id:i,name:x.n,rar:i%6,price:900+i*250,field:"boughtMoves"}))],
  ["Weapons",D().WP.filter(x=>!x.ex).slice(0,5).map(x=>({id:x.id,name:x.name,rar:x.rar,price:1200+(x.rar||0)*350,field:"weapons"}))],
  ["Emotes",["Wave","Cheer","Dance","Bow","Victory Pose"].map((name,i)=>({id:i,name,rar:i%6,price:250+i*125,field:"emotes"}))]
 ];
 const target=$("featuredShop");if(!target)return;
 target.innerHTML=categories.map(([name,items])=>'<h4>'+name+'</h4><div class="bags">'+items.map(x=>'<button class="bag" data-field="'+x.field+'" data-id="'+x.id+'"><b>'+esc(x.name)+'</b><small>'+((p[x.field]||[]).includes(x.id)?"OWNED":x.price+" coins")+'</small></button>').join("")+'</div>').join("");
 target.querySelectorAll("button").forEach(btn=>btn.onclick=async()=>{
  const field=btn.dataset.field,id=+btn.dataset.id,entry=categories.flatMap(c=>c[1]).find(x=>x.field===field&&x.id===id);
  if(!entry)return;p[field]=p[field]||[];if(p[field].includes(id)){App.toast("Already owned");return}
  if(p.coins<entry.price){App.toast("Not enough coins");return}
  p.coins-=entry.price;p[field].push(id);await App.save();App.toast("Purchased "+entry.name);shop();
 });
 const bag=$("categoryBags");bag.innerHTML=categories.map(([name,items],ci)=>'<button class="btn" data-ci="'+ci+'">'+name+' Bag · '+(500+ci*400)+' coins</button>').join(" ");
 bag.querySelectorAll("button").forEach(btn=>btn.onclick=async()=>{
  const ci=+btn.dataset.ci,cost=500+ci*400;if(p.coins<cost){App.toast("Not enough coins");return}
  const items=categories[ci][1],weights=[55,25,12,5,2,1],eligible=items.map((x,i)=>({x,w:weights[Math.min(5,x.rar||0)]}));let total=eligible.reduce((n,y)=>n+y.w,0),roll=Math.random()*total;let result=eligible[0].x;for(const y of eligible){roll-=y.w;if(roll<=0){result=y.x;break}}
  p.coins-=cost;p[result.field]=p[result.field]||[];if(p[result.field].includes(result.id)){p.coins+=Math.floor(cost*.3);App.toast("Duplicate "+result.name+" — partial refund")}else{p[result.field].push(result.id);App.toast("You won "+result.name+"!")}await App.save();shop();
 });
}
function aiSetup(){
 const send=$("aiSend");if(!send)return;
 const paint=()=>{$("aiHistory").innerHTML=history.map(m=>'<p><b>'+ (m.role==="user"?"YOU":"AI")+'</b>: '+esc(m.content)+'</p>').join("");$("aiHistory").scrollTop=$("aiHistory").scrollHeight};
 for(const [id,mode] of [["aiModeChat","chat"],["aiModeAdd","add"]])$(id).onclick=()=>{aiMode=mode;App.toast(mode==="add"?"Feature proposal mode — approval required":"AI chat mode")};
 send.onclick=async()=>{
  if(!aiOwner()){App.toast("Owner access required");return}
  const input=$("aiPrompt"),message=input.value.trim();if(!message)return;
  input.value="";const prior=history.slice(-8);history.push({role:"user",content:message});paint();send.disabled=true;
  try{
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
 aiSetup();const btn=$("aiDevBtn");if(btn)btn.classList.toggle("hide",!aiOwner());
 const obs=new MutationObserver(()=>{if($("shopScreen")?.classList.contains("on"))shop();if(btn)btn.classList.toggle("hide",!aiOwner());});
 obs.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();