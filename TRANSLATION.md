# Translation tracking — Cyclic Agency

**Model:** Engleza = sursă (single source of truth). Fișierele RO = output, regenerat la final dintr-o singură trecere EN → RO.

**Regula de lucru:** Conținut nou / modificări de copy → DOAR în fișierul EN. Fișierul RO pereche se regenerează la final, nu se editează de mână.

**Status:**
- `synced` — RO e tradus complet și la zi cu EN
- `stale` — RO există dar trebuie re-tradus din EN (conținut EN sau învechit în body)
- `pending` — RO încă neînceput

---

## Pagini principale (EN sursă → RO output)

| EN (sursă)      | RO (output)                  | Status   | Note |
|-----------------|------------------------------|----------|------|
| `home-en.html`  | `index.html`                 | synced   | Homepage tradus integral |
| `events.html`   | `evenimente.html`            | stale    | Chrome RO, body încă EN |
| `artists.html`  | `artisti.html`               | stale    | Chrome RO, body încă EN |
| `labels.html`   | `label-uri.html`             | stale    | Chrome RO, body încă EN |
| `about.html`    | `despre-noi.html`            | stale    | Chrome RO, body încă EN |

## Pagini închirieri (RO-native, SEO — RO e sursa aici)

| RO (sursă)                      | EN (output)     | Status   | Note |
|---------------------------------|-----------------|----------|------|
| `inchiriere-echipamente.html`   | `rentals.html`  | —        | RO-native; de decis la final dacă facem EN complet |
| `inchiriere-sonorizare.html`    | (lipsă)         | pending  | Eventual EN la final, sau RO-only |
| `inchiriere-dj.html`            | (lipsă)         | pending  | Eventual EN la final, sau RO-only |
| `inchiriere-lumini.html`        | (lipsă)         | pending  | Eventual EN la final, sau RO-only |

## Pagini legale (de verificat status RO/EN la final)

| Pagină                  | Note |
|-------------------------|------|
| `privacy-policy.html`   | EN — de tradus/duplicat RO la final dacă rămâne bilingv |
| `terms.html`            | EN — idem |
| `cookie-policy.html`    | EN — idem |

---

## Trecerea finală (checklist)

La final, pentru fiecare rând `stale`/`pending`:
1. Deschide fișierul sursă, copiază structura, tradu body-ul.
2. Verifică toggle-ul de limbă + `hreflang` alternate pointează corect (RO↔EN).
3. Marchează `synced`.
