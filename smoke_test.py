import os,subprocess,sys,time
from playwright.sync_api import sync_playwright
from pathlib import Path
ROOT=Path(__file__).parent
server=subprocess.Popen([sys.executable,'-m','http.server','8137','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(.6)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(**({'executable_path':os.environ['CHROMIUM_PATH']} if os.environ.get('CHROMIUM_PATH') else {}),headless=True,args=['--no-sandbox','--disable-extensions'])
  page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
  errs=[];page.on('pageerror',lambda e: errs.append(str(e)))
  page.goto('file://'+str(ROOT/'index.html'),wait_until='load')
  assert '3'==page.locator('#totalMetric').inner_text(),page.locator('#totalMetric').inner_text()
  assert page.locator('.prop-card').count()==3
  assert 'DEMO ONLY' in page.locator('.prop-card').first.inner_text()
  assert page.locator('body').evaluate('(e)=>e.scrollWidth <= window.innerWidth+2'), 'Horizontal overflow on mobile'
  page.screenshot(path=str(ROOT/'mobile-preview.png'),full_page=True)
  page.get_by_role('button',name='+ New prop').click()
  page.locator('#player').fill('Test Scorer')
  page.locator('#gameDate').fill('2026-11-11')
  page.locator('#market').select_option('Points')
  page.locator('#side').select_option('Over')
  page.locator('#line').fill('20.5')
  page.locator('#odds').fill('-110')
  page.locator('#sportsbook').fill('Test Book')
  page.locator('#recentGames').fill('21, 17, 22, 26, 19, 23, 25, 18, 28, 20')
  page.locator('#statSource').fill('https://www.nba.com/stats')
  page.locator('#oddsSource').fill('https://the-odds-api.com/')
  page.locator('#injuryStatus').select_option('available')
  page.locator('#injuryChecked').fill('2026-11-11T12:55')
  page.locator('#injurySource').fill('https://official.nba.com/nba-injury-report-2026-27-season/')
  page.locator('#roleNotes').fill('Example manual sample. Not verified against real player.')
  page.locator('#matchupNotes').fill('Example no real matchup evidence.')
  page.locator('#reason').fill('Caution: testing only.')
  page.get_by_role('button',name='Save research record').click()
  assert page.locator('#totalMetric').inner_text()=='4'
  page.locator('#searchInput').fill('Test Scorer')
  assert page.locator('.prop-card').count()==1
  assert '60%' in page.locator('.prop-card').first.inner_text(),page.locator('.prop-card').first.inner_text()
  page.locator('.inspect').click()
  assert page.locator('dialog').is_visible()
  assert '6/10' in page.locator('#detailsContent').inner_text(),page.locator('#detailsContent').inner_text()
  page.locator('#agentReviewBtn').click()
  page.locator('#reviewAgent').fill('QA agent')
  page.locator('#reviewNotes').fill('Independent check missing a reliable source audit.')
  page.locator('#reviewSource').fill('https://www.nba.com/stats')
  page.locator('#reviewForm button[type=submit]').click()
  assert 'Independent check missing' in page.locator('#detailsContent').inner_text()
  page.locator('#closeDialog').click()
  page.reload(wait_until='networkidle')
  assert page.locator('#totalMetric').inner_text()=='4'
  assert page.locator('#reviewsMetric').inner_text()=='1'
  with page.expect_download() as dl:
   page.locator('#exportBtn').click()
  download=dl.value
  download.save_as(str(ROOT/'smoke-export.json'))
  import json
  obj=json.loads((ROOT/'smoke-export.json').read_text())
  assert obj['schema']=='j-nba-prop-intel' and len(obj['records'])==4
  assert len([r for r in obj['records'] if r['player']=='Test Scorer'][0]['reviews'])==1
  assert not errs,errs
  print('MOBILE PASS: initial demo, no overflow, add/edit persistence, hit rates, dialog, agent review, export; console exceptions:',errs)
  desktop=browser.new_page(viewport={'width':1280,'height':800})
  desktop.goto('file://'+str(ROOT/'index.html'),wait_until='load')
  assert desktop.locator('.prop-card').count()==3
  assert desktop.locator('body').evaluate('(e)=>e.scrollWidth <= window.innerWidth+2')
  desktop.screenshot(path=str(ROOT/'desktop-preview.png'),full_page=True)
  print('DESKTOP PASS: initial render, no horizontal overflow')
  browser.close()
finally:
 server.terminate();server.wait()