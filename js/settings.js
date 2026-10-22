(function(){
const defaults={cam:13,sens:100,graphics:"auto",homeX:0,chatX:0,joyX:0,joyY:0,touchX:0,touchY:0};
const get=()=>{try{return Object.assign({},defaults,JSON.parse(localStorage.getItem("pc_settings")||"{}"))}catch(e){return {...defaults}}};
let state=get();
function apply(){
 const st=document.documentElement.style;
 st.setProperty("--home-x",state.homeX+"px");st.setProperty("--chat-x",state.chatX+"px");
 st.setProperty("--joy-x",state.joyX+"px");st.setProperty("--joy-y",state.joyY+"px");
 st.setProperty("--touch-x",state.touchX+"px");st.setProperty("--touch-y",state.touchY+"px");
 document.querySelectorAll("#settingsScreen input,#settingsScreen select").forEach(el=>{const k=el.id.replace(/^set/,"");const prop=k.charAt(0).toLowerCase()+k.slice(1);if(state[prop]!==undefined)el.value=state[prop]});
}
function save(){localStorage.setItem("pc_settings",JSON.stringify(state));apply()}
for(const [id,key] of Object.entries({setCam:"cam",setSens:"sens",setGraphics:"graphics",setHomeX:"homeX",setChatX:"chatX",setJoyX:"joyX",setJoyY:"joyY",setTouchX:"touchX",setTouchY:"touchY"})){
 const el=document.getElementById(id);if(el)el.addEventListener("input",()=>{state[key]=key==="graphics"?el.value:Number(el.value);save()});
}
document.getElementById("settingsReset").onclick=()=>{state={...defaults};save()};
document.getElementById("gSettings").onclick=()=>{if(window.App)App.go("settingsScreen")};
window.PC_SETTINGS={get:()=>({...state})};apply();
})();