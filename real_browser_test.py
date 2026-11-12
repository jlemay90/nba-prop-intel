"""Real-navigation regression tests (http://127.0.0.1 and file://), native localStorage, full browser restart.
Run: python3 real_browser_test.py   (optional env CHROMIUM_PATH=/path/to/chromium)"""
import os,sys,subprocess,tempfile,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).parent;PORT=8142;KEY='j-nba-prop-intel-v0.1'
URL=f'http://127.0.0.1:{PORT}/index.html';FILE_URL='file://'+str(ROOT/'index.html')
launch={'args':['--no-sandbox']}
if os.environ.get('CHROMIUM_PATH'):launch['executable_path']=os.environ['CHROMIUM_PATH']
results=[]
def check(name,cond,detail=''):
 results.append((name,bool(cond)));print(('PASS' if cond else 'FAIL'),name,detail)
def add(pg,player,line='5.5',games='6,7'):
 pg.get_by_role('button',name='+ New prop').click()
 for k,v in dict(player=player,gameDate='2026-11-11',line=line,odds='-110',sportsbook='Test Book',recentGames=games,roleNotes='x',reason='y').items():pg.locator('#'+k).fill(v)
 pg.get_by_role('button',name='Save research record').click()
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(.7)
try:
 with sync_playwright() as p:
  udir=tempfile.mkdtemp()
  ctx=p.chromium.launch_persistent_context(udir,viewport={'width':390,'height':844},**launch)
  pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(URL);check('localhost load shows 3 synthetic demos',pg.locator('#totalMetric').inner_text()=='3')
  add(pg,'Persist Test','20','20, 21, 19, 20, 25, 10, 20, 22')
  check('record added',pg.locator('#totalMetric').inner_text()=='4')
  ctx.close()
  ctx=p.chromium.launch_persistent_context(udir,**launch);pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(URL);check('record survives full browser restart (native localStorage)',pg.locator('#totalMetric').inner_text()=='4')
  pg.locator('#searchInput').fill('Persist Test')
  check('push handling: L5 = 2/3 decided (line 20, pushes excluded)','2/3 decided' in pg.locator('.prop-card').first.inner_text())
  # corruption: raw data must never be destroyed
  bad='{bad json'
  pg.evaluate("([k,v])=>localStorage.setItem(k,v)",[KEY,bad]);pg.reload()
  check('corrupt load starts empty, no crash',pg.locator('#totalMetric').inner_text()=='0')
  add(pg,'After Corrupt')
  backups=pg.evaluate("([k])=>Object.keys(localStorage).filter(x=>x.startsWith(k+'-corrupt-backup-')).map(x=>localStorage.getItem(x))",[KEY])
  check('corrupted raw data preserved in backup key after a new save',backups==[bad],repr(backups))
  check('new record saved after corruption',pg.locator('#totalMetric').inner_text()=='1')
  ctx.close()
  # file:// real navigation
  b=p.chromium.launch(**launch);fp=b.new_page(viewport={'width':390,'height':844});fp.on('pageerror',lambda e:errs.append(str(e)))
  fp.goto(FILE_URL);check('file:// load shows 3 demos',fp.locator('#totalMetric').inner_text()=='3')
  check('file:// 390px no horizontal overflow',fp.evaluate('document.body.scrollWidth<=window.innerWidth+2'))
  # save-blocked guard: if the backup cannot be written, saving must refuse to overwrite the raw data
  g=b.new_context(viewport={'width':390,'height':844}).new_page();g.on('pageerror',lambda e:errs.append(str(e)))
  g.goto(URL);g.evaluate("([k])=>localStorage.setItem(k,'{bad')",[KEY])
  g.add_init_script("const _o=Storage.prototype.setItem;Storage.prototype.setItem=function(a,v){if(String(a).includes('corrupt-backup'))throw new Error('quota');return _o.call(this,a,v)}")
  g.reload();add(g,'Should Not Save')
  check('backup impossible: raw data NOT overwritten',g.evaluate("([k])=>localStorage.getItem(k)",[KEY])=='{bad')
  b.close()
  # ---- Verify quote panel (session 4). Deterministic clock: MOCK mockbook_a updated 22:50Z (fresh at 23:00Z), mockbook_b 20:00Z (stale).
  SNAP=str(ROOT/'fixtures'/'MOCK-snapshot.json');RAW=str(ROOT/'fixtures'/'MOCK-event-odds.json')
  vb=p.chromium.launch(**launch);vc=vb.new_context(viewport={'width':390,'height':844});vp=vc.new_page();vp.on('pageerror',lambda e:errs.append(str(e)))
  vp.clock.set_fixed_time('2026-11-11T23:00:00Z');requests=[];vp.on('request',lambda r:requests.append(r.url))
  vp.goto(URL)
  def open_card(name):
   vp.locator('#closeDialog').click() if vp.locator('dialog[open]').count() else None
   vp.locator('#searchInput').fill(name);vp.locator('.prop-card .inspect').first.click()
  def panel():return vp.locator('#verifyQuote').inner_text()
  def status():loc=vp.locator('#verifyQuote [data-status]');return loc.first.get_attribute('data-status') if loc.count() else None
  def add_rec(player,market,side,line,odds='+175',book='Record Book XYZ'):
   vp.locator('#closeDialog').click() if vp.locator('dialog[open]').count() else None
   vp.get_by_role('button',name='+ New prop').click()
   for k,v in dict(player=player,gameDate='2026-11-11',line=line,odds=odds,sportsbook=book,recentGames='20,21,22',roleNotes='x',reason='y').items():vp.locator('#'+k).fill(v)
   vp.locator('#market').select_option(market);vp.locator('#side').select_option(side)
   vp.get_by_role('button',name='Save research record').click()
  open_card('Sample Lead Guard')
  t=panel()
  check('verify (a): demo research file has VERIFY QUOTE panel, empty state, no verified claim',vp.locator('#verifyQuote').count()==1 and 'NO SNAPSHOT LOADED' in t and status() is None and 'Illustration only' not in t and '-110' not in t,t)
  check('verify (a): panel fits 390px dialog (no horizontal overflow)',vp.evaluate("()=>{const d=document.getElementById('detailsDialog');return d.scrollWidth<=d.clientWidth+2}"))
  vp.locator('#snapshotFile').set_input_files(RAW)
  check('verify: raw Odds API body refused with error, no quotes',('raw Odds API response' in panel()) and status() is None and 'mockbook' not in panel(),panel())
  vp.locator('#snapshotFile').set_input_files(SNAP);t=panel()
  check('verify (b): MOCK snapshot vs demo record -> UNAVAILABLE, demo illustration odds not shown as verified',status()=='UNAVAILABLE' and 'MOCK FIXTURE' in t and 'Illustration only' not in t and '-110' not in t and 'mockbook' not in t,t)
  def open_newest(title):
   vp.locator('#searchInput').fill('');vp.locator('.prop-card .inspect').first.click()
   assert vp.locator('#detailsTitle').inner_text()==title,vp.locator('#detailsTitle').inner_text()
  add_rec('Mock Player Alpha','Points','Over','24.5');open_newest('Mock Player Alpha · Over 24.5 Points');t=panel()
  check('verify (c): exact match, fresh provider update -> OK with book/price/timestamps; snapshot reused across cards',status()=='OK' and 'mockbook_a' in t and '-115' in t and '10 min ago' in t and 'Mock Away Team at Mock Home Team' in t and '+175' not in t and 'Record Book XYZ' not in t,t)
  add_rec('Mock Player Alpha','Points','Over','25.5');open_newest('Mock Player Alpha · Over 25.5 Points');t=panel()
  check('verify (c2): exact match but provider update > 30 min -> STALE with stale quote and reason',status()=='STALE' and 'older than 30 minutes' in t and 'mockbook_b' in t,t)
  add_rec('Mock Player Alpha','Points','Over','25');open_newest('Mock Player Alpha · Over 25 Points');t=panel()
  check('verify (d): mismatched line 25 -> UNAVAILABLE, no nearest-line fallback (24.5/25.5 prices absent)',status()=='UNAVAILABLE' and 'No verified quote available' in t and '-115' not in t and 'mockbook' not in t,t)
  open_card('Sample Wing');t=panel()
  check('verify (e): unmapped market 3PT made -> UNAVAILABLE with unmapped reason',status()=='UNAVAILABLE' and 'no verified provider key yet' in t and '3PT made' in t,t)
  stored=vp.evaluate("([k])=>Object.keys(localStorage).map(x=>x+localStorage.getItem(x)).join('')",[KEY])
  check('verify: snapshot/quotes never persisted to localStorage',('mockbook' not in stored) and ('the-odds-api' not in stored))
  keyed=Path(tempfile.mkdtemp())/'keyed.snapshot.json';import json as _j;o=_j.loads(Path(SNAP).read_text());o['quotes'][0]['source_url']+='&apiKey=FAKEKEY000';keyed.write_text(_j.dumps(o))
  vp.locator('#snapshotFile').set_input_files(str(keyed));t=panel()
  check('verify: file with apiKey in source_url refused, prior snapshot unloaded, key not echoed',('contains an API key' in t) and status() is None and 'FAKEKEY000' not in t and 'mockbook' not in t,t)
  check('verify: no request to The Odds API from the browser',not [u for u in requests if 'the-odds-api.com' in u],str(requests))
  # single-file build: adapter + verify helpers inlined, works standalone from file://
  sp=vb.new_context(viewport={'width':390,'height':844}).new_page();sp.on('pageerror',lambda e:errs.append(str(e)));sp.clock.set_fixed_time('2026-11-11T23:00:00Z')
  sp.goto('file://'+str(ROOT/'nba-prop-intel.html'));sp.locator('.prop-card .inspect').first.click();sp.locator('#snapshotFile').set_input_files(SNAP)
  check('verify: single-file nba-prop-intel.html panel works standalone (MOCK vs demo -> UNAVAILABLE)',sp.locator('#verifyQuote [data-status]').first.get_attribute('data-status')=='UNAVAILABLE')
  vb.close()
  check('no uncaught page errors',not errs,str(errs))
finally:
 srv.terminate()
failed=[n for n,ok in results if not ok]
print('SUMMARY',len(results)-len(failed),'/',len(results),'passed');sys.exit(1 if failed else 0)
