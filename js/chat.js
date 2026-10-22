/* Cross-device Supabase chat. Messages are filtered by server-side RLS. */
(function(){
const $=id=>document.getElementById(id), B=window.Backend;
const sb=B.sb;
let mode="group",timer=null,busy=false;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>"&#"+c.charCodeAt(0)+";");
const err=s=>{$("chatError").textContent=s||""};
function me(){const p=window.App.P();return p&&!p.guest?p:null}
function tab(m){mode=m;for(const [id,v] of [["chatGroup","group"],["chatDirect","dm"],["chatAdmin","announcement"]])$(id).classList.toggle("on",m===v);$("chatToWrap").classList.toggle("hide",m!=="dm");err("");load()}
async function load(){
 if($("chatPanel").classList.contains("hide"))return;
 const p=me();if(!p||!sb){$("chatMessages").textContent="Sign in to an online account to use chat.";return}
 if(mode==="announcement"&&p.role!=="mega"){tab("group");return}
 try{
  let query=sb.from("chat_messages").select("id,sender_id,recipient_id,kind,body,created_at").order("created_at",{ascending:false}).limit(60);
  if(mode==="dm"){
   const name=$("chatTo").value.trim();if(!name){$("chatMessages").textContent="Enter a username to open a private conversation.";return}
   const {data:person,error:pe}=await sb.from("profiles").select("id,username").ilike("username",name).maybeSingle();if(pe)throw pe;
   if(!person){$("chatMessages").textContent="Player not found.";return}
   query=query.eq("kind","dm").or("and(sender_id.eq."+p.id+",recipient_id.eq."+person.id+"),and(sender_id.eq."+person.id+",recipient_id.eq."+p.id+")");
  }else query=query.eq("kind",mode);
  const {data,error:e}=await query;if(e)throw e;
  const messages=(data||[]).reverse();
  const ids=[...new Set(messages.map(m=>m.sender_id))];
  const {data:profiles}=ids.length?await sb.from("profiles").select("id,username").in("id",ids):{data:[]};
  const names=Object.fromEntries((profiles||[]).map(v=>[v.id,v.username]));
  $("chatMessages").innerHTML=messages.map(m=>'<div class="chatLine '+(m.kind==="announcement"?"chatAnnouncement":"")+'"><small>'+esc(names[m.sender_id]||"Player")+' · '+new Date(m.created_at).toLocaleTimeString()+'</small><div>'+esc(m.body)+'</div></div>').join("")||'<p class="mu">No messages yet.</p>';
  $("chatMessages").scrollTop=$("chatMessages").scrollHeight;
 }catch(e){err(e.message||"Chat unavailable")}
}
async function send(e){e.preventDefault();if(busy)return;const p=me();if(!p||!sb){err("Sign in to chat");return}
 const body=$("chatText").value.trim();if(!body||body.length>500)return;
 busy=true;err("");
 try{
  let recipient_id=null;
  if(mode==="dm"){const name=$("chatTo").value.trim();const {data,error:e}=await sb.from("profiles").select("id").ilike("username",name).maybeSingle();if(e)throw e;if(!data)throw Error("Player not found");recipient_id=data.id}
  if(mode==="announcement"&&p.role!=="mega")throw Error("Mega Admin only");
  const {error:e}=await sb.from("chat_messages").insert({sender_id:p.id,recipient_id,kind:mode,body});if(e)throw e;
  $("chatText").value="";await load();
 }catch(e){err(e.message||"Message not sent")}finally{busy=false}
}
const toggle=()=>{const panel=$("chatPanel");panel.classList.toggle("hide");if(!panel.classList.contains("hide")){const p=me();$("chatAdmin").classList.toggle("hide",!p||p.role!=="mega");load();if(!timer)timer=setInterval(load,4000)}else{clearInterval(timer);timer=null}};
$("chatToggle").onclick=toggle;$("gChat").onclick=toggle;
$("chatClose").onclick=()=>{ $("chatPanel").classList.add("hide");clearInterval(timer);timer=null};
$("chatGroup").onclick=()=>tab("group");$("chatDirect").onclick=()=>tab("dm");$("chatAdmin").onclick=()=>tab("announcement");
$("chatTo").onchange=load;$("chatForm").onsubmit=send;
})();