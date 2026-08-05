# Card Shop Manager — Design Spec

**Date:** 2026-07-21  
**Status:** Draft — awaiting user review of this file  
**Stack:** Node.js monolith (Express + Playwright + better-sqlite3 + static UI)

## 1. Goal

Local web panel to manage a list of card-shop and directory URLs: import sites, crawl product listings on a schedule / on startup / on demand, and display products **grouped by shop**, sorted by **lower price first**, then **longer warranty**.

## 2. Product decisions (locked)

| Topic | Choice |
|-------|--------|
| Delivery form | Local Web panel (A) |
| Crawl strategy | Hybrid: generic heuristics + dedicated adapters for common templates (A+B+C) |
| Storage | SQLite (A) |
| Crawl triggers | Startup + manual + optional schedule (A+B+C; schedule on by default, configurable) |
| Site types | Shop vs nav separated; auto-detect on first crawl; manual override (B+C) |
| UI layout | Group by shop (A) |
| Architecture | Monolith Node app (approach 1) |

## 3. Architecture

```
Browser UI  --HTTP/JSON-->  Express API
                              |
              +---------------+---------------+
              |                               |
         SQLite DB                      Crawler Worker
    (sites, products,                 (Playwright queue,
     crawl_runs, settings)             generic + adapters)
```

- Single process, `npm start` serves API + static UI on localhost.
- Crawler runs in-process behind a job queue (concurrency default 2).
- No multi-user auth; intended for local use only.

## 4. Data model (SQLite)

### 4.1 `sites`

| Column | Type | Notes |
|--------|------|--------|
| id | INTEGER PK | |
| url | TEXT UNIQUE | Original URL |
| name | TEXT | Display name (page title if available) |
| type | TEXT | `shop` \| `nav` \| `unknown` |
| domain | TEXT | For adapter routing |
| enabled | INTEGER | 0/1, default 1 |
| last_crawl_at | TEXT | ISO timestamp |
| last_status | TEXT | `ok` \| `partial` \| `failed` \| null |
| last_error | TEXT | |
| sort_hint | INTEGER | Optional manual order |
| created_at / updated_at | TEXT | ISO timestamps |

### 4.2 `products`

| Column | Type | Notes |
|--------|------|--------|
| id | INTEGER PK | |
| site_id | INTEGER FK | |
| external_id | TEXT | Nullable |
| product_url | TEXT | Nullable |
| name | TEXT | Required when stored |
| price | REAL | Nullable if parse fails |
| price_raw | TEXT | |
| image_url | TEXT | External URL only (v1) |
| warranty_days | INTEGER | Parsed; “永久” → 36500 |
| warranty_raw | TEXT | |
| in_stock | INTEGER | 0/1/null |
| raw_json | TEXT | Debug fragment |
| crawled_at | TEXT | |

**Dedup key per site:** `external_id` if present, else `product_url` if present, else hash of `name|price_raw`.

### 4.3 `crawl_runs`

| Column | Type | Notes |
|--------|------|--------|
| id | INTEGER PK | |
| site_id | INTEGER | Null = full-batch job header optional; per-site rows preferred |
| trigger | TEXT | `startup` \| `manual` \| `schedule` |
| status | TEXT | `running` \| `ok` \| `partial` \| `failed` |
| started_at / finished_at | TEXT | |
| items_found | INTEGER | |
| error | TEXT | |

### 4.4 `settings` (key-value)

| Key | Default |
|-----|---------|
| crawl_on_startup | true |
| schedule_enabled | true |
| schedule_interval_hours | 6 |
| playwright_headless | true |
| crawl_concurrency | 2 |
| request_timeout_ms | 45000 |

### 4.5 Product sort (within a shop)

1. `price ASC` (NULLs last)  
2. `warranty_days DESC` (NULLs last)  
3. `name ASC` (stable)

Nav sites do not contribute products to this ranking.

## 5. Crawler

### 5.1 Triggers

- **Startup:** if `crawl_on_startup`, enqueue all `enabled` sites after server listen.
- **Manual:** `POST /api/crawl` with optional `siteId`.
- **Schedule:** interval from settings; only if `schedule_enabled`.

### 5.2 Job policy

- Global crawl lock: if a job is running, new requests return **409** with current status (no parallel full jobs).
- Per-site sequential within a small concurrency pool (default 2).
- One retry on transient failure.
- Success path: replace products for that `site_id` (delete stale + insert current snapshot, or upsert by dedup key then delete missing).
- Failure / empty unexpected: **do not wipe** last good products; set `last_status=failed|partial` and `last_error`.

### 5.3 Adapter routing

```
domain match → dedicated adapter
else → GenericAdapter
```

**First dedicated adapter:** `pay.ldxp.cn` (dominant in seed list).  
Others (e.g. `catfk.com`, `jeejia.cn`) can be added later without changing API.

### 5.4 GenericAdapter (Playwright)

1. Navigate to URL; wait for load / main content timeout.  
2. Heuristic product cards: nodes with price-like text and list/card structure.  
3. Extract name, price (`¥`/`￥`/`元`), image (`src`/`data-src`), warranty keywords (`质保|售后|保修|天|月|年|永久`).  
4. Type inference for `unknown`:
   - ≥1 product with parseable price → `shop`
   - else multi-link directory pattern → `nav`
   - else stay `unknown`

### 5.5 Out of scope for crawler v1

- Login / purchase automation  
- CAPTCHA solving  
- Local image mirroring  
- Aggressive anti-bot evasion beyond normal browser UA + headless flag

## 6. API

Base path: `/api`

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/sites` | List; filter `type`, `enabled` |
| POST | `/sites` | Create one site |
| POST | `/import` | Bulk URLs (newline-separated body or JSON array) |
| PATCH | `/sites/:id` | Update name/type/enabled/sort_hint |
| DELETE | `/sites/:id` | Cascade delete products |
| GET | `/sites/:id/products` | Products for shop, sorted as §4.5 |
| GET | `/overview` | Shops with nested sorted products + nav list (UI primary) |
| POST | `/crawl` | `{ siteId?: number }` — full or single |
| GET | `/crawl/status` | Running flag, progress, recent runs |
| GET/PUT | `/settings` | Read/update settings |

Errors: JSON `{ error: string }`, appropriate HTTP codes (400/404/409/500).

## 7. UI

Static files under `public/`, served by Express.

1. **Top bar:** refresh-all, crawl status, last finished time, settings link.  
2. **Sections:** Shops / Nav / Unknown.  
3. **Shop block:** name, URL, last status, per-shop refresh; product cards (image, name, price, warranty_raw, link).  
4. **Nav block:** name + URL only.  
5. **Import:** textarea paste of URLs.  
6. **Settings:** crawl_on_startup, schedule_enabled, interval_hours, concurrency, timeout, headless.

Default stack: Express static HTML/CSS + small vanilla JS (no mandatory SPA build). Optional Vite later if UI grows.

## 8. Seed URLs

Import the user-provided list as initial seed (shops + nav/index sites mixed). Stored as given; classification via auto-detect + manual override.

## 9. Project layout

```
crawler/
  package.json
  README.md
  src/
    index.js                 # boot
    server.js                # Express app
    db/
      schema.js
      client.js
    crawler/
      queue.js
      worker.js
      generic.js
      adapters/
        pay-ldxp.js
    parsers/
      price.js
      warranty.js
    routes/
      sites.js
      products.js
      crawl.js
      settings.js
      import.js
  public/
    index.html
    app.js
    styles.css
  data/                      # gitignored SQLite
  docs/superpowers/specs/
    2026-07-21-card-shop-manager-design.md
```

## 10. Error handling & logging

- Per-site isolation: one failure does not abort batch.  
- Persist errors on `sites.last_error` and `crawl_runs.error`.  
- Console log job start/end and site outcomes.  
- Optional debug screenshot flag (default off).

## 11. Testing

- Unit: price/warranty parsers, product sort, dedup key.  
- Adapter fixture: HTML sample for `pay.ldxp.cn` shape (offline).  
- Manual smoke: import seed list → start → overview groups and sorts correctly.

## 12. Success criteria

1. Multi-line URL import works.  
2. Startup, manual, and scheduled crawls work when enabled.  
3. Shop products show name, price, image URL, warranty.  
4. Within each shop: cheaper first, then longer warranty.  
5. Nav sites listed separately without product ranking.  
6. `npm start` serves usable localhost panel.

## 13. Non-goals (v1)

- Public deployment / auth  
- Multi-tenant  
- Order placement  
- Price history charts (future)  
- Full adapter coverage for every seed domain on day one
