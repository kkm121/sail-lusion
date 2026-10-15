# SAIL - SRM Artificial Intelligence Lab (Immersive Experience)

[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.185-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

> The official next-generation interactive web portal for the SRM Artificial Intelligence Lab (SAIL), engineering intelligence at the frontier through award-winning WebGL physics, generative cybernetics, and immersive spatial storytelling.

---

## Overview & Key Features

SAIL is a state-of-the-art interactive web experience inspired by top-tier award-winning creative engineering:
- **Preloader & Reveal**: High-speed rolling counter, dynamic SVG geometry build-up, and razor-sharp diagonal split reveal.
- **Interactive Physics Hero**: Instanced orbit-node cluster featuring simulated spring dynamics and reactive pointer push.
- **Showreel Warp**: A tilted, skewed reel card that straightens as it reaches the middle of the screen and then scrolls away with the page (no pin, the section is the same height as the reference at 1440x900). Title lines scissor in, the copy fades up with light parallax.
- **Deep Lab Journey**: Five-chapter continuous voyage driven by scroll: Build (a dark steel cage with a gold glow), Discover (a woven light vortex of rings, rays and glass facets), Create (a blue room that ends in a glass pane), Connect (the pane shatters into a field of stickers) and Record (Nav waves goodbye). Nav, the robot, tumbles weightlessly through all of it.
- **Nav**: A CC0 robot with per-chapter clips (idle, dance, wave), lit as white ceramic and brushed titanium.
- **Performance**: Every chapter is drawn once during the loader so shaders compile before they are needed, the image layer renders only when something moves, and the 3D canvas drops pixel ratio and post effects if the frame rate falls.
- **Docked Cyber CLI**: Full keyboard-accessible terminal with auto-complete chips, history, and lab command execution.
- **Universal Smooth Scroll**: Powered by Lenis with continuous velocity damping and native touch acceleration for seamless mobile delivery.

---

## Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Build & Tooling** | Vite 8, Rolldown engine, ES Modules |
| **Framework & Routing** | React 19, React Router DOM 7 |
| **3D Graphics & Shaders** | Three.js 0.185, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` |
| **Kinematics & Inertia** | `@studio-freight/lenis`, Custom Hermite easing loops |
| **Typography** | Space Grotesk, Inter, JetBrains Mono via `@fontsource` |
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
| `/` | Landing experience, hero physics, showreel, featured lab systems, wormhole journey |
| `/about` | Core Lab Team (17 members, role tags, and research leadership) |
| `/domains`, `/domains/:id` | Specialized domains: Technical, R&D, Creative, Operations, and Business |
| `/projects`, `/projects/:id` | Full repository of research models, status, tech stacks, and metrics |

---

## Community Guidelines & Policies

We welcome contributions and adherence to open engineering standards:
- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [License (MIT)](LICENSE)
