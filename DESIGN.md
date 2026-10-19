---
name: Offline POS Inventory
description: Precise, calm retail operations platform — every element earns trust by being exactly where expected.
colors:
  teal-primary: "#0f6d5f"
  teal-hover: "#0b564a"
  teal-soft: "#e2f2ee"
  navy-sidebar: "#101828"
  navy-card: "#1b2534"
  navy-border: "#2a3648"
  blue-accent: "#12507f"
  blue-soft: "#e4eefa"
  blue-info-soft: "#e8eef7"
  success-deep: "#136b3f"
  success-soft: "#e3f4e9"
  warning-deep: "#8a5300"
  warning-soft: "#fdf0da"
  danger-deep: "#a52b22"
  danger-soft: "#fbe8e5"
  foreground-strong: "#182230"
  foreground-mid: "#5a6675"
  foreground-muted: "#8a94a3"
  surface-bg: "#f2f4f7"
  surface-white: "#ffffff"
  border-default: "#e2e6ec"
  border-mid: "#cbd2dc"
  sidebar-text: "#d3dbe6"
  sidebar-muted: "#8593a6"
  sidebar-text-strong: "#f2f6fb"
  danger-border: "#e8b4ae"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
  "3xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.teal-primary}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.teal-hover}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.foreground-strong}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground-mid}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.danger-deep}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "40px"
  card-default:
    backgroundColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "24px"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success-deep}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning-deep}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger-deep}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  badge-info:
    backgroundColor: "{colors.blue-info-soft}"
    textColor: "{colors.blue-accent}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  input-default:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.foreground-strong}"
    rounded: "{rounded.sm}"
    height: "40px"
    padding: "0 16px"
---

# Design System: Offline POS Inventory

## Overview

**Creative North Star: "The Trustworthy Counter"**

This system is the digital equivalent of a well-organized shop counter: every element is in the expected place, every label is legible, every action is consequential and obvious. The design earns trust not through decoration but through predictability — a cashier moving at speed should never search for a button, and a manager scanning anomalies at 7am should read the dashboard without cognitive effort.

The two-surface structure is intentional. The dark navy sidebar (`#101828`) is the permanent workspace — calm, recessive, always present — framing the light content area (`#f2f4f7`) where the actual work happens. Teal (`#0f6d5f`) is used sparingly: active navigation, primary CTAs, focus rings, and the few moments where the system is confirming something important. It carries weight because it is rationed.

Semantic color is the system's most expressive tool. Danger is `#a52b22` with `#fbe8e5` backgrounds; warning is `#8a5300` with `#fdf0da`; success is `#136b3f` with `#e3f4e9`. These are not decorative accents — they are operational signals that a cashier must read instantly. The palette is never used outside its semantic meaning.

**Key Characteristics:**
- Two-surface: dark navy sidebar + cool off-white content area
- Teal used on ≤10% of any given screen — its rarity is the signal
- Semantic color is the primary expressive language; decoration is absent
- Tabular numerals on all prices and quantities — data first, typography second
- Medium-generous radius (10–14px) — approachable but not playful
- System sans-serif throughout; no display fonts, no brand typeface
- Flat-by-default surfaces; depth only at modal and hover states

## Colors

The palette is operationally derived. Every color answers "what state is this item in?" rather than "how does this feel?"

### Primary
- **Operational Teal** (`#0f6d5f`): Active navigation state, primary buttons, focus rings, scan-ready badges, and confirmed-sync indicators. The one color that means "this is the main action or current location."
- **Teal Hover** (`#0b564a`): The darkened hover and active state of Operational Teal. Appears on button press and link hover.
- **Teal Soft** (`#e2f2ee`): The selected-state background for payment method toggles, suggestion row hover, and scanner-ready status badges.

### Secondary
- **Blue Accent** (`#12507f`): Secondary informational elements — "FEFO otomatis" badges, queue status, held-transaction counts. Never used as an action color.
- **Blue Soft** (`#e4eefa` / `#e8eef7`): Background fill for informational callout boxes and inline hints.

### Neutral
- **Sidebar Navy** (`#101828`): The persistent sidebar background. The deepest surface in the system, never used on content panels.
- **Navy Card** (`#1b2534`): Secondary sidebar surfaces — store info panel, user footer card. One step lighter than the sidebar itself.
- **Surface Background** (`#f2f4f7`): The main content area background. Cool and slightly off-white; stops content cards from floating unanchored.
- **Surface White** (`#ffffff`): All content cards, panels, dialogs, and inputs.
- **Border Default** (`#e2e6ec`): Panel borders, table rows, card outlines. Used at every structural division.
- **Border Mid** (`#cbd2dc`): Input borders, secondary button borders, quantity control borders.
- **Foreground Strong** (`#182230`): Primary text — headings, totals, emphasis.
- **Foreground Mid** (`#5a6675`): Secondary text — descriptions, timestamps, subtotals, helper text.
- **Foreground Muted** (`#8a94a3`): Placeholder text, icons at rest, inactive sidebar labels.

### Semantic
- **Success Deep / Soft** (`#136b3f` / `#e3f4e9`): Stock OK, sync confirmed, transaction complete.
- **Warning Deep / Soft** (`#8a5300` / `#fdf0da`): Low stock, offline mode, expiry ≤30 days, items expiring soon.
- **Danger Deep / Soft** (`#a52b22` / `#fbe8e5`): Expired batches, blocked products, void actions, error states.
- **Danger Border** (`#e8b4ae`): Border on expired/blocked product tiles and inline error callouts.

### Named Rules
**The One Teal Rule.** Teal (`#0f6d5f`) appears on one primary CTA per view and on the active nav item. It must not appear on decorative elements, section headers, or informational callouts — that role belongs to blue-info-soft. Teal means "act" or "here."

**The Semantic Purity Rule.** Danger red is never used for branding, highlighting, or visual interest. If an element is red, the user should understand immediately that something requires attention or an action was destructive.

## Typography

**Display / Headline / Body Font:** System UI sans-serif stack (`ui-sans-serif, system-ui, -apple-system, sans-serif`)
**Numeric / Mono:** System monospace (`ui-monospace, SFMono-Regular, Menlo, monospace`) — used exclusively for prices, quantities, and barcodes.

**Character:** No custom typeface — the system relies entirely on the OS native sans-serif. This is a deliberate trust choice: familiarity reduces cognitive load at the counter. The mono stack is reserved for numbers, making financial data instantly scannable against prose labels.

### Hierarchy
- **Display** (700, 22px, −0.01em tracking, 1.2 leading): Page titles in the sticky header. One per view.
- **Headline** (700, 20px, tight leading): Section titles within dialogs. Used sparingly.
- **Title** (600, 15px, 1.4 leading): Panel section headers ("Pindai & pilih barang", "Pembayaran"), cart headings, card `CardTitle`.
- **Body** (400, 14px, 1.5 leading): Table rows, list items, sidebar navigation labels, helper text.
- **Label** (500, 12px, 0.01em tracking): Input labels, badge text, section group labels in the sidebar (uppercase, wider tracking), timestamp metadata.
- **Mono / Price** (700, 15px, 1.2 leading): All currency values (`Rp43.500`), cart totals, quantity outputs. Tabular numerals enforced (`tabular-nums`).

### Named Rules
**The Tabular Numerals Rule.** Every price, quantity, total, and barcode uses `font-variant-numeric: tabular-nums`. Columns must align. A ragged price column erodes trust in the numbers.

**The Title Ceiling Rule.** Section titles inside panels use Title weight (600, 15px). Nothing inside a card escalates to Headline or Display. Only the sticky header `<h1>` reaches Display weight.

## Layout

The layout is a fixed two-column shell: a 248px fixed sidebar on the left (desktop ≥900px), a sticky header bar at the top of the content column, and a scrollable content area with `p-4` (mobile) / `p-6` (desktop) padding. Below 900px, the sidebar collapses into a `<dialog>`-based drawer accessible via a "Menu" button in the header.

The POS page uses a responsive two-column grid (`xl:grid-cols-[1fr_minmax(360px,420px)]`): the product catalog panel on the left, the sticky cart + payment panel on the right (pinned at `top: 96px`). All other pages are single-column with full-width content cards.

Content cards use `border border-[#e2e6ec]` outlines on a `#f2f4f7` background — the border reads as structure, not decoration, separating the white card surface from the off-white field. Internal card padding is `p-4` (compact sections) or `p-5` (default panel body) or `p-6` (spacious data views). Section dividers within a card use `border-t border-[#e2e6ec]`.

Grid density favors operational efficiency: rows are minimum 40–48px for touch and scanner ergonomics. Filter tab bars use a pill-container pattern (gray background, white `shadow-sm` active pill) rather than underline tabs.

**Breakpoints:** Single-column mobile below 640px (`sm:`), two-column adaptive above (`sm:grid-cols-2`, `xl:grid-cols-[...]`), sidebar transitions at 900px (`min-[900px]:`).

## Elevation & Depth

The system is flat by default. Content cards sit on a slightly darker field (`#f2f4f7`) defined by border alone — no ambient shadow at rest. Depth is used only at three specific moments:

1. **Hover state**: Cards with `hover` prop lift from `shadow-sm` to `shadow-md` — a subtle transition indicating interactivity. Product grid tiles translate `−2px` on Y-axis alongside the shadow lift.
2. **Elevated panels** (login card, dropdowns): A compound shadow (`0 1px 2px rgba(16,24,40,.05), 0 18px 40px −28px rgba(16,24,40,.35)`) grounds detached panels against the page. Dropdowns use `shadow-lg`.
3. **Modal dialogs**: A dark overlay backdrop (`rgba(15,22,33,0.5)`) creates a clear focus layer. The dialog panel itself uses `border border-[#e2e6ec]` — no additional shadow, because the backdrop handles the separation. Drawer uses `rgba(15,22,33,0.55)`.

Inline active-tab indicators (pill selectors in Inventaris, Kedaluwarsa, Laporan) use `shadow-sm` on the active pill inside a gray container — a tonal lift, not a structural one.

The focus ring on selected kedaluwarsa cards uses `shadow-[0_0_0_2px_#e2f2ee]` — a teal-tinted ring that matches the primary color without using the primary color itself.

### Shadow Vocabulary
- **Resting card** (`border` only, no shadow): All standard content panels.
- **Hover lift** (`shadow-sm` → `shadow-md`): Interactive cards, product grid tiles.
- **Active tab** (`shadow-sm` on white pill inside gray container): Filter/period pill selectors.
- **Elevated panel** (`0 1px 2px rgba(16,24,40,.05), 0 18px 40px -28px rgba(16,24,40,.35)`): Login card, detached floating containers.
- **Popover / Dropdown** (`shadow-lg`): Dropdown menus, popovers.
- **Focus ring** (`0 0 0 2px #e2f2ee`): Selected state ring on kedaluwarsa bucket cards.
- **Modal backdrop** (`rgba(15,22,33,0.5)`): All confirmation dialogs and the void authorization dialog.

### Named Rules
**The Flat-By-Default Rule.** No content card carries a shadow at rest. `shadow-sm` is a hover state or an active-tab indicator, not a default style. The border on `#f2f4f7` creates sufficient separation.

## Shapes

The system uses two primary radii: `rounded-[10px]` (inputs, buttons, inner cards, list items, suggestion rows, dialog footers) and `rounded-[14px]` (outer panel containers, modal dialogs, primary card wrappers). A tighter `rounded-[6px]` appears only on minimal controls — quantity steppers, small secondary action buttons within lists. Pills (`rounded-full` / `rounded-pill: 999px`) are used exclusively for badges and status chips.

This creates a clear hierarchy of containment: outer shell = 14px, inner element = 10px, inline control = 6px, status label = pill. The radius steps down as the element gets smaller and more functional.

No element uses sharp (0px) corners. The system is not a hard-edged tool — it is approachable and legible for operators across a range of digital literacy.

**Form language:** All interactive elements have a visible border at rest (`#cbd2dc` for inputs, `#e2e6ec` for cards). On focus or selection, the border shifts to `#0f6d5f` (teal primary). There are no borderless inputs in the main system — the field boundary is always explicit.

## Components

### Buttons
- **Shape:** Gently rounded (10px radius), full-width available via `w-full` prop
- **Primary** (`bg-[#0f6d5f] text-white`): 40px tall, `px-5 py-3`, 600 weight, 15px size. Used for "Bayar & cetak struk", "Transaksi baru", "Simpan". One per panel.
- **Hover / Focus:** Background darkens to `#0b564a`. Focus ring: 2px teal ring with 2px offset.
- **Secondary / Outline** (`border-2 border-[#cbd2dc] bg-transparent text-[#182230]`): Paired with Primary in two-column action rows ("Tahan" / "Bayar", "Batal" / "Hapus").
- **Ghost** (`bg-transparent text-[#5a6675] hover:bg-gray-100`): In-line secondary actions — "Simulasikan offline" toggle, minor nav actions.
- **Danger** (`bg-[#a52b22] text-white`): Destructive confirmations only — "Hapus item" in the void dialog. Never appears on the main canvas.
- **Icon button** (40×40px): Square format for icon-only controls.
- **Size scale:** `sm` (36px, `px-3`), `md` (40px, `px-5`) default, `lg` (44px, `px-6`).

### Badges / Chips
- **Shape:** Pill (`rounded-full`), `px-3 py-1`, 12px text, 500 weight
- **Dot variant:** 6px colored dot preceding the label, color-matched to the badge variant
- **Semantic variants:** `success` (green-50/green-700), `warning` (yellow-50/yellow-800), `danger` (red-50/red-700), `info` (blue-50/blue-700), `offline` (orange-50/orange-800), `neutral` (gray-50/gray-700)
- **Custom inline chips:** Some pages use inline `<span>` with explicit hex values matching the semantic tokens — these should be migrated to `<Badge>` variants over time.

### Cards / Panels
- **Corner style:** `rounded-[14px]` (outer panels), `rounded-[10px]` (inner list items, suggestion rows)
- **Background:** `#ffffff` on `#f2f4f7` field
- **Shadow:** None at rest; `shadow-sm` → `shadow-md` on hover for interactive cards
- **Border:** `border border-[#e2e6ec]` always present
- **Section dividers:** `border-t border-[#e2e6ec]` separates header/body/footer zones within a panel
- **Panel header:** `p-4 lg:p-5`, title at Title weight, optional right-aligned badge
- **Panel body:** `p-4 lg:p-5`, `space-y-4` or `grid gap-3` internal rhythm
- **Footer / Action bar:** `p-4 lg:p-5 border-t border-[#e2e6ec] bg-[#f7f8fa]` — slightly tinted to signal the action zone

### Inputs / Fields
- **Style:** `h-10`, `rounded-[10px]`, `border border-[#cbd2dc]`, `bg-white`, `px-4 py-3`, 15px body text
- **Focus:** Border shifts to `#0f6d5f`; 2px ring in teal with 2px offset
- **Error:** Border and ring shift to red-500 / red-500; helper text in `text-red-600` below
- **Disabled:** `opacity-50`, `cursor-not-allowed`
- **Icon slots:** `leftIcon` shifts padding to `pl-10`; `rightIcon` shifts to `pr-10`; icon color `#8a94a3` at rest
- **Label:** 14px, 500 weight, `text-gray-700`, above the input with `gap-1.5`; required fields get a `text-red-600 ml-1` asterisk
- **Special — PIN input:** `text-[22px] tabular-nums tracking-widest text-center` — oversized for touch entry, digits visually distinct

### Navigation (Sidebar)
- **Desktop sidebar:** 248px fixed, `bg-[#101828]`, `p-4 py-5`, `z-30`
- **Group labels:** 12px uppercase, `tracking-wider`, `text-[#8593a6]`
- **Nav items:** `px-3 py-2.5 min-h-[40px] rounded-[10px]`, default `text-[#d3dbe6]`, hover `bg-[#1b2534] text-white`, active `bg-[#0f6d5f] text-white`
- **Active icon:** `text-white`; inactive icon: `text-[#8b98ab]`
- **Focus ring:** `outline-2 outline-[#7fe3c9] outline-offset-2` — a lighter teal-cyan on dark for contrast
- **Mobile:** `<dialog>`-based drawer, same color scheme, closes on route change and resize

### Dialogs / Modals
- **Container:** `w-[min(440px,92vw)]`, `bg-white border border-[#e2e6ec] rounded-[14px]`
- **Backdrop:** `fixed inset-0 z-50 bg-[rgba(15,22,33,0.5)]` — darkened but not black
- **Body:** `p-5 grid gap-3`
- **Action bar:** `p-4 lg:p-5 border-t border-[#e2e6ec] bg-[#f7f8fa] flex justify-end gap-2`
- **Max width:** 440px (void/receipt), 520px (inbound save / opname), 460px (shift close)

### Status Bar (Connectivity Banner)
A distinctive component on the POS page: a full-width inline bar inside the header card that switches between a neutral gray (`bg-[#f7f8fa]`) online state and a warning amber (`bg-[#fdf0da] border-[#eccf9c]`) offline state. Uses a `Wifi` / `WifiOff` icon, a one-line status message, and a right-aligned secondary action. This pattern should be reused on any page that needs a connectivity-dependent state message.

## Do's and Don'ts

### Do:
- **Do** use `rounded-[14px]` for outer panel containers and `rounded-[10px]` for inner controls, list items, and buttons. Never mix them at the same containment level.
- **Do** use `border border-[#e2e6ec]` on every content card. The border on `#f2f4f7` is structural, not decorative.
- **Do** apply `tabular-nums` to every number, price, and quantity. Column alignment is non-negotiable.
- **Do** use teal (`#0f6d5f`) only for the active navigation item and the single primary CTA per view. Blue-info-soft (`#e8eef7 / #12507f`) handles informational callouts.
- **Do** pair a primary and secondary button in two-column action rows. The primary action is always on the right.
- **Do** use `bg-[#f7f8fa] border-t border-[#e2e6ec]` for dialog/panel footer action zones to visually separate them from the body.
- **Do** use semantic badge variants for all status chips — never inline color choices that duplicate a semantic variant.

### Don't:
- **Don't** add a resting `shadow-sm` to a standard content card. Borders handle separation; shadows are interactive states.
- **Don't** use teal as an informational or decorative color. If it's teal, it means "primary action" or "active/current."
- **Don't** use danger red (`#a52b22`) for anything that isn't destructive, errored, or expired. An amber warning exists for "caution"; red is reserved for "stop."
- **Don't** use a custom typeface or add `font-bold` to body text. Title weight (600) is the ceiling for in-panel text; Display (700) is for the `<h1>` only.
- **Don't** create a new dialog width — use the established 440px / 460px / 520px scale depending on form complexity.
- **Don't** mix the sidebar's dark surface colors (`#101828`, `#1b2534`) into the content area. The two surfaces are visually distinct by design.
- **Don't** use `rounded-full` for anything except badges, status chips, pill filter buttons, and quick-cash buttons. Cards, panels, inputs, and action buttons are `rounded-[10px]` or `rounded-[14px]`.
