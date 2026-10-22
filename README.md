# FireFly - FireFly Club (Immersive Experience)

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

> The official next-generation interactive web portal for the FireFly Club (FireFly), engineering intelligence at the frontier through award-winning WebGL physics, generative cybernetics, and immersive spatial storytelling.

---

## Overview & Key Features

FireFly is a state-of-the-art interactive web experience inspired by top-tier award-winning creative engineering:
- **Preloader & page transitions**: One loader for the first visit and for every route change: the page is covered by a diagonal split, a number rolls while the next page's fonts, images, video and 3D scenes load behind it, the sail mark builds, and the cover splits open. Nothing is shown until the page is ready, so scenes never pop in or stutter afterwards.
- **Interactive Physics Hero**: Instanced orbit-node cluster featuring simulated spring dynamics and reactive pointer push.
- **Showreel Warp**: A tilted, skewed reel card that straightens as it reaches the middle of the screen and then scrolls away with the page (no pin, the section is the same height as the reference at 1440x900). Title lines scissor in, the copy fades up with light parallax.
- **Deep Voyage**: A tablet that opens onto Earth at sunrise with Nav standing on it, a burst of words, then five chapters driven by scroll: Build (a dark steel cage tunnel with a gold glow), Discover (a woven light vortex of rings, rays and glass facets), Create (a blue room that ends in a glass pane), Connect (the pane shatters into a field of stickers) and Record (Nav waves goodbye). Nav, the robot, tumbles weightlessly through all of it.
- **Nav**: A CC0 robot with per-chapter clips (idle, dance, wave), lit as white ceramic and brushed titanium.
- **Motion system**: Every block of text has its own entrance (lines rise out of masks, letters rise one by one, words blur in, scrubbed paragraphs brighten as you scroll, labels scramble in), blocks and cards rise from below, rows of cards rise together, numbers count up, and marquees of outlined words and chips drift across the page and speed up with your scroll.
- **About**: A beam of light over a snow plain with Nav under a spiral galaxy, statements that light up word by word as you scroll, a pinned team stage where each member's name is built from glowing dots, the full crew as equal cards, areas of expertise, and the tools we build with.
- **Inner pages**: Domains, each domain, Projects and each project share one hero (a slow field of silk contour lines in the domain's colour on desktop, drifting colour on phones), scroll-linked image strips, hover rolls, animated filters and a next-page block that floods with the next colour.
- **Performance**: One ordered frame loop drives scroll, scroll-linked DOM, effects and canvases (positions are measured a few times, never per frame). Every scene is drawn once during the loader so shaders compile before they are needed, canvases pause when off screen, and the 3D canvases drop pixel ratio and post effects if the frame rate falls. Phones get lighter variants.
- **Docked Cyber CLI**: Full keyboard-accessible terminal with auto-complete chips, history, and club command execution.
- **Universal Smooth Scroll**: Powered by Lenis with continuous velocity damping and native touch acceleration for seamless mobile delivery.

---

## Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Build & Tooling** | Vite 8, Rolldown engine, ES Modules |
| **Framework & Routing** | React 19, React Router DOM 7 |
| **3D Graphics & Shaders** | Three.js 0.185, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` |
| **Kinematics & Inertia** | `@studio-freight/lenis`, Custom Hermite easing loops |
| **Typography** | Space Grotesk, Inter, JetBrains Mono via `@fontsource` (all SIL Open Font License) |
| **Deployment Target** | Vercel SPA with automated route rewrites and edge cache headers |

---

## Prerequisites & Installation

### Prerequisites
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher

### Setup Instructions
```bash
# Clone and enter directory
cd sail-lusion

# Install dependencies
npm install

# Launch development server
npm run dev
```
Open [http://127.0.0.1:5180](http://127.0.0.1:5180) in your browser.

---

## Build, Test & Verification

```bash
# Production optimized build
npm run build

# Preview production build locally (port 5181)
npm run preview

# Automated headless browser screenshot audit (Edge/Puppeteer)
node tools/shoot.mjs http://127.0.0.1:5180/ desktop
node tools/shoot.mjs http://127.0.0.1:5180/ mobile
```

---

## Pages & Routes

| Route | Purpose & Content |
| :--- | :--- |
| `/` | Landing experience, hero physics, showreel, featured club systems, wormhole journey |
| `/about` | Who we are: hero, statements, the pinned team stage, the Core Team (17 members as equal cards, with the tag as the only difference), expertise and tools |
| `/domains`, `/domains/:id` | The five domains, each with its team, achievements, club profile, stack and projects |
| `/projects`, `/projects/:id` | Every project with filters, status, tech stack and metrics |

---

## Community Guidelines & Policies

We welcome contributions and adherence to open engineering standards:
- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [License (MIT)](LICENSE)

## Main site: v3p2 (since 2026-10-23)
The site root `/` is **v3p2** (`v3p2/`: the deployed v3, made quieter, with v2's full Inside FireFly voyage, the v4 opening screen and v2's console). The older versions stay at `/v1/`, `/v2/` and `/v3/`. `scripts/build-all.mjs` builds v3p2 into `dist/` first, then the versions into their folders; `vercel.json` sends every other path to v3p2's `index.html`. Test the combined build locally with `node tools/serve-dist.mjs` (port 4600), which routes like Vercel.
