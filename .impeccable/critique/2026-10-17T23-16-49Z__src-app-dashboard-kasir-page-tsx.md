---
target: kasir
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
target_identity: "file:/Users/macbookpro/Documents/Projects/offline-pos-inventory/src/app/(dashboard)/kasir/page.tsx"
target_fingerprint: "sha256:93a4d374493f0485b1ad0db252516d6d56931938ea2320c9405c73ac62148119"
target_path: /Users/macbookpro/Documents/Projects/offline-pos-inventory/src/app/(dashboard)/kasir/page.tsx
timestamp: 2026-10-17T23-16-49Z
slug: src-app-dashboard-kasir-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | "Scanner siap" is static. Receipt shows "Tersinkron" even when offline. |
| 2 | Match System / Real World | 3 | Good Indonesian retail language. "Hapus item" conflates remove with supervisory void. |
| 3 | User Control and Freedom | 2 | "Kosongkan" destroys cart with one tap, no undo. restoreHeld() silently overwrites active cart. |
| 4 | Consistency and Standards | 3 | Token usage consistent. "Kosongkan" (destructive) visually identical to "Tahan" (safe). |
| 5 | Error Prevention | 2 | Pay button enabled when cashReceived < total. Cash input accepts negatives. |
| 6 | Recognition Rather Than Recall | 3 | Good product tiles. Held transactions show only count+time+total. |
| 7 | Flexibility and Efficiency | 2 | Scan input not auto-focused. No keyboard shortcuts. Dead camera button. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean overall. "Diskon member -Rp0" always shown. Empty held-transactions panel wastes 100px. |
| 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Error " | 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Error | 9 | Error ##| 9 | Error | 9 | Error | 9 | Error | 9 | Error coan retail domain specificity in copy and formatting. Gaps: quick-cash missing Rp20k/R| 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Error | 9 | Error | to| 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Error | 9 | Error | 9 | Error | 9 | Erreccf9c, #e7b| 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Error | 9 | Error | 9 | Error | 9 | Error co| 9 | Err ramp drift.

## Priority Issues

[P0] Tunai payment confirms with cashReceived < total — negative change silently accepted. Fix: guard pay button disabled when cash < total; add inline shortfall warning.

[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcode Enter with no ma[P0] Silent failure on barcodea[P0] Silebutton.
MobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMobMocoded; type="search" may interfere with scanner; Check icon ambiguous for pay+print; Diskon member -Rp0 always visible; rupiah() should use Math.floor(); Tersinkron badge hardcoded regardless of isOnline; no visual separator between secondary and primary action buttons.
