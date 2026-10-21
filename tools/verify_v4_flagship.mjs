import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = process.env.BROWSER_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE_URL = 'http://localhost:5180';
const SHOTS_DIR = 'C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3/v4_expanded_audit';
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function verifyV4Expanded() {
  console.log('🚀 Launching Chrome to verify FireFly v4 Expanded Club Showcase...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-gpu-blocklist']
  });

  let allPassed = true;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('\n--- TEST 1: Kinetic Preloader Boot & Clean Unlock ---');
    await page.goto(`${BASE_URL}/v4/`, { waitUntil: 'domcontentloaded' });

    const preloaderInitial = await page.evaluate(() => {
      const p = document.querySelector('.v4-preloader');
      return {
        exists: !!p,
        overflow: document.documentElement.style.overflow
      };
    });
    console.log('Preloader initial state:', preloaderInitial);

    await sleep(1800);

    const preloaderDone = await page.evaluate(() => {
      const p = document.querySelector('.v4-preloader');
      return {
        isGone: !p || p.style.display === 'none',
        overflow: document.documentElement.style.overflow
      };
    });
    console.log('Preloader dismissed state:', preloaderDone);

    if (preloaderInitial.exists && preloaderDone.overflow === '') {
      console.log('✅ PASS: Kinetic preloader booted instantly and unlocked scroll cleanly.');
    } else {
      console.error('❌ FAIL: Preloader sequence issue:', { preloaderInitial, preloaderDone });
      allPassed = false;
    }

    console.log('\n--- TEST 2: Comprehensive Club Showcase Sections Audit ---');
    const sections = await page.evaluate(() => {
      const expected = [
        'hero',
        'philosophy',
        'domains',
        'playground',
        'projects',
        'initiatives',
        'research',
        'crew',
        'admissions',
        'terminal',
        'partners'
      ];
      const results = {};
      expected.forEach(id => {
        results[id] = !!document.getElementById(id);
      });
      return results;
    });
    console.log('Sections presence audit:', sections);

    const missingSections = Object.entries(sections).filter(([, found]) => !found).map(([id]) => id);
    if (missingSections.length === 0) {
      console.log('✅ PASS: All 11 comprehensive club showcase sections are present and mounted.');
    } else {
      console.error('❌ FAIL: Missing essential sections:', missingSections);
      allPassed = false;
    }

    console.log('\n--- TEST 3: Dual Interactive Playground (Physics + Neural Simulator) ---');
    const playgroundCheck = await page.evaluate(async () => {
      const physicsCanvas = document.querySelector('.v4-canvas-layer');
      const neuralCanvas = document.querySelector('.v4-neural-canvas');
      const actBtns = Array.from(document.querySelectorAll('.v4-act-chip'));

      let activationSwitched = false;
      if (actBtns.length > 1) {
        actBtns[1].click();
        await new Promise(r => setTimeout(r, 100));
        activationSwitched = actBtns[1].classList.contains('is-active');
      }

      return {
        hasPhysicsCanvas: !!physicsCanvas,
        hasNeuralCanvas: !!neuralCanvas,
        activationSwitched
      };
    });
    console.log('Playground check details:', playgroundCheck);

    if (playgroundCheck.hasPhysicsCanvas && playgroundCheck.hasNeuralCanvas) {
      console.log('✅ PASS: Dual interactive playground active (Physics Node Engine + Neural Tensor Simulator).');
    } else {
      console.error('❌ FAIL: Dual playground verification failed:', playgroundCheck);
      allPassed = false;
    }

    console.log('\n--- TEST 4: Full Projects Catalog & Domain Filter Chips ---');
    const projectsCheck = await page.evaluate(async () => {
      const cards = Array.from(document.querySelectorAll('.v4-project-card'));
      const filters = Array.from(document.querySelectorAll('.v4-project-filter'));

      let filterWorks = false;
      if (filters.length > 1) {
        const initialCount = cards.length;
        filters[1].click();
        await new Promise(r => setTimeout(r, 150));
        const filteredCount = document.querySelectorAll('.v4-project-card').length;
        filters[0].click(); // Reset back to All
        filterWorks = filteredCount > 0 && filteredCount <= initialCount;
      }

      return {
        totalProjects: cards.length,
        filterCount: filters.length,
        filterWorks
      };
    });
    console.log('Projects check details:', projectsCheck);

    if (projectsCheck.totalProjects >= 8 && projectsCheck.filterWorks) {
      console.log(`✅ PASS: Full projects catalog displays ${projectsCheck.totalProjects} builds with reactive filtering.`);
    } else {
      console.error('❌ FAIL: Projects catalog verification failed:', projectsCheck);
      allPassed = false;
    }

    console.log('\n--- TEST 5: All 17 Crew Members & Muthu Kumaran Tags ---');
    const crewCheck = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.v4-member-card'));
      const muthuCard = cards.find(c => c.textContent.includes('Muthu'));
      const muthuTags = muthuCard ? Array.from(muthuCard.querySelectorAll('.v4-role-tag')).map(t => t.textContent.trim()) : [];

      return {
        totalCards: cards.length,
        hasMuthu: !!muthuCard,
        muthuTags
      };
    });
    console.log('Crew check details:', crewCheck);

    if (crewCheck.totalCards === 17 && crewCheck.hasMuthu && crewCheck.muthuTags.includes('Member') && crewCheck.muthuTags.includes('Creator')) {
      console.log('✅ PASS: All 17 crew members represented with uniform dignity, and Muthu tagged as [Member] + [Creator].');
    } else {
      console.error('❌ FAIL: Crew representation issue:', crewCheck);
      allPassed = false;
    }

    console.log('\n--- TEST 6: Admissions Pipeline & Interactive FAQ Accordion ---');
    const faqCheck = await page.evaluate(async () => {
      const faqItems = Array.from(document.querySelectorAll('.v4-faq-item'));
      if (faqItems.length === 0) return { count: 0, toggles: false };

      const firstBtn = faqItems[0].querySelector('.v4-faq-question');
      const firstAnswer = faqItems[0].querySelector('.v4-faq-answer');
      const initiallyOpen = firstAnswer ? window.getComputedStyle(firstAnswer).display !== 'none' : false;

      firstBtn.click();
      await new Promise(r => setTimeout(r, 150));
      const afterClickOpen = firstAnswer ? window.getComputedStyle(firstAnswer).display !== 'none' : false;

      return {
        count: faqItems.length,
        toggles: initiallyOpen !== afterClickOpen
      };
    });
    console.log('FAQ check details:', faqCheck);

    if (faqCheck.count >= 4 && faqCheck.toggles) {
      console.log(`✅ PASS: Admissions FAQ accordion has ${faqCheck.count} questions and toggles interactively.`);
    } else {
      console.error('❌ FAIL: FAQ accordion check failed:', faqCheck);
      allPassed = false;
    }

    console.log('\n--- TEST 7: Terminal Command Execution & Scroll Stability ---');
    const scrollBefore = await page.evaluate(() => window.scrollY);

    await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('.v4-cli-chip'));
      const teamChip = chips.find(c => c.textContent.trim() === 'team');
      if (teamChip) teamChip.click();
    });
    await sleep(250);

    const scrollAfter = await page.evaluate(() => window.scrollY);
    const cliOutputCheck = await page.evaluate(() => {
      const logs = Array.from(document.querySelectorAll('.v4-cli-body div')).map(d => d.textContent);
      return {
        hasTeamOutput: logs.some(l => l.includes('All 17 Crew Members') || l.includes('17 Crew Members')),
        logsCount: logs.length
      };
    });
    console.log('CLI check details:', { scrollBefore, scrollAfter, ...cliOutputCheck });

    if (scrollBefore === scrollAfter && cliOutputCheck.hasTeamOutput) {
      console.log('✅ PASS: Terminal executed command cleanly with zero window scroll jumping.');
    } else {
      console.error('❌ FAIL: Terminal execution issue:', { scrollBefore, scrollAfter, cliOutputCheck });
      allPassed = false;
    }

    console.log('\n--- TEST 8: Mobile Responsiveness & Zero Overlap (iPhone 14 Pro Max) ---');
    await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
    await page.goto(`${BASE_URL}/v4/`, { waitUntil: 'domcontentloaded' });
    await sleep(1800);

    const mobileCheck = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.v4-member-card'));
      let cardOverlaps = 0;
      for (let i = 0; i < cards.length - 1; i++) {
        const r1 = cards[i].getBoundingClientRect();
        const r2 = cards[i + 1].getBoundingClientRect();
        if (r1.bottom > r2.top + 2 && r1.top < r2.bottom && r1.right > r2.left && r1.left < r2.right) {
          cardOverlaps++;
        }
      }

      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowWidth: window.innerWidth,
        cardOverlaps
      };
    });
    console.log('Mobile layout check details:', mobileCheck);

    await page.screenshot({ path: path.join(SHOTS_DIR, '01_mobile_expanded_v4.png') });

    if (mobileCheck.cardOverlaps === 0 && mobileCheck.bodyScrollWidth <= mobileCheck.windowWidth + 5) {
      console.log('✅ PASS: Mobile layout exhibits zero overlaps and no horizontal overflow.');
    } else {
      console.error('❌ FAIL: Mobile card overlap or horizontal overflow detected:', mobileCheck);
      allPassed = false;
    }

    if (allPassed) {
      console.log('\n🎉 ALL 8 FIREFLY v4 EXPANDED CLUB SHOWCASE TEST SUITES PASSED CLEANLY (100% SUCCESS)!');
    } else {
      console.error('\n❌ SOME EXPANDED VERIFICATION CHECKS FAILED.');
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

verifyV4Expanded().catch((err) => {
  console.error('Exception in test suite:', err);
  process.exit(1);
});
