# Graph Report - site cyclic V1  (2026-07-16)

## Corpus Check
- 19 files · ~210,085 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 128 nodes · 143 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e6f1358`
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `main()` - 7 edges
2. `13735` - 7 edges
3. `13722` - 6 edges
4. `page()` - 6 edges
5. `Translation tracking — Cyclic Agency` - 5 edges
6. `makeParticles()` - 4 edges
7. `rand()` - 3 edges
8. `resize()` - 3 edges
9. `step()` - 3 edges
10. `draw()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `createEngine()` --calls--> `setVars()`  [INFERRED]
  js/profile-card.js → js/title-spotlight.js
- `createEngine()` --calls--> `start()`  [INFERRED]
  js/profile-card.js → js/constellation.js

## Import Cycles
- None detected.

## Communities (18 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (10): ask(), downloadImage(), fs, main(), monthNum(), pad(), path, rl (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.70
Nodes (4): closeBanner(), read(), renderBanner(), write()

### Community 3 - "Community 3"
Cohesion: 0.38
Nodes (4): anyInView(), loop(), setVars(), start()

### Community 5 - "Community 5"
Cohesion: 0.38
Nodes (3): loop(), renderFrame(), resize()

### Community 6 - "Community 6"
Cohesion: 0.50
Nodes (3): devDependencies, playwright, sharp

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (9): draw(), frame(), isMobile(), makeParticles(), rand(), resize(), start(), step() (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): Pagini legale (de verificat status RO/EN la final), Pagini principale (EN sursă → RO output), Pagini închirieri (RO-native, SEO — RO e sursa aici), Translation tracking — Cyclic Agency, Trecerea finală (checklist)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (14): decodeEntities(), discoverEventUrls(), fetchText(), fs, IMG_DIR, MONTHS_EN_ABBR, MONTHS_RO_ABBR, MONTHS_RO_FULL (+6 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (14): 13722, genre, lineup, tags, title, venue, 13735, city (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.27
Nodes (10): artists, esc(), footer(), fs, jesc(), linkLabel(), nav(), page() (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.28
Nodes (3): drawFrame(), loop(), resize()

## Knowledge Gaps
- **34 isolated node(s):** `fs`, `path`, `rl`, `_comentariu`, `title` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createEngine()` connect `Community 11` to `Community 3`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `setVars()` connect `Community 3` to `Community 11`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `fs`, `path`, `rl` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 13` be split into smaller, more focused modules?**
  _Cohesion score 0.13725490196078433 - nodes in this community are weakly interconnected._
- **Should `Community 14` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._