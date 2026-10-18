---
target: src/app/masuk/page.tsx
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
p2_count: 2
target_identity: "file:/Users/macbookpro/Documents/Projects/offline-pos-inventory/src/app/masuk/page.tsx"
target_fingerprint: "sha256:f01666af544f3aa78e22fe61f5fdfa0babe1966974b512d331e52795abb75255"
target_path: /Users/macbookpro/Documents/Projects/offline-pos-inventory/src/app/masuk/page.tsx
timestamp: 2026-10-18T06-36-42Z
slug: src-app-masuk-page-tsx
---
---
target: src/app/masuk/page.tsx
slug: src-app-masuk-page-tsx
total_score: 22
max_score: 40
na_heuristics: ""
p0_count: 0
p1_count: 3
p2_count: 2
method: dual-agent (A: wf-coder · B: wf-coder)
date: 2026-10-18
---

# /masuk — Design Critique

**Method: dual-agent (A: wf-coder · B: wf-coder)** — Assessment A (design review) and Assessment B (detector + browser evidence) ran in isolated sessions. Browser visualization skipped (no browser-automation tool exposed); detector CLI ran clean.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Submit fires `router.push` with no loading/success; offline signal is a 14px dot in the brand panel, not on the form. |
| 2 | Match System / Real World | 3 | Strong Indonesian retail copy with real shift windows; "HPP"/"FEFO"/"konsolidasi" jargon leaks past first-day kasir. |
| 3 | User Control and Freedom | 3 | Role cards switch freely (`aria-pressed`); backspace works; no escape from a submitted auth attempt. |
| 4 | Consistency and Standards | 2 | Copy says "4–6 digit" but UI shows 6 fixed dots + `X/6`; "Hapus" text vs icon-only backspace; emoji + lucide mixed; off-palette dot. |
| 5 | Error Prevention | 2 | `selectedKasir` defaults to `'rina'`; admin offered "Semua cabang" against its own helper; validation on submit only. |
| 6 | Recognition Rather Than Recall | 3 | Role cards + shift times carry context; destination module never previewed before submit. |
| 7 | Flexibility and Efficiency of Use | 2 | Helper promises device number-pad entry but there is no `<input>` to receive `keydown`. |
| 8 | Aesthetic and Minimalist Design | 3 | Form card clean; brand panel's 4 bullets + dual `border-t` footer rows add density; emojis dilute icon system. |
| 9 | Error Recovery | 2 | Errors are global, length-only; "Lupa kata sandi?" gives no hint for admin/owner. |
| 10 | Help and Documentation | 2 | Sparse inline help; keypad help describes a non-functional entry path. |
| **Total** | | **22/40** | **Acceptable (low end) — pulled down by functional issues, not aesthetics** |

## Design Specificity Verdict

**LLM assessment.** Foundations are right: the login card uses the sanctioned "Elevated panel" shadow, the error block uses the exact danger-soft/danger-deep pair, inputs shift to teal on focus per the form-language rule, and the copy is natural Indonesian retail with real shift windows in the kasir dropdown. As a login surface it functions.

Structurally, though, this is a category-interchangeable SaaS split-screen — dark brand panel left, white form card right — that any PM, HR, or CRM tool could ship after swapping the copy. The product character lives in the marketing strings ("FEFO", "HPP", "Toleran saat offline") and the kasir shift dropdown, not in the composition or interaction. The four feature bullets speak to a buyer, not to a cashier at 07:00 who already works here. An LMS could render this as "Student / Teacher / Admin" with the identical layout.

The interactions that should carry product character don't. The PIN keypad is the right idea but is a generic 12-button pad with no hardware-keyboard path — even though PRODUCT.md lists keyboard-emulation scanners as standard hardware and "Speed over features at the counter" as a principle. Worse, the helper `Tekan angka di keypad atau gunakan papan angka perangkat` promises device number-pad entry that physically cannot work: the PIN is captured only via `onClick` on keypad buttons, with no `<input>` to receive `keydown`. The offline state — the product's defining feature — is a 14px dot buried in the brand-panel footer, not the DESIGN.md "Status Bar (Connectivity Banner)" and not a pending-sync count. The page tells you the product is offline-first; it does not behave like it.

**Deterministic scan.** `impeccable detect --json src/app/masuk/page.tsx` returned exit 0 with an empty findings array. The detector has no rules for One-Teal-Rule counting, emoji-as-icon, or hardware-keyboard support — so the clean result is genuine but is not absolution for the issues below. It correctly stayed silent on the sanctioned elevation shadow, the semantic danger tint, and the teal-on-selected-role pattern.

**Visual overlays.** No browser-automation tool is exposed in this session. Overlay injection was skipped per the critique reference; no user-visible detector overlay is available.

## Overall Impression

Foundations right, interactions wrong. The single biggest opportunity: make the login *behave* like an offline-first POS — real hardware-keyboard PIN entry, an offline banner at the point of action, and no pre-selected cashier identity. The visual system is on-token; the product character is missing where it matters.

## What's Working

1. **Role-based progressive disclosure** — selecting a role cleanly swaps the PIN keypad for the email/password/branch form, with `aria-pressed` on each card and product-accurate descriptions. Honors PRODUCT.md's role-based access and "Progressive disclosure" principle.
2. **Semantic error treatment and Indonesian copy** — the error block uses the exact danger-soft/danger-deep tokens, and the copy is natural retail Indonesian with real shift windows. Matches audience and Semantic Purity intent.
3. **Accessibility groundwork on the PIN display** — `aria-live="polite"` announces `X dari 6 digit PIN dimasukkan`, and keypad buttons carry `focus-visible:outline-2`. Shows intent even where other controls miss accessible names.

## Priority Issues

**[P1] Hardware-keyboard PIN entry is claimed but impossible**
*Why it matters:* PRODUCT.md names keyboard-emulation scanners as standard hardware and "Speed over features at the counter" as a principle. The helper `Tekan angka di keypad atau gunakan papan angka perangkat` promises device number-pad entry that cannot work — the PIN is captured only via keypad `<button onClick>`, there is no `<input>` to receive `keydown`. Every cashier pays this tax every shift.
*Fix:* Add `<input type="password" inputMode="numeric" maxLength={6}>` (visually hidden or styled per DESIGN.md "Special — PIN input" with `text-[22px] tabular-nums tracking-widest text-center`), sync it to the dots, capture physical `keydown`, and let the on-screen keypad write to it. The helper text then becomes truthful. Add an Enter/OK on the keypad to submit in flow.
*Suggested command:* /impeccable harden

**[P1] Kasir dropdown pre-selects a person**
*Why it matters:* `selectedKasir` defaults to `'rina'`, so a rushed cashier can submit without touching the dropdown and attribute an entire shift's transactions to the wrong person. A pre-selected identity in an auth flow is an accounting-correctness risk.
*Fix:* Default the `<select id="kasir">` to an empty `— Pilih kasir —` option and block submit until a real kasir is chosen. Filter `cabang` options by role too — admin should not see "Semua cabang (konsolidasi)" against the helper text.
*Suggested command:* /impeccable harden

**[P1] Offline status is invisible at the point of action**
*Why it matters:* The product's north star is "Offline first, always" and DESIGN.md defines a "Status Bar (Connectivity Banner)" for exactly this, but offline here only flips a `w-2 h-2` dot in the brand-panel footer (`bg-[#f0b45e]`, which is also off-palette — should be `#8a5300`/`#fdf0da`). The form panel — where the cashier actually is — shows nothing.
*Fix:* Surface the connectivity banner above the form (amber `#fdf0da` offline / neutral `#f7f8fa` online per DESIGN.md) with a pending-sync count and a one-line "kamu tetap bisa masuk, transaksi akan tersinkron" reassurance. Gate the `Simulasikan offline` toggle to dev builds.
*Suggested command:* /impeccable clarify

**[P2] Unlabeled icon-only buttons and an unannounced error**
*Why it matters:* The keypad backspace (`<BackspaceIcon />`) and the password show/hide toggle (`<Eye>`/`<EyeOff>`) have no `aria-label`, so a screen reader reads nothing meaningful. The error block is a plain `<div>` with no `role="alert"`, so a failed submit is not announced. Sam has no path.
*Fix:* Add `aria-label="Hapus satu digit"` on backspace, `aria-label="Tampilkan kata sandi"`/`"Sembunyikan kata sandi"` on the toggle (and a `focus-visible` style — its class is `bg-transparent border-none` only), and put `role="alert"` (or `aria-live="assertive"`) on the error `<div>`.
*Suggested command:* /impeccable audit

**[P2] Teal overuse strains the One Teal Rule**
*Why it matters:* DESIGN.md rations teal to "one primary CTA per view and the active nav item," but here teal also appears on the eyebrow `text-[#0f6d5f]`, the selected role's border+bg+icon, the check mark, the PIN dots, keypad focus, the password toggle text, the checkbox `accent-[#0f6d5f]`, both "Lupa" links, the brand logo `bg-[#0f6d5f]`, the radial gradient, and the feature icons `text-[#9fe0d2]` (mint is decorative teal on informational elements, which the rule explicitly forbids). The detector is silent because it has no count rule; that is not absolution.
*Fix:* Revert the eyebrow to the muted group-label color `#8593a6`. Make the feature icons neutral white/`sidebar-muted` instead of mint. Keep teal for the selected-role indicator + submit + focus rings only.
*Suggested command:* /impeccable quieter

## Persona Red Flags

**Jordan (First-Timer)**
- The kasir `<select>` defaults to `Rina — Shift pagi`; a first-day cashier who is not Rina can submit as the wrong person without realizing.
- "Lupa PIN? → Hubungi admin toko" assumes Jordan knows who the admin is and how to reach them on day one.
- The helper `…atau gunakan papan angka perangkat` sends Jordan looking for a number-pad entry that does not exist; trying the physical keyboard gives silence and reads as broken.
- `Simulasikan offline` is a debug toggle exposed on a production login; a first-timer who clicks it sees only a tiny dot change and may believe they broke something.

**Sam (Accessibility)**
- The "back" keypad button renders `<BackspaceIcon />` with no `aria-label` — a screen reader announces an unnamed button.
- The password show/hide toggle contains only `<Eye>`/`<EyeOff>` with no `aria-label` and no `focus-visible` style.
- There is no `<input>` for the PIN; a screen-reader/keyboard user must tab through 12 on-screen buttons to enter 4–6 digits.
- The error block is a plain `<div>` with no `role="alert"`/`aria-live`, so a failed submit is not announced.
- PIN dots at 14px and the counter at 12px are borderline for low-vision users relying on the visual echo.
- The eyebrow `text-[#0f6d5f]` on white at 12px sits near the AA threshold for small text; muted gray would be safer.

**Casey (Mobile)**
- `grid-cols-1` stacks the entire brand panel (logo, h1, paragraph, 4 feature bullets, status footer) above the form; a distracted manager in the aisle scrolls a full screen before reaching sign-in.
- The password toggle button is `min-h-9` (36px) — below the 44px touch target for thumb use.
- The form card uses `p-8` (32px) padding with no mobile tightening, eating horizontal space on a small phone.
- The offline signal is a 14px dot in the stacked brand panel — above the fold only before scrolling, then gone.

**Rina (Kasir — project persona)**
- Default role is already `kasir` (good) and she can tap the keypad — but there is no Enter/OK, so she must break flow to tap submit separately.
- If her station has a physical keyboard/scanner (PRODUCT.md standard hardware), she cannot type her PIN on it; only the on-screen 12-button pad works, slower than her muscle memory expects.
- The kasir dropdown pre-selects `Rina`; a hurried cashier sharing a station can sign in under the previous person's name.
- When the internet is down (common per PRODUCT.md), the only reassurance is a tiny bottom-left dot — Rina needs a clear "kamu tetap bisa masuk, transaksi akan tersinkron" at eye level.
- The shift dropdown shows times but does not mark which shift is active now, so Rina could pick the wrong shift and skew the day's reconciliation.

## Minor Observations

- PIN copy "4–6 digit" contradicts the always-6-dot display and the `X/6 digit` counter; a 4-digit PIN leaves two empty slots with no explanation.
- Offline/online dot uses `#f0b45e` / `#4ed39a`, neither of which is the semantic warning (`#8a5300`) or success (`#136b3f`) token — Semantic Purity drift.
- Emojis `⚠️` and `📥` sit outside the lucide-react icon system; the error glyph should be a lucide `AlertCircle`/`TriangleAlert`.
- h1 `text-2xl lg:text-3xl` (24/30px) and h2 `text-xl lg:text-2xl` (20/24px) exceed the Display (22px) and Headline (20px) ceilings in DESIGN.md on desktop.
- The "clear" button shows text `Hapus` while the "back" button shows only an icon — inconsistent treatment of two peers in the same keypad.
- No submit loading state; `router.push` gives no feedback on a slow network.
- `Simulasikan offline` is a debug toggle exposed on a production login; gate it to dev builds.
- For admin/owner the "Lupa kata sandi?" row renders an empty `<span>` — no recovery hint at all for non-cashier roles.
- The `Ingat perangkat ini selama 30 hari` checkbox has no visible effect and no "last recognized device" hint, despite being the one trust-building affordance on the page.
- The cabang `<select>` offers `Semua cabang (konsolidasi)` to both admin and owner, contradicting its own helper.

## Questions to Consider

- A cashier's entire job is speed, so why is the fastest path — physical-keyboard PIN + Enter-to-submit — blocked in favor of a 12-button on-screen keypad, and why does the help text claim otherwise?
- If offline is the norm rather than the exception (PRODUCT.md), why is the only offline signal a 14px dot in the opposite panel's footer, far from the form where the cashier actually is?
- Why does an auth flow pre-select a cashier identity — the single field where a wrong default causes shift-accounting errors — instead of forcing an explicit choice?
- The brand panel markets the product to a user who already bought it and is trying to work: who exactly is the four-bullet feature list for at 07:00 on a Monday?
