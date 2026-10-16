# Media, models and credits

The site tells one story (see [STORY.md](STORY.md)). Everything below was downloaded from sites that allow free use. Files were checked (real JPEG, MP4 and GLB headers) before being added.

## Where each file lives

| Story role | File | Flag in `src/data/media.js` |
| --- | --- | --- |
| **Nav**, the club's friendly robot | `public/models/navigator.glb` | `HAVE.navigator` |
| The crew (intro photo, slide 1) | `public/media/crew.jpg` | `HAVE.crew` |
| The crew building a robot (slide 2) | `public/media/build.jpg` | `HAVE.build` |
| The mission recording (reel card) | `public/video/reel-desktop.mp4`, `reel-mobile.mp4` | built from the clips below (see Rebuilding the reel) |
| Console still before the 3D loads | `public/media/lab-screen.jpg` | `HAVE.lab` |
| The Cargo (project tiles) | `public/media/projects/<project-id>.jpg` | `HAVE.projects` |

## Credits

| Asset | Source | Licence |
| --- | --- | --- |
| `env/studio.hdr` | "Studio Small 09" HDRI (1k) from [Poly Haven](https://polyhaven.com/a/studio_small_09) | CC0 |
| `env/metal-*.jpg` | "Metal 012" (1K JPG: colour, normal, roughness) from [ambientCG](https://ambientcg.com/view?id=Metal012) | CC0 |
| `navigator.glb` | "RobotExpressive" by Tomás Laulhé, via the [three.js examples](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive) | CC0 |
| `crew.jpg` | [Pexels 6684552](https://www.pexels.com/photo/6684552/) | Pexels licence |
| `build.jpg` | [Pexels 9242834](https://www.pexels.com/photo/9242834/) | Pexels licence |
| `vision-core.jpg` | [Pexels 2599244](https://www.pexels.com/photo/2599244/) | Pexels licence |
| `language-playground.jpg` | [Pexels 10816120](https://www.pexels.com/photo/10816120/) | Pexels licence |
| `robotics-sim.jpg` | [Pexels 34194567](https://www.pexels.com/photo/34194567/) | Pexels licence |
| `data-lab.jpg` | [Pexels 17279853](https://www.pexels.com/photo/17279853/) | Pexels licence |
| `sail-web.jpg` | [Pexels 14553730](https://www.pexels.com/photo/14553730/) | Pexels licence |
| `edge-intelligence.jpg` | [Pexels 7174676](https://www.pexels.com/photo/7174676/) | Pexels licence |
| `project-chiron.jpg` | [Pexels 34207359](https://www.pexels.com/photo/34207359/) | Pexels licence |
| `synapse-core.jpg` | [Pexels 30547568](https://www.pexels.com/photo/30547568/) | Pexels licence |
| `neuromorphic-event-vision.jpg` | [Pexels 30547566](https://www.pexels.com/photo/30547566/) | Pexels licence |
| `autonomous-summit-2026.jpg` | [Pexels 31129059](https://www.pexels.com/photo/31129059/) | Pexels licence |
| `industry-immersion-fellowship.jpg` | [Pexels 8345978](https://www.pexels.com/photo/8345978/) | Pexels licence |
| `spatial-web-world.jpg` | [Pexels 6424589](https://www.pexels.com/photo/6424589/) | Pexels licence |
| `binaural-haptic-audio.jpg` | [Pexels 7087619](https://www.pexels.com/photo/7087619/) | Pexels licence |
| `technical-review.jpg` | [Pexels 6549594](https://www.pexels.com/photo/6549594/) | Pexels licence |
| `engineering-handbook.jpg` | [Pexels 7054513](https://www.pexels.com/photo/7054513/) | Pexels licence |
| Reel clips (network, coding eye, humanoid robot, robot face, circuit board, robot arm, small humanoid, students, data centre) | Mixkit videos 31510, 46635, 21921, 20961, 47051, 47257, 49042, 48166, 23282 | Mixkit Stock Video Free License |
| `quantum-tensor-decomposition.jpg`, `lab-screen.jpg` | stills from Mixkit videos 31771 and 23282 | Mixkit Stock Video Free License |

Fonts (Space Grotesk, Inter, JetBrains Mono) are installed from npm through `@fontsource` and are licensed under the SIL Open Font License 1.1.

Generated placeholder art was removed; every image on the site is a real photo or footage from the sources above. Pexels and Mixkit do not require attribution, but the table keeps the trail so any asset can be swapped later. The project photos are stand-ins for the real work and can be replaced file by file.

## Rebuilding the reel

The clips are not stored in the repo. To rebuild the reel, download the nine Mixkit clips at 720p into one folder (named `m<id>.mp4`) and run `node tools/make-reel.mjs <folder>` with `FFMPEG` pointing at ffmpeg.

## Replacing a stock asset with your own

Drop your file at the same path, keep the same name, and nothing else changes. Photos should be about 3:2, the reel 1280x720 H.264 under 8 MB, and the robot model a `.glb` under 5 MB with Idle, Running, Walking, Dance, Wave, ThumbsUp, Yes and Jump animations (the names Nav uses).

Use only images and models you own or have a licence for.
