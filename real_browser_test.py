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
  check('no uncaught page errors',not errs,str(errs))
finally:
 srv.terminate()
failed=[n for n,ok in results if not ok]
print('SUMMARY',len(results)-len(failed),'/',len(results),'passed');sys.exit(1 if failed else 0)
