# StackGraph

> Visualize your `docker-compose.yml` as an interactive service dependency graph — right in the browser, no backend required.

![License: MIT](https://img.shields.io/badge/License-MIT-2DD4BF.svg)
![Angular](https://img.shields.io/badge/Angular-21-DD0031.svg?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED.svg?logo=docker&logoColor=white)

[CI](https://github.com/TobiasKlanert/stackgraph/actions/workflows/ci.yml/badge.svg) 

StackGraph is a **frontend-only** developer tool. You paste the contents of a `docker-compose.yml`
and get an interactive graph that makes the structure of the file visible: services, networks,
volumes, dependencies (`depends_on`) and port mappings. Everything runs client-side in the browser
— there is no server, no login, and nothing is uploaded anywhere.

It doubles as a portfolio project, built to demonstrate clean Angular architecture, strict
TypeScript, and solid data visualization.

---

## Project status

**Under active development.**

The foundation (repository, toolchain, CI/CD, Docker build, and deployment behind a reverse proxy)
is in place. The application is currently an Angular skeleton with routing and stubbed feature
components; the core functionality described below is being implemented incrementally.

| Area | Status |
|------|--------|
| Repo, tooling, ESLint/Prettier, CI pipeline | ✅ Done |
| Docker multi-stage build + deployment | ✅ Done |
| Routing (`/`, `/imprint`, `/privacy-policy`) | ✅ Scaffolded |
| YAML parsing & validation | ⏳ Planned |
| ELK-based layout, SVG rendering, zoom/pan | ⏳ Planned |
| Detail panel, SVG/PNG export | ⏳ Planned |

The feature list below describes the **target MVP**, not the current build.

---

## Features (target MVP)

- **Paste-based input** — drop in a `docker-compose.yml`; a live, editable YAML editor sits next to the graph.
- **"Try it" example** — one click loads a sample compose file and renders a full graph instantly.
- **Parsing & validation** — invalid YAML produces a clear, human-readable error (reason, and line where possible) instead of a crash.
- **Interactive graph:**
  - services as nodes,
  - `depends_on` as directed edges,
  - networks and volumes as their own node/group types,
  - ports shown as a detail on the selected node (in the detail panel).
- **Interaction** — zoom, pan, select nodes, and inspect details (image, ports, networks, dependencies).
- **Export** — download the graph as **SVG** (PNG planned for a later release).
- **Responsive UI** — split view (editor + graph) that adapts to narrow screens.

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Angular 21 + TypeScript (strict) |
| YAML parsing | [`js-yaml`](https://github.com/nodeca/js-yaml) |
| Graph layout | [`elkjs`](https://github.com/kieler/elkjs) (ELK layered algorithm) |
| Rendering | Custom SVG via Angular template binding |
| Pan / zoom | [`d3-zoom`](https://github.com/d3/d3-zoom) (transform matrix only) |
| State | Signals as the source of truth; RxJS for the debounced parse → layout pipeline |
| Testing | [Vitest](https://vitest.dev/) (jsdom) |
| Linting / formatting | ESLint (flat config via angular-eslint) + Prettier |
| Container | Multi-stage Docker build (`node:22-alpine` → `nginx:alpine`) |

> **Why ELK + custom SVG instead of a bundled graph library?** Separating *layout* (computing
> positions) from *rendering + interaction* (drawing SVG, handling zoom/pan/click) keeps each layer
> clean, makes SVG export trivial (we own the DOM), and produces high-quality layered layouts for the
> dependency graph.

---

## Getting started

### Prerequisites

- **Node.js 22 LTS** (recommended — matches the Docker build stage). Angular 21 supports Node
  `^20.19`, `^22.12`, or `^24`. Newer versions may work but can be flagged as unsupported by the CLI.
- **npm 11+** (comes with recent Node versions).
- **Git**.
- **Docker** — only required for the container workflow further below.

> The Angular CLI is used via npm scripts, so a global `@angular/cli` install is optional. If you
> prefer global `ng` commands, install it with `npm install -g @angular/cli`.

### 1. Clone the repository

```bash
git clone https://github.com/TobiasKlanert/stackgraph.git
cd stackgraph
```

*(Replace `OWNER` with the actual GitHub owner once the repo URL is known.)*

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

This runs `ng serve`. Once it's up, open:

**http://localhost:4200/**

The app reloads automatically whenever you change a source file.

### 4. Build for production (optional)

```bash
npm run build
```

The optimized output is written to `dist/stackgraph/browser/`. These are plain static files that can
be served by any static web server.

---

## Running with Docker

The repository ships a multi-stage `Dockerfile`: it builds the Angular app with `node:22-alpine`,
then serves the static output with `nginx:alpine` (including SPA fallback and long-term caching for
hashed assets).

### 1. Clone and enter the project (if you haven't already)

```bash
git clone https://github.com/TobiasKlanert/stackgraph.git
cd stackgraph
```

### 2. Build the image

```bash
docker build -t stackgraph .
```

### 3. Run the container

```bash
docker run --rm -p 8080:80 stackgraph
```

The container serves on port `80` internally; the command above maps it to `8080` on your machine.
Open:

**http://localhost:8080/**

Stop the container with `Ctrl+C`.

> **Note on `docker-compose.yml`:** the included Compose file is tailored for **deployment behind an
> existing reverse proxy** (Caddy) on an external Docker network named `web`, and therefore does not
> publish any ports. It is not meant for a quick local run — for that, use the `docker build` /
> `docker run` steps above.

---

## Testing

```bash
npm test
```

Runs the unit tests with Vitest (jsdom, no browser required).

---

## Linting & formatting

```bash
npm run lint          # ESLint
npm run format        # Prettier: write changes
npm run format:check  # Prettier: check only (used in CI)
```

Both the lint check and the Prettier format check are enforced by the CI pipeline before a pull
request can be merged.

---

## Project structure

```
src/app/
├─ core/                 # app-wide singletons, models, services (parser, ELK layout) — being built out
├─ features/
│  └─ graph/             # route "/": container + state switch between home and split view
│     ├─ graph-page/     #   container on "/", toggles home ↔ editor/graph split view
│     ├─ home/           #   empty state: compose paste field + "Try it" button
│     ├─ editor/         #   editable YAML panel
│     ├─ rendering/      #   SVG graph rendering
│     └─ detail-panel/   #   details of the selected node
├─ pages/                # independently routed, lazy-loaded pages
│  ├─ imprint/           #   lazy
│  └─ privacy-policy/    #   lazy
├─ app.routes.ts         # route definitions
└─ app.config.ts         # application providers
```

The layering follows the data flow: **parser → model → layout → rendering → interaction → export.**

---

## Roadmap

Development follows a phased plan:

1. **Phase 0 — Foundation:** repo, tooling, CI/CD, Docker, deployment. ✅
2. **Phase 1 — Data model & parser:** typed compose model, YAML parsing + validation.
3. **Phase 2 — Layout:** ELK-based layout service (async, Web Worker).
4. **Phase 3 — Rendering:** SVG rendering component + detail panel.
5. **Phase 4 — Interaction:** pan/zoom and node selection.
6. **Phase 5 — Split view:** editable YAML panel with debounced live re-parse.
7. **Phase 6 — Onboarding & export:** "Try it" sample, error UI, SVG export.
8. **Phase 7 — Polish & go-live:** styling, legal pages, responsive layout, screenshots.

Planned for a later release (v1.1): filter toggles, file upload, node drag & drop, PNG export, and
shareable permalinks.

---

## License

This project is licensed under the [MIT License](./LICENSE) © 2026 Tobias Klanert.
