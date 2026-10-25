# Arena Mortis

First-person Roman Colosseum zombie survival game optimized for mobile and desktop.

This repository preserves the existing game, including its environment overhaul, black pistol presentation, and zombie geometry/animation repairs. The migration does not redesign the game or change its current hosting configuration.

## Technology stack

- Browser-native JavaScript ES modules, HTML and CSS.
- Three.js r170, vendored in `dist/three.js` with its license, plus three of its own r170 addons in `dist/addons/` (`GLTFLoader`, `SkeletonUtils`, `BufferGeometryUtils`; import path changed to the local copy, otherwise unmodified).
- WebGL rendering; Web Audio-generated sound effects.
- Touch controls for landscape mobile play and keyboard/mouse controls for desktop.
- Local browser storage for device-local preferences and records.
- No backend, npm dependencies, package manifest, API keys, or environment variables are required by this version.

## Installation and local development

Clone this repository and enter its root. No dependency installation is necessary.

With Python 3 installed:

```sh
python -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a normal browser with WebGL enabled. Serve the files over HTTP; do not open `index.html` through a `file://` URL. Browser audio may require a user gesture. Use the game's displayed controls and menus.

`dist/` contains the actual editable application source as well as the browser-ready build. Edit those files directly when doing future development.

## Build and deployment

This is a buildless static application. There is no compilation or bundling command. A static web host should serve the complete contents of `dist/`, preserving relative paths and JavaScript module MIME types.

Existing Sites hosting is configured in `.openai/hosting.json` and remains unchanged. The current game URL is https://arena-mortis.varneykirk55.chatgpt.site. Repository migration alone must not trigger a deployment. No GitHub Actions deployment workflow is configured.

## Verification

With a recent Node.js version (Node 22 or newer recommended), run from the repository root:

```sh
node verify.mjs
node presentation-tests.mjs
node gameplay-integration.mjs
node zombie-repair-tests.mjs
node model-loading-tests.mjs
```

`verify.mjs` and `gameplay-integration.mjs` import the gameplay modules directly (a stand-in renderer is supplied through `globalThis.arenaRendererOverride`, because Node has no WebGL). `model-loading-tests.mjs` generates small glTF models in memory and checks the model pipeline end to end. The tests check gameplay invariants, the simulated gameplay loop, geometry, skeleton bindings, and deformation. Renderer/audio mocks are used. Passing these checks does not establish rendered appearance, browser compatibility, or mobile frame rate. Verify those separately on actual devices.

## Directory structure

```text
.openai/hosting.json          Existing static hosting configuration
art-source/                  Reference artwork, offline render, conversion/render scripts
dist/index.html              Game shell and HUD
dist/style.css               UI and touch-control styling
dist/game.js                 Orchestrator: start/pause/resume/shop flow and the per-frame loop
dist/state.js                Shared mutable game state (S) and weapon definitions
dist/world.js                Scene, renderer, camera, first-person groups, arena collision
dist/combat.js               Shooting, hit detection, damage, recoil, reload, melee, Jupiter's Wrath
dist/waves.js                Spawning, round progression, enemy AI, round-cleared logic
dist/economy.js              Altar shop, purchases, upgrades and attachments
dist/player.js               Movement, sprint/crouch/jump, regeneration, death, camera
dist/input.js                Keyboard, mouse, pointer lock, touch buttons and joystick
dist/hud.js                  Announcements and HUD readout
dist/audio.js                Synthesized sound effects
dist/util.js                 DOM lookup and clamp helpers
dist/models.js               External model manifest (pistol, zombies); all urls null by default
dist/assets.js               glTF/GLB loading, caching and cloning
dist/model-rigs.js           Adapters that fit loaded models to the game's weapon and zombie rigs
dist/addons/                 Three.js r170 GLTFLoader, SkeletonUtils, BufferGeometryUtils
dist/presentation.js         Environment/actor presentation, rigs, weapons and effects
dist/environment-pass.js     Colosseum visual detail
dist/reference-details.js    Roman decorative geometry and banner texture
dist/anatomy-data.js          Converted body and hand geometry buffers
dist/anatomy.js               Geometry decoding, skin weights and normal smoothing
dist/pistol-model.js          Black pistol model and hand placement
dist/three.js                Vendored rendering engine
dist/assets/                 Locally hosted surface textures
dist/ASSET-CREDITS.txt        Asset provenance and licenses
dist/THREE-LICENSE.txt        Three.js license
verify.mjs                   Gameplay invariant checks
presentation-tests.mjs       Geometry and presentation integration checks
gameplay-integration.mjs     Simulated full gameplay loop
zombie-repair-tests.mjs       Zombie skinning/animation regression checks
model-loading-tests.mjs       glTF loading, fallback, retargeting and in-game use
```

## External models (glTF / GLB)

The pistol and the zombies can be replaced by `.glb` or `.gltf` files without touching game code. Put the files in `dist/` (for example `dist/models/`) and set their `url` in `dist/models.js`; the comments there list every option. The game must be served over HTTP for loading to work.

- Nothing is fetched while every `url` is `null`, so the default game is unchanged.
- A missing or broken file logs a warning and that slot keeps its procedural model.
- Models load in the background. Zombies spawned before a model finishes use the procedural body; the pistol swaps in as soon as it is ready.
- Zombies are scaled to 1.8 m and stood on the ground, and they use the existing hit zones and AI. A model is animated by its own walk/run/attack/idle/death clips when it has them, otherwise by the game's procedural animation retargeted onto a humanoid skeleton (Mixamo- and Blender-style bone names are detected), otherwise as a rigid body that still topples on death.
- Pistol nodes named `slide` and `magazine` are driven by the existing recoil and reload animation; an empty node named `muzzle` places the muzzle flash.

## Known limitations and retained history

- The visual target is more realistic than the current procedural clothing, facial details and equipment. Reference-quality appearance is not certified.
- The original realistic human geometry is connected to zombie spawning. The body contains 12,010 exported vertices and 21,160 triangles; animation weights and seam shading were repaired without replacing its stored geometry.
- Gameplay variants exist, but the later ragged-zombie pass replaced earlier distinct costume branches. `art-source/STATUS.md` describes an earlier revision and is retained as historical documentation, not a complete current-state inventory.
- No WebGL visual verification or device FPS certification was performed during migration. Foot sliding, clipping and appearance require device testing.
- The original Blender Human Base Meshes bundle and Blender executable were temporary development inputs and are not part of this repository. The conversion script references their old temporary location. They are needed only to rerun conversion, not to run the game; the converted geometry is included.
- Offline rendering scripts reference former workspace/temporary paths and need local path configuration and Blender to run. The existing offline render is not a gameplay screenshot.
- Sounds are synthesized by game code; no separate audio files are missing.
- Environment variables are not required, so no `.env.example` is included.

## Asset licensing

See `dist/ASSET-CREDITS.txt` and `dist/THREE-LICENSE.txt`. Preserve these files with redistribution. Reference images in `art-source/` are development references, not a blanket license for reuse outside this project.

## Migration provenance

Recovered original source commit: `6a8faf7faf8364b54d3e6be14c4b4f2855227e8c` (zombie geometry and animation repair).

All original tracked project files and directory paths are retained. This migration adds documentation only. The original Sites repository and deployment are not replaced or modified.
