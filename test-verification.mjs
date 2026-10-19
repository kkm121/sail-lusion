import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5180';

async function runTests() {
  console.log('🚀 Launching Chrome for verification tests...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  let allPassed = true;

  try {
    // ------------------------------------------------------------------------
    // TEST 1: v3 Home - LifeSection text scrub & bidirectional image pop
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 1: v3 Home text scrub & bidirectional pop images ---');
    await page.goto(`${BASE_URL}/v3/`, { waitUntil: 'networkidle0' });

    // Initial state: page at top (scrollY = 0)
    const initialWordOpacities = await page.evaluate(() => {
      const words = Array.from(document.querySelectorAll('.life-text span'));
      return words.slice(0, 5).map(w => parseFloat(window.getComputedStyle(w).opacity));
    });
    console.log('Initial word opacities (top of page):', initialWordOpacities);
    const initialPopClasses = await page.evaluate(() => {
      const pops = Array.from(document.querySelectorAll('.life-grid .pop-img-wrap'));
      return pops.map(p => p.classList.contains('is-in'));
    });
    console.log('Initial life-grid pop image is-in classes:', initialPopClasses);
    if (initialPopClasses.some(Boolean)) {
      console.warn('⚠️ Warning: Some pop images already had is-in while offscreen');
    } else {
      console.log('✅ PASS: All pop images start without is-in when offscreen.');
    }

    // Scroll down to LifeSection
    await page.evaluate(() => {
      const target = document.querySelector('.life-head');
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top - window.innerHeight * 0.4, behavior: 'instant' });
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const scrolledWordOpacities = await page.evaluate(() => {
      const words = Array.from(document.querySelectorAll('.life-text span'));
      return words.map(w => ({
        opacity: parseFloat(window.getComputedStyle(w).opacity),
        color: window.getComputedStyle(w).color
      }));
    });
    const avgOpacityScrolled = scrolledWordOpacities.reduce((a, b) => a + b.opacity, 0) / scrolledWordOpacities.length;
    console.log(`Scrolled down: average word opacity = ${avgOpacityScrolled.toFixed(2)} (sample first word opacity: ${scrolledWordOpacities[0]?.opacity})`);
    if (avgOpacityScrolled > 0.8) {
      console.log('✅ PASS: Words cleanly scrubbed and illuminated on scroll down.');
    } else {
      console.error('❌ FAIL: Words did not reach high opacity on scroll down.', avgOpacityScrolled);
      allPassed = false;
    }

    // Check life-grid pop images while scrolled down
    await page.evaluate(() => {
      window.scrollBy({ top: 400, behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 600));
    const activePopClasses = await page.evaluate(() => {
      const pops = Array.from(document.querySelectorAll('.life-grid .pop-img-wrap'));
      return pops.slice(0, 3).map(p => p.classList.contains('is-in'));
    });
    console.log('Scrolled down life-grid pop image is-in classes:', activePopClasses);
    if (activePopClasses.every(Boolean)) {
      console.log('✅ PASS: Visible pop images acquired .is-in on scroll down.');
    } else {
      console.error('❌ FAIL: Pop images did not acquire .is-in on scroll down.', activePopClasses);
      allPassed = false;
    }

    // Scroll back UP to top
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await new Promise(r => setTimeout(r, 600));

    const reversedWordOpacities = await page.evaluate(() => {
      const words = Array.from(document.querySelectorAll('.life-text span'));
      return words.slice(0, 5).map(w => parseFloat(window.getComputedStyle(w).opacity));
    });
    console.log('Reversed word opacities (back at top):', reversedWordOpacities);
    if (reversedWordOpacities.every(op => op <= 0.35)) {
      console.log('✅ PASS: Text animation cleanly reversed back to faint on scroll up.');
    } else {
      console.error('❌ FAIL: Text animation did not reverse on scroll up.', reversedWordOpacities);
      allPassed = false;
    }

    const reversedPopClasses = await page.evaluate(() => {
      const pops = Array.from(document.querySelectorAll('.life-grid .pop-img-wrap'));
      return pops.map(p => p.classList.contains('is-in'));
    });
    console.log('Reversed life-grid pop image is-in classes:', reversedPopClasses);
    if (reversedPopClasses.every(c => !c)) {
      console.log('✅ PASS: Pop images cleanly removed .is-in on scroll up (reverse animation).');
    } else {
      console.error('❌ FAIL: Pop images did not remove .is-in on scroll up.', reversedPopClasses);
      allPassed = false;
    }

    // ------------------------------------------------------------------------
    // TEST 2: Section spacing in v3
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 2: v3 Section spacing after PageHero ---');
    const pagesToTest = [
      { name: 'Projects', url: `${BASE_URL}/v3/projects`, selector: '.filters' },
      { name: 'Team', url: `${BASE_URL}/v3/team`, selector: '.card.person' },
      { name: 'CLI', url: `${BASE_URL}/v3/cli`, selector: '.cli-window' },
      { name: 'Join', url: `${BASE_URL}/v3/join`, selector: '.want' },
      { name: 'Partners', url: `${BASE_URL}/v3/partners`, selector: '.grid.g3' },
      { name: 'SignIn', url: `${BASE_URL}/v3/signin`, selector: '.form-preview-wrap' }
    ];

    for (const p of pagesToTest) {
      await page.goto(p.url, { waitUntil: 'networkidle0' });
      const spacing = await page.evaluate((sel) => {
        const ph = document.querySelector('.ph');
        const content = document.querySelector(sel);
        const section = content ? content.closest('section') : null;
        if (!ph || !section) return null;
        const phRect = ph.getBoundingClientRect();
        const sectionRect = section.getBoundingClientRect();
        const computedPaddingTop = parseFloat(window.getComputedStyle(section).paddingTop);
        return {
          gap: sectionRect.top - phRect.bottom,
          paddingTop: computedPaddingTop
        };
      }, p.selector);

      console.log(`Page [${p.name}] section paddingTop: ${spacing?.paddingTop}px, gap: ${spacing?.gap}px`);
      if (spacing && (spacing.paddingTop >= 45 || spacing.gap >= 24)) {
        console.log(`✅ PASS: [${p.name}] has generous breathing room.`);
      } else {
        console.error(`❌ FAIL: [${p.name}] is too close to hero banner.`, spacing);
        allPassed = false;
      }
    }

    // ------------------------------------------------------------------------
    // TEST 3: Marquee Slogans in v3 Team & across all marquees
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 3: Marquee slogans (no names anywhere) ---');
    await page.goto(`${BASE_URL}/v3/team`, { waitUntil: 'networkidle0' });
    const marqueeTexts = await page.evaluate(() => {
      const marquees = Array.from(document.querySelectorAll('.mq-i'));
      return marquees.map(m => m.textContent.trim());
    });
    console.log('Sample Marquee items on Team page:', marqueeTexts.slice(0, 5));
    const hasPersonName = marqueeTexts.some(t =>
      t.includes('Muthu') || t.includes('Bhattacharjee') || t.includes('Srikanth') || t.includes('Deepak')
    );
    if (!hasPersonName && marqueeTexts.length > 0) {
      console.log('✅ PASS: Team marquee contains slogans only, zero member names.');
    } else {
      console.error('❌ FAIL: Marquee contains member names or is empty!', marqueeTexts);
      allPassed = false;
    }

    // ------------------------------------------------------------------------
    // TEST 4: Creator / Member tags in v3 Team
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 4: Creator and Member tags in v3 Team ---');
    const muthuTags = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.card.person'));
      const muthuCard = cards.find(c => c.querySelector('h3')?.textContent.includes('Muthu'));
      if (!muthuCard) return null;
      const tags = Array.from(muthuCard.querySelectorAll('.tag')).map(t => t.textContent.trim());
      const subtitle = muthuCard.querySelector('p.mono')?.textContent.trim();
      return { tags, subtitle };
    });
    console.log('Muthu card details:', muthuTags);
    if (muthuTags && muthuTags.tags.includes('Member') && muthuTags.tags.includes('Creator')) {
      console.log('✅ PASS: Muthu card has both [Member] and [Creator] tags without duplicate badges.');
    } else {
      console.error('❌ FAIL: Muthu card tags incorrect:', muthuTags);
      allPassed = false;
    }

    // Verify bottom teams list has no duplicate badges
    const teamListDetails = await page.evaluate(() => {
      const lis = Array.from(document.querySelectorAll('.team-teams li'));
      const muthuLi = lis.find(li => li.textContent.includes('Muthu'));
      return muthuLi ? muthuLi.textContent.trim() : null;
    });
    console.log('Teams list Muthu entry:', teamListDetails);
    if (teamListDetails && !teamListDetails.includes('★ CREATOR')) {
      console.log('✅ PASS: Teams list has clean representation without double badges.');
    } else {
      console.error('❌ FAIL: Teams list has duplicate or flashy creator badges:', teamListDetails);
      allPassed = false;
    }

    // ------------------------------------------------------------------------
    // TEST 5: CLI Scrolling Jump Fix
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 5: CLI execution does not jump the window scroll ---');
    await page.goto(`${BASE_URL}/v3/cli`, { waitUntil: 'networkidle0' });

    // Position window around CLI
    await page.evaluate(() => {
      const win = document.querySelector('.cli-window');
      if (win) {
        win.scrollIntoView({ block: 'center' });
      }
    });
    await new Promise(r => setTimeout(r, 400));
    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Run command via input dispatch without CDP forced mouse click
    await page.evaluate(() => {
      const input = document.querySelector('.cli-input');
      input.value = 'team';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 600));

    const scrollAfter = await page.evaluate(() => window.scrollY);
    const cliBodyScroll = await page.evaluate(() => {
      const body = document.querySelector('.cli-body');
      return { scrollTop: body?.scrollTop, scrollHeight: body?.scrollHeight };
    });

    console.log(`Window scroll before: ${scrollBefore}px, after: ${scrollAfter}px`);
    console.log(`CLI internal scroll:`, cliBodyScroll);
    if (Math.abs(scrollAfter - scrollBefore) <= 2) {
      console.log('✅ PASS: Typing in CLI did NOT jump window scroll!');
    } else {
      console.error(`❌ FAIL: Typing in CLI forced page scroll to jump from ${scrollBefore} to ${scrollAfter}`);
      allPassed = false;
    }

    // ------------------------------------------------------------------------
    // TEST 6: v2 Terminal branding (firefly@amiee) & scroll stability
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 6: v2 Terminal branding (firefly@amiee instead of sail) ---');
    await page.goto(`${BASE_URL}/v2/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1200));

    // Open terminal in v2 by clicking button or keyboard shortcut
    await page.evaluate(() => {
      const btn = document.querySelector('button.btn.cli') || document.querySelector('button[aria-label*="CLI"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const termDetails = await page.evaluate(() => {
      const bar = document.querySelector('.sl-cli-bar');
      const out = document.querySelector('.sl-cli-out');
      const inLabel = document.querySelector('.sl-cli-in span');
      return {
        barText: bar?.textContent || '',
        prompt: inLabel?.textContent || '',
        outText: out?.textContent?.slice(0, 200) || '',
        hasSail: (bar?.textContent || '').includes('sail@') ||
                 (inLabel?.textContent || '').includes('sail@') ||
                 (out?.textContent || '').includes('sail@amiee')
      };
    });

    console.log('v2 Terminal branding details:', termDetails);
    if (!termDetails.hasSail && (termDetails.barText.includes('firefly@') || termDetails.prompt.includes('firefly@'))) {
      console.log('✅ PASS: v2 Terminal correctly displays firefly@amiee (zero sail@ traces).');
    } else {
      console.error('❌ FAIL: v2 Terminal still contains sail branding:', termDetails);
      allPassed = false;
    }

  } catch (err) {
    console.error('❌ Exception during test execution:', err);
    allPassed = false;
  } finally {
    await browser.close();
  }

  if (allPassed) {
    console.log('\n🎉 ALL 6 VERIFICATION SUITES PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error('\n❌ SOME VERIFICATION TESTS FAILED.');
    process.exit(1);
  }
}

runTests();
