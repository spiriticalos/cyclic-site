# Graph Report - site cyclic V1  (2026-06-01)

## Corpus Check
- 11 files · ~141,925 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 45 nodes · 44 edges · 11 communities (8 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 10|Community 10]]

## God Nodes (most connected - your core abstractions)
1. `main()` - 7 edges
2. `write()` - 3 edges
3. `renderBanner()` - 3 edges
4. `sharp` - 2 edges
5. `ask()` - 2 edges
6. `downloadImage()` - 2 edges
7. `slug()` - 2 edges
8. `monthNum()` - 2 edges
9. `pad()` - 2 edges
10. `read()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (11 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.29
Nodes (10): ask(), downloadImage(), fs, main(), monthNum(), pad(), path, rl (+2 more)

### Community 1 - "Community 1"
Cohesion: 0.70
Nodes (4): closeBanner(), read(), renderBanner(), write()

## Knowledge Gaps
- **5 isolated node(s):** `fs`, `path`, `rl`, `sharp`, `headers`
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `fs`, `path`, `rl` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._