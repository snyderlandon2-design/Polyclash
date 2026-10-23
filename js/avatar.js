/* Avatar appearance is independent of the selected combat style. Starter options are free. */
(()=>{'use strict';
const palette={shirt:['#263445','#821e35','#e2e5e9','#225b51'],pants:['#171c26','#404b62','#766454','#252936'],skin:['#f1c9aa','#d6a478','#986c50','#593e35'],hair:['#191a21','#65432a','#d3b777','#e3e8ed'],accent:['#81b9d3','#ef5368','#c8b975','#c2a7ec']};
const choices={hairStyle:['short','long','none'],hat:['none','cap'],accessory:['none','visor','scarf']};
function normalize(a={}){const out={};for(const [k,options]of Object.entries({...palette,...choices}))out[k]=options.includes(a[k])?a[k]:options[0];return out}
function look(p){const a=normalize(p.avatar);const result={custom:!!p.avatar&&Object.keys(p.avatar).length>0};
 // Existing purchased skins keep their palettes until a player explicitly customizes.
 if(!result.custom&&p.skin)return{};
 for(const k of Object.keys(palette))result[k]=parseInt(a[k].slice(1),16);
 return Object.assign(result,{...Object.fromEntries(Object.keys(choices).map(k=>[k,a[k]])),shoe:result.pants,skinTheme:-1});
}
let preview=null;
function mount(){const host=document.getElementById('avatarStudio'),p=App.P();if(!host||!p)return;
 const a=normalize(p.avatar);host.innerHTML='<details class="avatar-studio" open><summary>AVATAR STUDIO <small>Free starter collection · appearance stays with you</small></summary><div class="avatar-layout"><canvas id="avatarPreview" aria-label="Live avatar preview"></canvas><div id="avatarOptions"></div></div><button id="avatarReset" class="btn">USE EQUIPPED OUTFIT COLORS</button></details>';
 const box=document.getElementById('avatarOptions');
 for(const [key,options]of Object.entries({...palette,...choices})){const label=document.createElement('label');label.textContent=key.replace(/([A-Z])/g,' $1').toUpperCase();const select=document.createElement('select');select.setAttribute('aria-label',key);for(const value of options){const op=document.createElement('option');op.value=value;op.textContent=value.startsWith('#')?'Color '+(options.indexOf(value)+1):value;select.append(op)}select.value=a[key];label.append(select);box.append(label);select.onchange=()=>{p.avatar={...normalize(p.avatar),[key]:select.value};App.save().catch(()=>App.toast('Could not save appearance'));render();App.toast('Avatar updated')}}
 document.getElementById('avatarReset').onclick=()=>{p.avatar={};App.save();mount()};render();
}
function render(){if(preview){cancelAnimationFrame(preview.raf);preview.renderer.dispose();preview.scene.traverse(o=>{if(o.isMesh){o.geometry?.dispose();if(!Array.isArray(o.material))o.material?.dispose()}})}
 const canvas=document.getElementById('avatarPreview');if(!canvas)return;
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(260,290,false);renderer.outputEncoding=THREE.sRGBEncoding;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,260/290,.1,60);camera.position.set(7,5.3,13);camera.lookAt(0,2.8,0);scene.add(new THREE.HemisphereLight(0xe8f0ff,0x454558,1));const light=new THREE.DirectionalLight(0xffffff,.8);light.position.set(4,8,5);scene.add(light);
 const p=App.P(),sk=DATA.SKINS[p.skin||0],appearance=Object.assign(Rig.lookFor(p.char,sk?.[1]||0x263445,p.skin||0),look(p)),rig=Rig.build(appearance);scene.add(rig.g);const f={rig,look:appearance,anState:'idle',vx:0,vy:0,vz:0};preview={renderer,scene,raf:0};let last=performance.now(),t=0;
 const loop=now=>{if(!canvas.isConnected){renderer.dispose();return}const dt=Math.min(.05,(now-last)/1000);last=now;t+=dt;Rig.update(f,dt,t);rig.g.rotation.y=Math.sin(t*.4)*.4;renderer.render(scene,camera);preview.raf=requestAnimationFrame(loop)};preview.raf=requestAnimationFrame(loop);
}
window.PC_AVATAR={normalize,look,mount};
})();
