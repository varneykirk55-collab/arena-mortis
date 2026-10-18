# Reference-driven visual revision 3

Existing game.js remains unchanged. Presentation imports anatomy.js and reference-details.js.

Implemented: artist-made CC0 anatomical body and hand meshes, skin weights on existing actor rig, citizen/archer/gladiator/legionary costumes, archer hood and quiver, segmented armor and crests, fingered black gloves, rifle holographic housing and longer purchased suppressor, shotgun shell carrier, pistol slide vents, world-scaled masonry UVs, solid upper-gallery spandrels, gate pediments and pilasters, eagle/SPQR banners, perimeter scaffolds and crates, sculpted Jupiter statue with drapery and thunderbolt.

Verification: presentation geometry and actual gameplay-module simulation tests. Offline Blender render exports actual scene geometry and camera for clipping/proportion checks. Blender lighting is an approximation and its render is NOT a game screenshot, WebGL test, or performance measurement.

Live verification remains blocked in the provided cloud browser by disabled WebGL. Reference-level realism and mobile frame rate are not certified. Assets remain a mixture of artist-made anatomy and project-modeled architecture/equipment; they are not AAA scanned characters or firearms.

Asset conversion: export-anatomy.py expects the official Blender bundle extracted at /tmp/arena-assets/humans. Render scripts use /tmp/arena-assets/qa as reproducible intermediate output. Both scripts are development-only, outside dist.
