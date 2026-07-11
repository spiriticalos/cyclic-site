# Graph Report - site cyclic V1  (2026-07-10)

## Corpus Check
- 14 files · ~144,382 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 72 nodes · 80 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b4ca0c3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `main()` - 7 edges
2. `Translation tracking — Cyclic Agency` - 5 edges
3. `makeParticles()` - 4 edges
4. `rand()` - 3 edges
5. `resize()` - 3 edges
6. `step()` - 3 edges
7. `draw()` - 3 edges
8. `frame()` - 3 edges
9. `write()` - 3 edges
10. `renderBanner()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `createEngine()` --calls--> `start()`  [INFERRED]
  js/profile-card.js → js/constellation.js
- `createEngine()` --calls--> `setVars()`  [INFERRED]
  js/profile-card.js → js/title-spotlight.js

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (10): ask(), downloadImage(), fs, main(), monthNum(), pad(), path, rl (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.70
Nodes (4): closeBanner(), read(), renderBanner(), write()

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (4): start(), createEngine(), loop(), setVars()

### Community 5 - "Community 5"
Cohesion: 0.38
Nodes (3): loop(), renderFrame(), resize()

### Community 6 - "Community 6"
Cohesion: 0.50
Nodes (3): devDependencies, playwright, sharp

### Community 11 - "Community 11"
Cohesion: 0.36
Nodes (7): draw(), frame(), isMobile(), makeParticles(), rand(), resize(), step()

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): Pagini legale (de verificat status RO/EN la final), Pagini principale (EN sursă → RO output), Pagini închirieri (RO-native, SEO — RO e sursa aici), Translation tracking — Cyclic Agency, Trecerea finală (checklist)

## Knowledge Gaps
- **10 isolated node(s):** `fs`, `path`, `rl`, `playwright`, `sharp` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `start()` connect `Community 3` to `Community 11`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `rl` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._