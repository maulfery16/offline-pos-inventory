# Component Specifications

## Buttons

**Primary Button**
- Background: `--color-primary`
- Text: `--color-on-primary`
- Padding: `--space-3` `--space-5`
- Border radius: `--radius-md`
- Font weight: `--weight-semibold`
- Hover: `--color-primary-hover`

**Secondary Button**
- Background: transparent
- Border: 1.5px solid `--color-border-strong`
- Text: `--color-text`
- Same padding and radius as primary

**Danger Button**
- Background: `--color-danger`
- Text: `--color-on-strong`
- Used for destructive actions

## Input Fields

**Text Input**
- Height: 40px
- Padding: `--space-3` `--space-4`
- Border: 1px solid `--color-border`
- Border radius: `--radius-sm`
- Focus: 2px outline `--color-primary`
- Font size: `--text-base`

**Search Input**
- Includes left-aligned search icon
- Clear button appears when text entered
- Placeholder in `--color-text-subtle`

## Cards

**Standard Card**
- Background: `--color-surface`
- Border: 1px solid `--color-border`
- Border radius: `--radius-lg`
- Padding: `--space-6`
- Shadow: subtle elevation on hover

**Product Card**
- Includes image area (16:9 ratio)
- Title: `--text-lg` `--weight-semibold`
- Price: `--text-xl` `--weight-bold` `--color-primary`
- Quick action buttons on hover

## Status Badges

**Structure**
- Padding: `--space-1` `--space-3`
- Border radius: `--radius-pill`
- Font size: `--text-sm`
- Font weight: `--weight-medium`

**Variants**
- Success: `--color-success-soft` background, `--color-success` text
- Warning: `--color-warning-soft` background, `--color-warning` text
- Danger: `--color-danger-soft` background, `--color-danger` text
- Info: `--color-info-soft` background, `--color-accent` text
- Offline: `--color-warning-soft` background, `--color-offline` text

## Data Table

**Header**
- Background: `--color-surface-sunken`
- Text: `--text-sm` `--weight-semibold` `--color-text-muted`
- Padding: `--space-3` `--space-4`

**Rows**
- Height: 52px minimum
- Border bottom: 1px solid `--color-border`
- Hover: `--color-surface-sunken`
- Selected: `--color-primary-soft`

**Cells**
- Padding: `--space-3` `--space-4`
- Vertical alignment: middle
- Text: `--text-base`
