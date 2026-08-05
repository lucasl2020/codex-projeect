# Card Shop Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Local Node web panel that imports card-shop/nav URLs, crawls products (startup/manual/schedule), and shows them grouped by shop sorted by lower price then longer warranty.

**Architecture:** Express monolith + better-sqlite3 + Playwright crawler worker + static UI. Hybrid adapters: dedicated `pay.ldxp.cn` + generic heuristics.

**Tech Stack:** Node 20+, Express, better-sqlite3, playwright, node-cron (or setInterval), vanilla HTML/CSS/JS.

## Global Constraints

- Localhost-only management tool; no auth in v1.
- SQLite file under `data/app.db`.
- Product sort: price ASC (nulls last), warranty_days DESC (nulls last), name ASC.
- Failed crawl must not wipe last good products for that site.
- Concurrent crawl job returns 409.
- Seed URLs from user list importable via `/api/import`.

## File map

| Path | Responsibility |
|------|----------------|
| `package.json` | deps, scripts |
| `src/index.js` | boot server + schedule + optional startup crawl |
| `src/server.js` | Express app wiring |
| `src/db/client.js` | open DB, migrations |
| `src/db/schema.js` | SQL schema + defaults |
| `src/db/repositories.js` | sites/products/runs/settings CRUD |
| `src/parsers/price.js` | parse price strings |
| `src/parsers/warranty.js` | parse warranty to days |
| `src/parsers/sort.js` | product comparator |
| `src/crawler/adapters/index.js` | adapter router by domain |
| `src/crawler/adapters/pay-ldxp.js` | pay.ldxp.cn parser |
| `src/crawler/adapters/generic.js` | Playwright generic extract |
| `src/crawler/worker.js` | crawl one site, persist |
| `src/crawler/queue.js` | job lock + concurrency pool |
| `src/routes/*.js` | HTTP routes |
| `public/*` | UI |
| `data/seed-urls.txt` | user seed list |
| `tests/*.test.js` | node:test unit tests |

---

### Task 1: Project scaffold + parsers + DB

**Files:**
- Create: `package.json`, `src/db/*`, `src/parsers/*`, `tests/parsers.test.js`, `.gitignore`, `README.md`

- [ ] Init npm, add express, better-sqlite3, playwright; script `start` / `test`
- [ ] Implement price/warranty parsers with tests
- [ ] Implement schema + repository helpers
- [ ] Run tests pass

### Task 2: Crawler worker + adapters

**Files:**
- Create: `src/crawler/**`

- [ ] Generic Playwright extract
- [ ] pay.ldxp adapter (DOM/API heuristics)
- [ ] Queue with single active job + site concurrency
- [ ] Persist products; preserve on failure

### Task 3: API routes + boot

**Files:**
- Create: `src/routes/*`, `src/server.js`, `src/index.js`

- [ ] sites/import/overview/crawl/settings endpoints
- [ ] startup crawl + schedule interval
- [ ] serve `public/`

### Task 4: UI

**Files:**
- Create: `public/index.html`, `public/app.js`, `public/styles.css`

- [ ] Import textarea, refresh all, settings
- [ ] Group shops with product cards
- [ ] Nav/unknown sections

### Task 5: Seed + smoke

- [ ] Write seed URL file from user list
- [ ] `npm install` + `npx playwright install chromium`
- [ ] Start server, import seed, manual crawl smoke (or dry unit path)

---

## Spec coverage check

| Spec item | Task |
|-----------|------|
| SQLite models | 1 |
| Sort rules | 1 (sort.js) + API |
| Hybrid crawl | 2 |
| Startup/manual/schedule | 3 |
| Shop vs nav | 2+3+4 |
| Grouped UI | 4 |
| Import seed | 4+5 |
| 409 job lock / no wipe on fail | 2 |

## Execution note

User requested immediate execution; implement Tasks 1–5 inline in this session.
