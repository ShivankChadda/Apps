# Drone mapping + CAD desk — plan

Working name: `drone-cad` (rename whenever). **Status: plan only. Nothing is built.**

## 0. The short answer

Yes, it can be done. Not the way ArtCraft did it.

ArtCraft's apps (PdfCraft, CADCraft, the rest of the Craft suite behind the
`craft-launcher` you linked) are clean-room rewrites of entire commercial
products in Rust by a funded team. CADCraft was created on 7 October 2026 and
is still pre-alpha. Copying that strategy for one person means spending a year
re-deriving things that are already free and mature.

Split DJI Terra into its two halves:

- **Reconstruction** (structure-from-motion, dense matching, meshing, DSM/DTM,
  orthomosaic). Hard. Already solved by OpenDroneMap (ODM), open source, runs
  on your machine, exports GeoTIFF, LAS/LAZ, OBJ/glTF, and DXF/SHP contours.
- **Drafting on top of the result** (labels, plot boundaries, editable
  contours, measurements, DXF out). Not hard, and exactly what Terra does badly.
  Nobody has shipped it well as a single light desktop tool.

So: drive ODM as a local service, and build the CAD-on-orthomosaic layer
yourself. That layer is the whole project.

**Benchmark before investing:** QGIS plus the WebODM/SkyStitch plugin already
does ortho, contours, labels, polygons and DXF export. Spend one weekend in it
with your own data. If it satisfies you, stop. If QGIS's generality and
clumsiness is the problem (it usually is for a single repeated job), the app
below is justified.

## 0.1 Your setup, and what it changes

You fly a **DJI Matrice 4E** and process in **DJI Terra** today. That changes
the order of the plan, not its shape.

What the 4E gives you (reseller spec sheets; confirm against DJI's manual):

- Wide camera: 20 MP, 4/3-inch sensor, **mechanical shutter**. This is the
  mapping camera. The 48 MP medium-tele and tele cameras are for inspection,
  not photogrammetry; keep them out of the reconstruction set.
- **Built-in RTK** (network RTK / NTRIP or a D-RTK base). With a fix, camera
  positions are centimetre-level and you can skip GCPs for most plotting work.
  Keep one or two checkpoints on site anyway to measure, not assume, accuracy.
- Per-image positions are written to the JPEG XMP and also to a `.MRK` file
  per flight. ODM reads the XMP tags (RTK flag and standard deviations);
  the `.MRK` file is a backup, not a primary input.

Consequences for the phases:

- **Terra is the reference until March 2027, then it is gone.** Its exports
  (GeoTIFF ortho, DSM, LAS, DXF contours) are the fixtures the viewer is
  built on, and the yardstick ODM is measured against. Both uses end when the
  licence does, so the comparison has to happen before then.
- **ODM validation is Phase 0, not Phase 3.** Run the same site through
  NodeODM and diff it against the Terra export while you still can. One thread
  on the Pix4D community reports blurry, distorted orthos from Matrice 4E data
  in WebODM where the dense point cloud was not generated. Treat that as a
  Phase 0 verification item: confirm the dense cloud exists, process the wide
  camera only, and check the RTK tags with `exiftool` before blaming the
  engine.
- **CRS and units come from Terra's export settings.** Use the same EPSG in
  the project so Terra outputs and your drawings line up without reprojection
  on day one.

## 0.2 Constraints: cost, deadline, usage

- DJI Terra: about ₹1 lakh a year, licence ends **March 2027**.
- AutoCAD: about ₹1 lakh a year.
- Usage: roughly **10 to 15 jobs a year**.

Three things follow.

**The money is saved by free tools, not by this app.** WebODM plus QGIS plus a
free CAD (QCAD Community, LibreCAD, or CADCraft) replaces both subscriptions
at ₹0 and needs no code. Install that stack first and run one real job
through it. The app in this plan is then a convenience layer over the same
engines, justified by how much the QGIS workflow annoys you across 15 jobs a
year, not by the ₹2 lakh. Decide that honestly after the first free-stack
job.

**Processing speed does not matter at 15 jobs a year.** Do not buy a GPU. A
CPU run of 400 photos overnight is fine. If Docker or an overnight wait is
too much friction, WebODM Lightning (hosted ODM) charges by credits: at the
calculator's rate of about 2.25 images per credit, a 400-photo site costs
roughly 180 credits, about US$9 on the smallest pack, so a full year is in the
₹7,000 to ₹10,000 range. Either path is two orders of magnitude under Terra.
Free credits on sign-up cover the first test.

**March 2027 is a hard deadline for Phase 0.** Target end of January 2027 so
there is a buffer. Two things must happen before the licence ends:

1. Export every site you may ever need again from Terra in open formats
   (GeoTIFF ortho, DSM, LAS/LAZ, OBJ, DXF/SHP contours). Terra project files
   are useless without the licence.
2. Process at least two of those sites through ODM and confirm the outputs
   match Terra within the tolerance you need (distances, elevations,
   boundary positions). This is the only moment you can measure ODM against
   a reference you trust.

**On the AutoCAD side**, the app's CAD layer (Phase 2) is the long-term
answer. Until it exists, QCAD Community and LibreCAD open and edit DXF for
free; QCAD Professional (about €41, one-time, perpetual) adds DWG if someone
you deliver to insists on it. CADCraft is free and improving but pre-alpha.
There is no reason to renew AutoCAD at 15 uses a year.

## 0.3 Who uses it: you and your staff, with as little skill as possible

The end goal is your own software, shaped by your own jobs, usable by staff
who are not surveyors or CAD operators. That is a different product from
"Terra plus AutoCAD" and it changes the design more than any other input in
this document.

**The tension to resolve.** AutoCAD is powerful because it exposes everything:
layers, osnaps, a command line, typed coordinates. That is exactly what makes
it unusable without training. Low-skill use means hiding all of it behind the
handful of jobs you actually do. So the product is **task-shaped, not
tool-shaped**: a staff member picks a job type, follows a short wizard, draws
with three or four guided tools, and presses one export button. The full CAD
toolbox exists, but behind an "expert" switch that only you open.

**Design principles**

1. **One URL, no installs for staff.** The browser-plus-helper architecture
   already allows this: one machine in the office runs the helper and the
   processing engine; everyone else opens a web address. Nothing to install,
   update or configure on staff laptops.
2. **Job types, not blank canvases.** Define your three to five recurring jobs
   (for example: plot survey, boundary map for a dispute, site progress,
   contour map for a plan). Each becomes a wizard with fixed steps, fixed
   layers, fixed export package. Staff never choose a CRS, a contour interval
   or a layer name; the job type carries them.
3. **Opinionated defaults, no settings pages.** Units, CRS, contour interval,
   label style, sheet template: set once by you per job type, invisible to
   staff.
4. **Guided drawing, not CAD commands.** "Mark a plot", "Add a label", "Measure",
   "Add a spot height". Snapping is always on and automatic; there are no snap
   modes to toggle. Undo is one obvious button. No command line unless expert
   mode is on.
5. **Processing is a button with a progress bar.** Photos in, outputs appear.
   Errors are translated into plain language ("12 photos have no GPS; remove
   them and try again"), never a log dump. Logs stay available to you.
6. **Export is a package, not a format.** "Deliver" produces the zip the job
   type defines: PDF sheet, DXF, KML, GeoJSON, with a fixed naming scheme.
   Staff never see a format picker.
7. **Review before delivery.** A checklist view that shows what is missing
   (unlabelled plots, open polygons, no north arrow) so you can approve a
   staff member's work without opening QGIS.
8. **Record who did what.** Every entity carries the user who drew it and
   when. A simple name picker at login is enough; no accounts system in v1.
9. **Nothing destructive without a safety net.** Autosave, version per
   delivery, and a "restore" button. Staff should not be able to lose a job.

**What this does to the free-stack trial.** Run it with a staff member, not
only yourself, and write down every point where they stop and ask. Those stops,
plus your three to five job types, are the requirements document. Measure
success in v1 as "a new staff member completes a plot survey job unaided
after a 30-minute walkthrough".

## 1. What "Terra + AutoCAD" means concretely

**Consume or produce (Terra side)**

- 2D orthomosaic (GeoTIFF), DSM, DTM, point cloud (LAS/LAZ), textured mesh
- Contours at a chosen interval, with elevations
- GCP / RTK handling, one projected CRS per project

**Build (CAD side)**

- Job-type wizards with fixed steps, layers and export packages (staff mode)
- Review checklist and one-button "Deliver" package
- Layers; point, line, polyline, polygon, text, leader and dimension entities
  (expert mode)
- Object snaps (endpoint, midpoint, intersection, perpendicular, nearest,
  centre), ortho/polar lock, command line with typed coordinates and distances
- Plot boundaries with live area and perimeter, attributes (name, survey no.,
  owner, notes), auto-label
- Labels with leaders, contour labels, spot heights
- Measurements: distance, area, elevation profile along a line, cut/fill volume
- Export: DXF with elevations, SHP/GeoJSON/GPKG/KML, printable sheet (PDF)
  with scale bar, north arrow, title block
- Import: existing DXF/SHP/GeoJSON boundaries overlaid on the ortho

**Explicitly out:** DWG writing (convert the DXF with the free ODA File
Converter), flight planning, multispectral, LiDAR processing.

## 2. Architecture

Three processes on your own machine, same shape as `markdown-to-latex`
(browser UI plus a small local helper), with one more box for ODM:

```
Browser UI (TypeScript, Vite)        Local helper (Python)             NodeODM (Docker)
 OpenLayers 2D CAD canvas            FastAPI or http.server            opendronemap/nodeodm:gpu
 deck.gl / Potree 3D view   <--->    GDAL, PDAL, pyproj, shapely <--->  REST on :3000
 layers, snapping, tools             ezdxf, rasterio                   photos in, ortho/DEM/LAZ out
 project state                       COG/COPC/contour post-process
```

Why each piece:

- **Browser UI plus one office machine.** The helper and the engine run on
  one PC you set up once; staff open a URL on the office network. That is the
  cheapest way to meet "no skills involved": there is nothing on their
  machines to break. The same build also runs on a single laptop for field
  use.
- **NodeODM in Docker.** The only sane way to get ODM with GPU feature
  extraction on Linux/Windows. The `:gpu` image needs an NVIDIA card plus the
  nvidia-container-toolkit; on macOS it is CPU only. Day-one alternative: skip
  ODM entirely and ingest DJI Terra's own exports (GeoTIFF ortho, DSM, LAS,
  DXF contours). The viewer and CAD layer do not care who made the rasters.
- **Python helper.** GDAL and PDAL are C++ with Python bindings; there is no
  JavaScript equivalent. The helper also keeps multi-GB rasters out of browser
  memory: it converts outputs to Cloud Optimized GeoTIFF and serves HTTP range
  requests, so the browser only pulls the tiles it is looking at.
- **OpenLayers for the 2D canvas, not MapLibre.** CAD needs metres in a
  projected CRS (UTM or a national grid). MapLibre is locked to Web Mercator.
  OpenLayers supports arbitrary projections through proj4, reads COGs
  directly, and ships Draw, Modify and Snap interactions you extend into real
  CAD snaps.
- **deck.gl (with `@developmentseed/deck.gl-geotiff` and a COPC point cloud
  layer) or Potree for 3D.** Separate view, separate library. Do not make one
  canvas do both jobs.
- **ezdxf for DXF writing.** The most complete open DXF writer: layers,
  linetypes, LWPOLYLINE with elevation, TEXT/MTEXT, dimensions, and the IMAGE
  entity so the ortho can ride along as an underlay. DXF/SHP reading goes
  through GDAL/OGR.

**Option B, considered and parked:** fork CADCraft (Rust, egui, MIT) and add a
georeferenced raster underlay plus an ODM job runner. You would inherit real
CAD today: osnaps, dimensions, hatches, DXF R2000 write, DWG read. Costs: Rust
plus egui plus a pre-alpha codebase that changes daily, zero geospatial
concepts in it, and your existing tools are JS/Python. Revisit in 6 to 12
months if CADCraft stabilises.

**Option C, rejected:** pure browser, no helper. Dies on the first 2 GB
orthomosaic and cannot run GDAL or PDAL.

## 3. Data model

One project is one folder:

```
MySite/
  project.json       CRS (EPSG), extent, units, layer list, processing params, history
  photos/            originals, never modified
  odm/               raw ODM output, or a DJI Terra export dropped here
  rasters/           ortho.cog.tif  dsm.cog.tif  dtm.cog.tif  hillshade.cog.tif  slope.cog.tif
  pointcloud/        cloud.copc.laz
  mesh/              model.glb
  vectors/           contours_0.5m.gpkg  contours_1m.gpkg
  drawing.gpkg       your CAD entities, one table per layer (SQLite, survives 100k vertices)
  exports/           dxf, shp, pdf
```

Rules: one projected CRS per project, chosen once; never store CAD geometry in
lat/lon; every import is reprojected on the way in and asserted; elevations in
metres, sampled from the DTM or DSM you pick per entity.

## 4. Phases

### Phase 0 — Replace Terra before it expires (finish by end of January 2027, no app code)

This phase is mandatory and time-boxed by the licence, whether or not the app
is ever built. Order of work: archive all Terra sites first, then validate
ODM against two of them, then try the free stack end to end.

- Start NodeODM with `docker compose up`. Run one real dataset of yours
  (200 to 400 photos). Options to start from:
  `--dsm --dtm --pc-classify --dem-resolution 5 --orthophoto-resolution 3
  --pc-quality high`, plus `--gcp` if you have ground control.
- Post-process by hand: `gdal_translate -of COG`, `gdal_contour -i 1 -3d`,
  `gdaldem hillshade`, `pdal translate` to COPC.
- Open everything in QGIS. Check one known distance on site.
- Record CPU vs GPU time, the CRS you settled on, and the contour intervals
  that make sense for your terrain.
- Export every site you may need again from Terra (ortho, DSM, LAS, OBJ,
  DXF contours) into open formats. Keep two of them as reference fixtures.
- Run the free stack once end to end: WebODM (Docker or Lightning) for
  processing, QGIS for viewing and contours, QCAD or LibreCAD for the DXF.
  Note what annoyed you. That list is the app's real requirements document.

Deliverable: a `presets/` file with the ODM arguments that worked, timing
numbers, an archive of every Terra site in open formats, two fixture folders,
and the list of free-stack annoyances.
Exit: ortho and 1 m contours from ODM that match Terra within tolerance, done
before the licence lapses.

### Phase 1 — Viewer (1 to 2 weeks)

- Open or create a project; import an ODM output folder or a Terra export
  folder (auto-detected).
- Ortho in the project CRS on OpenLayers; DSM/DTM/hillshade toggles; contours
  as a labelled vector layer; elevation under the cursor; coordinate readout;
  scale bar.
- Measure distance and area. Nothing is editable yet.

Exit: you look at a site here instead of in QGIS.

### Phase 2 — Drawing layer (3 to 6 weeks, the core of the project)

Build the staff-facing tools first and the expert toolbox second. The data
model underneath is the same, so nothing is thrown away.

Staff mode (the product):

- Job-type wizard: pick type, pick processed site, draw, review, deliver.
- Four guided tools: mark plot (closed polygon with auto-label and live
  area), add label (text with leader), measure (distance and area), spot
  height. Snapping is always on, automatic, and shows a clear marker.
- One undo button, autosave, a visible "what is missing" checklist.

Expert mode (for you):

- Entities: point, line, polyline, polygon, text, leader, aligned dimension.
  Layers panel: visibility, colour, lock, linetype, lineweight.
- Snapping: endpoint, midpoint, intersection, perpendicular, nearest, centre;
  snap to contours and imported vectors; ortho/polar lock; typed input
  (`@dx,dy`, `<angle`, distance). Spatial index (Flatbush or rbush) from day
  one; never scan all features per mouse move.
- Plot boundaries: closed polygon with attributes, live area in m², ha and
  acres (configurable), perimeter, auto-label at centroid.
- Editing: vertex drag, insert/delete vertex, move, copy, rotate, offset,
  trim/extend for polylines, undo/redo.
- Import DXF/SHP/GeoJSON through OGR as reference layers.
- Export DXF through ezdxf: layers mapped 1:1, polygons as closed LWPOLYLINE,
  contours with elevation, text as TEXT/MTEXT, ortho as IMAGE entity plus
  world file, sidecar `.prj` because DXF has no CRS. SHP/GPKG/GeoJSON/KML
  through `ogr2ogr`.

Exit: a staff member completes a plot survey job unaided after a 30-minute
walkthrough, and the DXF opens in LibreCAD or CADCraft at the right
coordinates.

### Phase 3 — Processing inside the app (1 week)

- Photo folder in, NodeODM job out: upload, progress, cancel. Errors shown
  in plain language; logs behind an expert toggle.
- Presets tied to job types, not exposed as ODM options: Fast ortho / Survey
  (DSM, DTM, contours) / Full 3D.
- Office deployment: one PC runs the helper and NodeODM (or forwards to
  Lightning); staff reach it by URL. A job queue so two people can submit
  without colliding.
- Auto post-process to COG, COPC and contours on completion.
- GCP file support (ODM takes a plain text file; a click-in-photo GCP editor
  is optional and later).

Exit: a staff member goes from an SD card to a processed site without
asking you anything.

### Phase 4 — Terrain tools (1 to 2 weeks)

- Regenerate contours at any interval; major/minor styling; smoothing.
- Profile: draw a line, get an elevation section with chainage; CSV/DXF out.
- Volume: polygon plus reference (plane, elevation or DTM) gives cut/fill
  against the DSM. Spot heights. Slope map.

Exit: "how much earth" and "where does it drain" answered without another tool.

### Phase 5 — 3D view (1 to 2 weeks)

- deck.gl: COPC point cloud coloured by elevation or RGB, mesh as glb, CAD
  entities draped on the DTM. Orbit and measure. Read-only is enough.

### Phase 6 — Sheets, review and delivery (1 to 2 weeks)

- Layout page: fixed scale (1:500 and so on), north arrow, scale bar, legend,
  title block, grid. PDF through browser print or pdf-lib. One template per
  job type.
- Review checklist (unlabelled plots, open polygons, missing title fields)
  and a "Deliver" button that writes the job type's package: PDF, DXF, KML,
  GeoJSON, zipped with a fixed naming scheme, and records a version.

### Phase 7 — Packaging

- Office machine: `start.sh` or `start-windows.bat` like `markdown-to-latex`
  plus `docker-compose.yml` for NodeODM, set up once by you. Starts on boot.
- Staff: a bookmark. Nothing else.
- Later, a Tauri 2 shell for a single-laptop field setup if you want one icon
  to click. Keep the plain browser build working regardless.

Rough total for one person part-time: about three months to the end of
Phase 4. Phase 2 is where the value is; do not start Phase 5 before Phase 2
ships.

## 5. Decisions in one table

| Concern | Choice | Considered and not chosen |
|---|---|---|
| Photogrammetry | NodeODM in Docker on CPU; WebODM Lightning credits if Docker is friction | GPU purchase (not worth it at 15 jobs a year), Metashape (paid), Meshroom (no georeferenced DEM pipeline), own SfM (no) |
| Raster delivery | COG + HTTP range from the helper | Pre-tiling to XYZ (more disk, more code) |
| 2D canvas | OpenLayers + proj4 | MapLibre (Mercator only), Konva/custom canvas (no geo) |
| 3D view | deck.gl; Potree if clouds exceed ~50 M points | three.js from scratch |
| Geometry ops | shapely/GEOS in Python, JSTS in browser | |
| DXF | ezdxf write, OGR read | dxf-writer (JS, write only, thin), libdxfrw-web (GPL) |
| Point cloud | PDAL to COPC | PotreeConverter format |
| Helper API | FastAPI + uvicorn | stdlib `http.server` as in `serve.py` (fine for v0) |
| Project store | GPKG (SQLite) + project.json | Pure JSON (collapses at 100k contour vertices) |
| Desktop shell | None at first, Tauri 2 later | Electron (heavier) |
| Licences | ODM AGPL (separate process, fine for personal use); GDAL MIT; PDAL BSD; OpenLayers BSD; ezdxf MIT; deck.gl MIT | |

## 6. Risks and how to kill them early

- **No NVIDIA GPU.** ODM feature extraction on CPU; 400 photos takes hours.
  At 15 jobs a year that is an overnight run, not a problem. Use
  `--fast-orthophoto` for drafts. Do not buy hardware for this.
- **Missing the March deadline.** If Phase 0 slips past the licence, you lose
  the reference to validate ODM against and will be tempted to renew under
  pressure. Archive first, validate second, everything else after.
- **Accuracy without GCPs.** Plain EXIF GPS gives roughly 1 to 3 m absolute
  error; relative accuracy is fine for plotting, not for legal boundaries. ODM
  reads the RTK accuracy tags in DJI image XMP, so an RTK drone brings
  absolute error down to centimetres. Decide on GCPs in Phase 0.
- **CRS mistakes** are the silent killer. One CRS per project, asserted on
  every import, EPSG shown in the status bar at all times.
- **Snapping done badly is worse than none.** Spatial index from the start;
  snap priority order fixed and documented.
- **DXF consumers differ.** Test every export in LibreCAD and CADCraft (both
  free) before trusting it in AutoCAD.
- **Building AutoCAD instead of your jobs.** The expert toolbox is
  satisfying to build and useless to staff. Ship the wizard and the four
  guided tools first; add expert features only when a real job needs one.
- **Office machine as a single point of failure.** Nightly copy of the
  projects folder to a second disk or cloud storage; the helper should be
  restartable by anyone with one double-click.
- **Scope creep.** Phase 5 is nice. Phases 2 and 6 are the product.

## 7. What I need from you before Phase 0

Answered: Matrice 4E (built-in RTK); DJI Terra available until March 2027;
about ₹1 lakh a year each for Terra and AutoCAD; 10 to 15 jobs a year; used
by you and your staff; must need very little skill; own software is the end
goal.

Still open:

1. Do you fly with an RTK fix every time (NTRIP or D-RTK base), and do you
   place any checkpoints or GCPs?
2. Typical site: area, photo count, flat or hilly.
3. Machine: OS and RAM. Decides Docker-on-CPU versus Lightning credits.
4. Units for area (m², ha, acres, a local unit) and the CRS or national grid
   you report in. What EPSG does Terra export in today?
5. Who reads the DXF: you, a surveyor, a lawyer? This drives the DWG question
   and the sheet layouts.
6. 2D only, or is the 3D view a must?
7. How many staff will use it, and what do they use today (phone, laptop,
   nothing)? Shared office PC on a LAN, or laptops in the field?
8. Your three to five recurring job types, with one past example each. These
   become the wizards.
9. Is the office internet reliable enough for hosted processing (Lightning),
   or must processing work offline?

Where these are unknown the plan assumes the Terra export CRS, metres, 2D first.

## Sources checked while writing this

- ArtCraft launcher and suite: https://github.com/storytold/craft-launcher
- PdfCraft background: https://pasqualepillitteri.it/en/news/22545/pdfcraft-free-acrobat-alternative-guide
- CADCraft status and feature list: https://github.com/storytold/cadcraft and
  https://pasqualepillitteri.it/en/news/22966/cadcraft-free-autocad-alternative-rust
- ODM outputs: https://docs.opendronemap.org/outputs/
- ODM arguments (dsm, dtm, smrf, gcp, split, no-gpu): https://docs.opendronemap.org/arguments/
- WebODM contour plugin (gdal_contour, exports GPKG/SHP/DXF/GeoJSON):
  https://raw.githubusercontent.com/OpenDroneMap/WebODM/master/coreplugins/contours/api.py
- NodeODM releases and GPU images: https://github.com/OpenDroneMap/NodeODM/releases
- Native WebODM on Windows: https://opendronemap.org/?p=1054
- SkyStitch QGIS plugin (local NodeODM from QGIS): https://plugins.qgis.org/plugins/skystitch/latest/
- DJI Terra output formats (reseller listings; DJI's own spec not located):
  https://www.dronefly.com/products/dji-terra-mapping-software and
  https://www.korecgroup.com/product/dji-terra/
- COG in the browser with deck.gl: https://talks.osgeo.org/foss4g-2026/talk/7WESPL/
  and https://ts.anymap.dev/maplibre/cog_layer/
- JS DXF libraries surveyed: https://npmjs.com/package/dxf-doc,
  https://github.com/mmiscool/js-dxf, https://www.jsdelivr.com/package/npm/@mlightcad/libdxfrw-web
- Potree: https://www.npmjs.com/package/potree-core
- WebODM Lightning calculator and FAQ: https://www.webodm.net/calculator and https://www.webodm.net/faq
- QCAD Professional shop price: https://qcad.org/prestashop/en/qcad/20-qcad-professional.html
- Matrice 4E camera and RTK (reseller spec pages): https://www.dronefly.com/products/dji-matrice-4e-demo-unit
  and https://globaldronehq.com/collections/dji-matrice-4/products/dji-matrice-4e
- Matrice 4E in WebODM, poor ortho report: https://community.pix4d.com/t/poor-ortho-output-with-dji-matrice-4e/33555
- Matrice 4E RTK positions and the .MRK file: https://matricepilots.com/threads/how-to-access-camera-yaw-pitch-roll-angles-for-dji-matrice-4e-images.25997/latest
