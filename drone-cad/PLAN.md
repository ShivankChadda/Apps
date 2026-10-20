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

- **Terra stays the engine for now.** Phase 0 becomes "export one site from
  Terra (GeoTIFF ortho, DSM, LAS, DXF contours) and build the viewer on that".
  You get a usable tool after Phase 1 and Phase 2 without touching ODM.
- **ODM moves to Phase 3 as a replacement, not a prerequisite.** When you get
  there, run the same site through NodeODM and diff it against the Terra
  export you kept. One thread on the Pix4D community reports blurry, distorted
  orthos from Matrice 4E data in WebODM where the dense point cloud was not
  generated. Treat that as a Phase 3 verification item: confirm the dense
  cloud exists, process the wide camera only, and check the RTK tags with
  `exiftool` before blaming the engine.
- **CRS and units come from Terra's export settings.** Use the same EPSG in
  the project so Terra outputs and your drawings line up without reprojection
  on day one.

## 1. What "Terra + AutoCAD" means concretely

**Consume or produce (Terra side)**

- 2D orthomosaic (GeoTIFF), DSM, DTM, point cloud (LAS/LAZ), textured mesh
- Contours at a chosen interval, with elevations
- GCP / RTK handling, one projected CRS per project

**Build (CAD side)**

- Layers; point, line, polyline, polygon, text, leader and dimension entities
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

### Phase 0 — Fixtures and a known-good pipeline (1 to 2 weekends, no app code)

With Terra in hand, the Terra export is the primary fixture and the ODM run
below is optional until Phase 3. Do the ODM run early only if you want the
timing numbers now.

- Start NodeODM with `docker compose up`. Run one real dataset of yours
  (200 to 400 photos). Options to start from:
  `--dsm --dtm --pc-classify --dem-resolution 5 --orthophoto-resolution 3
  --pc-quality high`, plus `--gcp` if you have ground control.
- Post-process by hand: `gdal_translate -of COG`, `gdal_contour -i 1 -3d`,
  `gdaldem hillshade`, `pdal translate` to COPC.
- Open everything in QGIS. Check one known distance on site.
- Record CPU vs GPU time, the CRS you settled on, and the contour intervals
  that make sense for your terrain.
- If you still have DJI Terra, export the same site once (ortho, DSM, LAS,
  DXF contours) and keep it as a second test fixture.

Deliverable: a `presets/` file with the ODM arguments that worked, timing
numbers, and two fixture folders.
Exit: ortho and 1 m contours that match Terra within tolerance.

### Phase 1 — Viewer (1 to 2 weeks)

- Open or create a project; import an ODM output folder or a Terra export
  folder (auto-detected).
- Ortho in the project CRS on OpenLayers; DSM/DTM/hillshade toggles; contours
  as a labelled vector layer; elevation under the cursor; coordinate readout;
  scale bar.
- Measure distance and area. Nothing is editable yet.

Exit: you look at a site here instead of in QGIS.

### Phase 2 — CAD layer (3 to 6 weeks, the core of the project)

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

Exit: draw a boundary set, label it, open the DXF in LibreCAD or CADCraft at
the right coordinates.

### Phase 3 — Processing inside the app (1 week)

- Photo folder in, NodeODM job out: upload, progress, cancel, logs.
- Presets: Fast ortho / Survey (DSM, DTM, contours) / Full 3D.
- Auto post-process to COG, COPC and contours on completion.
- GCP file support (ODM takes a plain text file; a click-in-photo GCP editor
  is optional and later).

Exit: no terminal between photos and drawing.

### Phase 4 — Terrain tools (1 to 2 weeks)

- Regenerate contours at any interval; major/minor styling; smoothing.
- Profile: draw a line, get an elevation section with chainage; CSV/DXF out.
- Volume: polygon plus reference (plane, elevation or DTM) gives cut/fill
  against the DSM. Spot heights. Slope map.

Exit: "how much earth" and "where does it drain" answered without another tool.

### Phase 5 — 3D view (1 to 2 weeks)

- deck.gl: COPC point cloud coloured by elevation or RGB, mesh as glb, CAD
  entities draped on the DTM. Orbit and measure. Read-only is enough.

### Phase 6 — Sheets and print (1 week)

- Layout page: fixed scale (1:500 and so on), north arrow, scale bar, legend,
  title block, grid. PDF through browser print or pdf-lib.

### Phase 7 — Packaging

- `start.sh`, `start-windows.bat`, `start-mac.command` like
  `markdown-to-latex`; `docker-compose.yml` for NodeODM.
- Later, a Tauri 2 shell if you want one icon to click. Keep the plain browser
  build working regardless.

Rough total for one person part-time: about three months to the end of
Phase 4. Phase 2 is where the value is; do not start Phase 5 before Phase 2
ships.

## 5. Decisions in one table

| Concern | Choice | Considered and not chosen |
|---|---|---|
| Photogrammetry | NodeODM in Docker, `:gpu` image | Metashape (paid), Meshroom (no georeferenced DEM pipeline), own SfM (no) |
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
  Use `--fast-orthophoto` for drafts and run full jobs overnight. Measure in
  Phase 0.
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
- **Scope creep.** Phases 5 and 6 are nice. Phase 2 is the product.

## 7. What I need from you before Phase 0

Answered: Matrice 4E (built-in RTK), DJI Terra available for processing.

Still open:

1. Do you fly with an RTK fix every time (NTRIP or D-RTK base), and do you
   place any checkpoints or GCPs?
2. Typical site: area, photo count, flat or hilly.
3. Machine: OS, RAM, GPU (NVIDIA model if any). Only matters from Phase 3.
4. Units for area (m², ha, acres, a local unit) and the CRS or national grid
   you report in. What EPSG does Terra export in today?
5. Who reads the DXF: you, a surveyor, a lawyer? This drives the DWG question
   and the sheet layouts.
6. 2D only, or is the 3D view a must?

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
- Matrice 4E camera and RTK (reseller spec pages): https://www.dronefly.com/products/dji-matrice-4e-demo-unit
  and https://globaldronehq.com/collections/dji-matrice-4/products/dji-matrice-4e
- Matrice 4E in WebODM, poor ortho report: https://community.pix4d.com/t/poor-ortho-output-with-dji-matrice-4e/33555
- Matrice 4E RTK positions and the .MRK file: https://matricepilots.com/threads/how-to-access-camera-yaw-pitch-roll-angles-for-dji-matrice-4e-images.25997/latest
