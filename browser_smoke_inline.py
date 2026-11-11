from playwright.sync_api import sync_playwright
from pathlib import Path
import json
ROOT=Path(__file__).parent
html=(ROOT/'index.html').read_text().replace('<link rel="stylesheet" href="styles.css">','').replace('<script src="app.js" defer></script>','')
css=(ROOT/'styles.css').read_text();js=(ROOT/'app.js').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/lib/chromium/chromium',headless=True,args=['--no-sandbox','--disable-extensions'])
 page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True)
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded')
 page.evaluate('''() => { const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}}); }''')
 page.add_style_tag(content=css)
 page.add_script_tag(content=js)
 page.evaluate('init()')
 assert page.locator('#totalMetric').inner_text()=='3',page.locator('#totalMetric').inner_text()
 assert page.locator('.prop-card').count()==3
 assert page.locator('body').evaluate('(e)=>e.scrollWidth <= window.innerWidth+2'), 'Horizontal mobile overflow'
 page.screenshot(path=str(ROOT/'mobile-preview.png'),full_page=True)
 page.get_by_role('button',name='+ New prop').click()
 page.locator('#player').fill('Test Scorer')
 page.locator('#gameDate').fill('2026-11-11')
 page.locator('#line').fill('20.5')
 page.locator('#odds').fill('-110')
 page.locator('#sportsbook').fill('Test Book')
 page.locator('#recentGames').fill('21, 17, 22, 26, 19, 23, 25, 18, 28, 20')
 page.locator('#roleNotes').fill('Test')
 page.locator('#reason').fill('Test counterargument')
 page.get_by_role('button',name='Save research record').click()
 assert page.locator('#totalMetric').inner_text()=='4',page.locator('#formFeedback').inner_text()
 page.locator('#searchInput').fill('Test Scorer')
 assert page.locator('.prop-card').count()==1
 assert '60%' in page.locator('.prop-card').first.inner_text(),page.locator('.prop-card').first.inner_text()
 page.locator('.inspect').click()
 assert page.locator('dialog').is_visible()
 assert '6/10' in page.locator('#detailsContent').inner_text()
 page.locator('#agentReviewBtn').click()
 page.locator('#reviewAgent').fill('QA agent')
 page.locator('#reviewNotes').fill('Independent caution test')
 page.locator('#reviewForm button[type=submit]').click()
 assert 'Independent caution test' in page.locator('#detailsContent').inner_text()
 page.locator('#closeDialog').click()
 page.evaluate('init()')
 assert page.locator('#totalMetric').inner_text()=='4'
 assert page.locator('#reviewsMetric').inner_text()=='1'
 with page.expect_download() as d:
  page.locator('#exportBtn').click()
 dl=d.value;dl.save_as(str(ROOT/'smoke-export.json'))
 obj=json.loads((ROOT/'smoke-export.json').read_text())
 assert len(obj['records'])==4
 assert not errs,errs
 print('PASS: 390px initial, add, exact line L10 6/10, review, in-page persistence, JSON export; JS page exceptions none')
 desk=browser.new_page(viewport={'width':1280,'height':800})
 desk.set_content(html,wait_until='domcontentloaded')
 desk.evaluate('''() => {const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v))}});}''')
 desk.add_style_tag(content=css);desk.add_script_tag(content=js);desk.evaluate('init()')
 assert desk.locator('.prop-card').count()==3
 assert desk.locator('body').evaluate('(e)=>e.scrollWidth <= window.innerWidth+2')
 desk.screenshot(path=str(ROOT/'desktop-preview.png'),full_page=True)
 print('PASS: 1280px desktop render no overflow')
 browser.close()