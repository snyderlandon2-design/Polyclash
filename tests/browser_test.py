"""Real Chromium/WebGL integration tests. Offline guest only; no production writes.
Requires Python playwright and system chromium. Uses pinned Three.js r128 test fixture
because the managed shell network proxy is unavailable. Supabase CDN is blocked
explicitly: this suite does NOT establish cloud auth, economy or multiplayer safety.
"""
import json, pathlib, threading, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
results=[]
def check(name,ok,detail=None):
 results.append({'test':name,'pass':bool(ok),'detail':detail})
 if not ok: print('FAIL',name,detail)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':1440,'height':900},record_video_dir=str(ART/'video'),record_video_size={'width':1280,'height':800})
 ctx.route('**/three.min.js',lambda r:r.fulfill(path=str(ROOT/'tests/vendor/three.min.js'),content_type='application/javascript'))
 ctx.route('https://cdn.jsdelivr.net/npm/@supabase/**',lambda r:r.abort())
 page=ctx.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(f'http://127.0.0.1:{server.server_port}/');page.click('#guestBtn');page.wait_for_timeout(800)
 check('Guest enters menu',page.locator('#menuScreen').evaluate('(e)=>e.classList.contains("on")'))
 page.screenshot(path=str(ART/'desktop-menu.png'))
 page.evaluate('Game.start({mode:"personal"})');page.wait_for_timeout(1200)
 page.evaluate('Game._debug().stopLoop()')
 check('Real WebGL draws geometry',page.evaluate('Game._debug().info().tris>1000'))
 # Controlled simulation steps avoid machine-dependent software-renderer frame rates.
 def ev(js): return page.evaluate(js)
 check('Legacy fighter and weapon IDs do not affect combat stats',ev('''(()=>{const d=Game._debug(),a=d.statsFor({char:0,weapon:0,xp:0}),b=d.statsFor({char:300,weapon:20,lv:{300:999},xp:0});return a.mhp===b.mhp&&a.dmg===b.dmg&&a.agi===b.agi})()'''))
 movement=ev('''(()=>{const d=Game._debug(),a=[d.me.x,d.me.z];d.keys.KeyW=1;d.step(60,1/60);d.keys.KeyW=0;return Math.hypot(d.me.x-a[0],d.me.z-a[1])})()''')
 check('WASD moves avatar',movement>8,movement)
 jump=ev('''(()=>{const d=Game._debug();dispatchEvent(new KeyboardEvent('keydown',{code:'Space'}));d.step(8,1/60);const y=d.me.y;dispatchEvent(new KeyboardEvent('keyup',{code:'Space'}));d.step(120,1/60);return {height:y,landed:d.me.y}})()''')
 check('Jump rises and returns to floor',jump['height']>1 and abs(jump['landed'])<.1,jump)
 ev('Game._debug().training.behavior="passive";Game._debug().trainSpawn()')
 check('Bot spawns in open space above floor',ev('''(()=>{const d=Game._debug(),b=d.bots[0];return b.y>=0&&!d.World.blocked(b.x,1,b.z)&&b.lv>=1&&b.lv<=10})()'''))
 ev('''(()=>{const d=Game._debug(),b=d.bots[0];d.me.x=0;d.me.z=0;d.me.r=0;b.x=0;b.z=3;b.hp=b.mhp=1000;d.setYaw(Math.PI);d.me.vx=d.me.vz=0;d.m1(d.me)})()''')
 startup=ev('Game._debug().step(3,1/60);Game._debug().bots[0].hp')
 check('Light attack does not hit before startup',startup==1000,startup)
 hit=ev('Game._debug().step(10,1/60);Game._debug().bots[0].hp')
 check('Active light attack damages target',hit<1000,hit)
 check('Training damage feedback updates',ev('Game._debug().training.damage>0&&Game._debug().training.hits>0'))
 ev('Game._debug().step(80,1/60)')
 check('Move cooldown prevents duplicate casts',ev('''(()=>{const d=Game._debug();d.me.lock=0;d.me.st='free';d.me.cd[0]=0;d.useMove(d.me,0);const cd=d.me.cd[0];d.useMove(d.me,0);return cd>0&&d.me.cd[0]===cd})()'''))
 ev('Game._debug().step(180,1/60)')
 check('Emote plays then movement cancels',ev('''(()=>{const d=Game._debug();d.me.lock=0;d.me.st='free';d.playEmote(0);const started=d.me.act?.name==='emote';d.keys.KeyW=1;d.step(1,1/60);d.keys.KeyW=0;return started&&d.me.act?.name!=='emote'})()'''))
 check('Crimson and classic palettes differ',ev('''(()=>{const a=Rig.build(Rig.lookFor(0,0xc62828,1)),b=Rig.build(Rig.lookFor(0,0xffd21f,12));return a.chest.material.color.getHex()!==b.chest.material.color.getHex()})()'''))
 check('Collision pushes player out of buildings',ev('''(()=>{const d=Game._debug(),b=d.World.B[0],f={x:(b.x0+b.x1)/2,z:(b.z0+b.z1)/2,y:0};d.World.resolve(f);return !d.World.blocked(f.x,1,f.z)})()'''))
 # Framing for visual review.
 ev('''(()=>{const d=Game._debug();d.me.x=0;d.me.z=0;d.me.y=0;d.me.vx=d.me.vz=0;d.me.act=null;d.me.lock=0;d.me.hp=d.me.mhp;const b=d.bots[0];b.x=3;b.z=5;b.st='free';d.setYaw(.35);d.step(30,1/60);d.getRenderer().render(d.me.rig.g.parent,d.getCamera())})()''')
 page.screenshot(path=str(ART/'desktop-arena.png'))
 page.click('#tReset');check('Training reset restores health and clears statistics',ev('Game._debug().training.damage===0&&Game._debug().bots.every(b=>b.hp===b.mhp)'))
 ev('App.go("lockerScreen")');page.wait_for_timeout(250)
 page.select_option('#avatarOptions select[aria-label=hat]','cap')
 check('Avatar customization saves without changing fighter',ev('App.P().avatar.hat==="cap"&&JSON.parse(localStorage.pc_guest).avatar.hat==="cap"'))
 check('Avatar customization survives fighter changes',ev('(()=>{const p=App.P(),before=JSON.stringify(PC_AVATAR.look(p));const old=p.char;p.char=200;const ok=JSON.stringify(PC_AVATAR.look(p))===before;p.char=old;return ok})()'))
 check('Fighter determines combat move pool',ev('(()=>{const d=Game._debug();return DATA.CH.some(c=>d.statsFor({char:c.id,weapon:0,xp:0}).kit!==d.statsFor({char:0,weapon:0,xp:0}).kit)})()'))
 page.screenshot(path=str(ART/'avatar-studio.png'))
 ev('App.go("settingsScreen")');page.select_option('#setGraphics','medium');page.select_option('#setMotion','reduced')
 check('Graphics and motion settings persist',ev('PC_SETTINGS.get().graphics==="medium"&&JSON.parse(localStorage.pc_settings).motion==="reduced"'))
 ev('Game.start({mode:"personal"})');page.wait_for_timeout(500);ev('Game._debug().stopLoop()')
 check('Medium graphics applies pixel ratio',ev('Game._debug().getRenderer().getPixelRatio()<=1.25'))
 check('No uncaught JavaScript errors',not errors,errors)
 ctx.close()
 mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
 mobile.route('**/three.min.js',lambda r:r.fulfill(path=str(ROOT/'tests/vendor/three.min.js'),content_type='application/javascript'))
 mobile.route('https://cdn.jsdelivr.net/npm/@supabase/**',lambda r:r.abort())
 mp=mobile.new_page();mp.goto(f'http://127.0.0.1:{server.server_port}/');mp.click('#guestBtn');mp.evaluate('Game.start({mode:"personal"})');mp.wait_for_timeout(800)
 check('Mobile touch controls visible',mp.locator('[data-a=m1]').is_visible())
 check('Mobile viewport has no horizontal overflow',mp.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 mp.screenshot(path=str(ART/'mobile-arena.png'));mobile.close();browser.close()
server.shutdown()
(ART/'browser-results.json').write_text(json.dumps({'scope':'offline guest, real Chromium WebGL; Supabase excluded','results':results},indent=2))
print(json.dumps(results,indent=2))
raise SystemExit(1 if any(not r['pass'] for r in results) else 0)
