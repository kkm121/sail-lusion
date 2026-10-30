# FireFly v4 (Expanded Production Release)

The primary production release of the FireFly Club web platform, serving the root `/` route. Built with the poster visual direction, brand poster galleries, refined typography, and the complete 5-chapter **"Inside FireFly"** 3D spatial voyage.

Run: `npm install`, then `npx vite --host 127.0.0.1 --port 5190` (dev) or `npx vite build && npx vite preview --port 4190`.
`vite.config.js` builds for `/` by default; set `SITE_BASE=/` to build for the multi-version root.

## What is FireFly v4
- **Poster Aesthetic & Brand Posters**: Integration of high-definition brand posters (`poster-amiee.jpg`, `poster-benefits.jpg`, `poster-credo.jpg`, `poster-feather.jpg`) delivering a modern, clean visual direction.
- **Hero Redesign**: Team-styled typography featuring pure white "Fire", subtle grey "Fly", brick accent buttons, and a quiet bird emblem.
- **Streamlined Team Cards**: Focused layout displaying each core member's name, domain, and position.
- **Opening Screen** (`index.html`, raw WebGL): A sphere of light expands during preloading, digits count to 100, the lights configure into the FireFly wordmark in Space Grotesk, the bird ascends, and the diagonal split opens smoothly into the site (`Layout.jsx` syncs with `ff:ready`).
- **Inside FireFly Voyage** (`src/lab/`): Full 5-chapter interactive spatial odyssey ported from v2 (`Build`, `Discover`, `Create`, `Connect`, and `Record`):
  1. *Build*: Steel cage corridor with glitching telemetry and golden ambient light.
  2. *Discover*: Woven vortex of teal, violet, and gold light strands.
  3. *Create*: Architectural violet room with luminous rings.
  4. *Connect*: Glass transition into floating symbolic stickers.
  5. *Record*: Nav robot waving goodbye with a calibrated 1-second goodbye lock.
- **Mobile Optimizations**: Dedicated touch pacing, strict containment (`content-visibility: auto`), zero horizontal overflow, and full-viewport voyage scaling that prevents resize jumps during mobile scrolling.

## Smoothness of the voyage (keep it)
- `Lab.jsx` runs one per-frame step on the site clock (`onFrame`, after Lenis) instead of scroll event -> next frame.
- The DOM follows a **smoothed progress**, eased with the same curve as the 3D camera (`1 - exp(-8.5 dt)`), so the device, words, chapters and camera move together and wheel ticks don't arrive as bursts. A jump of more than 15% (a link, a reload) snaps instead of flying through.
- Device size and position are written only on resize. Its corners and bezel grow with the zoom (no repaint) and fold away only in the last part. The big soft drop shadow is a separate layer (`.sl-lab-shade`) that only fades. The title and copy blur and fade as the device swallows them (filter and opacity on small layers only).
- Measured with real mouse-wheel input (`sail-lusion/tools/v3grow.mjs`): frames with uneven motion fell from 59% to 4% (60 fps); with a 4x slower CPU from 59% to about 20%, 47 to 51-54 fps.

## Phones (keep these)
- Off-screen sections are not rendered (`content-visibility: auto` on page sections and the footer, in `base.css`). This cut the composited layers during the voyage from 115 to 30 (off-screen project cards, hero letters and reveals were re-layered every frame).
- The flying words use a 2D transform, and the voyage's words, chapter letters and title get their own layers only while on screen (`.live`).
- The page height used by the scroll tracker is cached (ResizeObserver), the header's nav pill writes only while moving, and the progress bar only when it changes.
- Measured with real touch drags on a 390x844 phone screen, CPU 4x slower (`sail-lusion/tools/v3touch.mjs`), before and after in the same session: 40-42 fps with 6-8 frames over 50 ms per run, now 44-46 fps with 0-1. The emulated phone alternates 16/33 ms frames, so its average sits in the 40s. Results on this PC swing by up to 15 fps between sessions (one session read 58 fps), so always compare A/B in one sitting. `v3trace.mjs` breaks the main thread down by kind of work, `v3prof.mjs` by function.

## Pages load on demand
Every page except Home is its own small file (`src/routes.js`, `React.lazy` in `App.jsx`), fetched when a header link is pointed at or focused, so a click opens it at once. A full loading screen per page was considered and rejected: pages are light and it would only add waiting.

## Memory rules (keep them)
- The voyage is its own chunk (three.js, react-three-fiber, drei, post-processing: about 1.2 MB). Nothing 3D is in the page bundle (`src/lab/labstate.js` exists so the page can share flags with the scene without importing three.js).
- The canvas mounts when the voyage is within 1.5 screens (after the browser is idle), draws only while on screen, and is fully unmounted (WebGL context, geometry, textures) once it is more than 2 screens away.
- Tiers in `Lab.jsx`: `full` (as v2), `lite` for 2 GB / 2-core devices (no post-processing, 1x pixels, fewer stars), `static` for Motion off, Save-Data, slow networks or no WebGL (no 3D download at all).
- What things cost (whole Chrome, GPU included): Team 593 MB, Projects 612 MB, Home without the voyage 624 MB, Home with it about 890 MB. Everything except the voyage is about 30 MB; trimming sections saves almost nothing. After leaving Home, Chrome keeps some of the freed memory for a while (about 840 MB on Team); browsers give it back lazily and pages cannot force it.
- Measured on the dev PC (whole Chrome, GPU included, `sail-lusion/tools/v3mem.mjs`): hero 827 MB, inside the voyage 1,065 MB, after it 818 MB, with 60 fps and no frame over 34 ms. v2 measured the same way: 979, 1,339 and 1,083 MB (never released), with frames up to 167 ms. A page with no 3D (Team) is about 600 MB.

## Team page
The teams are v3's stacking deck (`TeamDeck` in `src/pages/Team.jsx`): each card pins near the top and the one beneath shrinks back and dims (transform and a dimming layer's opacity, written only when they change).

## Files you will touch
| File | Purpose |
| --- | --- |
| `index.html` | Opening screen |
| `src/main.jsx` | Starts React, reports progress to the opening screen |
| `src/components/Layout.jsx` | Header (dark over the hero and over the voyage once it turns to space), footer, Lenis, page mount |
| `src/pages/Home.jsx` | Home (also served at /about) |
| `src/lab/Lab.jsx` | The voyage's scroll choreography and the mount/unmount/tier logic |
| `src/lab/LabScene.jsx` | The 3D scene (react-three-fiber) |
| `src/lab/scene/*.jsx` | v2's chapters, unchanged apart from import paths |
| `src/lab/lab.css` | v2's lab styles plus what v2 supplied from its global stylesheet |

## Keep
- The gold creator credit (M Muthu Kumaran) and equal representation of every member.
- The site's own Motion switch; it ignores the OS reduce-motion flag on purpose.
- Sign in, Sign up and CLI stay "under construction".
- Testing gotcha: v2's goodbye pause holds the scroll for one second at 97% of the voyage; scripted jump-scrolls must wait and go again.

## The Apple pass (2026-10-23)
- Slim frosted header (52 px, text links, no sliding pill), centred hero with one sentence and two actions, the bird shown at a three-quarter angle on a lit "stage" like a product shot, which lifts and recedes as you scroll.
- Home after the voyage: a bento grid (one big dark tile, two stat tiles, two habit tiles), the sentence that lights word by word, a full-width photo that grows into place, a swipeable project carousel with scroll snapping, and a one-line Join band. All in `src/styles/apple.css`.
- Motion is CSS: scroll-driven animations (`animation-timeline`) for the progress bar, the bird, the sentence and the photo; the marquee is a CSS animation. Removed: the custom cursor, magnetic buttons, card tilt, parallax, the header's spring pill, and the scrambling text.
- **Lite mode, as in v1** (`src/lib/lite.js`): automatic on phones (touch screen under 1024 px), `?lite` in the address, or the footer's "Lite: auto/on/off" switch. Lite keeps the opening screen and the whole voyage, but the voyage draws within v1's 0.8-megapixel budget with no post-processing and fewer particles, and the page drops its decorative animations and the header's blur.
