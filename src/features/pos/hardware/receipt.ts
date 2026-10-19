/**
 * ESC/POS receipt buffer builder.
 * Produces a Uint8Array ready to send via WebUSB or fallback print.
 */

export interface ReceiptData {
  storeName: string
  branchName: string
  receiptRef: string
  transactionDate: Date
  items: Array<{
    name: string
    quantity: number
    sellingPrice: number
  }>
  subtotal: number
  paymentMethod: string
  cashReceived: number
  change: number
}

// ESC/POS command constants
const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

const CMD_INIT = [ESC, 0x40]           // ESC @ — initialize printer
const CMD_ALIGN_CENTER = [ESC, 0x61, 0x01]  // ESC a 1 — center align
const CMD_ALIGN_LEFT = [ESC, 0x61, 0x00]    // ESC a 0 — left align
const CMD_CUT = [GS, 0x56, 0x42, 0x03]     // GS V 66 3 — partial cut

/**
 * Formats an integer amount as Indonesian Rupiah with period-separated thousands.
 * e.g. 15000 → "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  const value = Math.round(amount)
  return `Rp ${value.toLocaleString('id-ID')}`
}

/**
 * Assembles a full ESC/POS command sequence for a sales receipt.
 * Returns a single concatenated Uint8Array.
 */
export function buildReceipt(data: ReceiptData): Uint8Array {
  const encoder = new TextEncoder()
  const segments: Uint8Array[] = []

  const push = (bytes: number[]) => segments.push(new Uint8Array(bytes))
  const text = (str: string) => segments.push(encoder.encode(str))
  const lf = () => push([LF])

  // 1. Initialize
  push(CMD_INIT)

  // 2. Center align
  push(CMD_ALIGN_CENTER)

  // 3. Store name
  text(data.storeName)
  lf()

  // 4. Branch name
  text(data.branchName)
  lf()

  // 5. Left align
  push(CMD_ALIGN_LEFT)

  // 6. Transaction date
  text(data.transactionDate.toLocaleString('id-ID'))
  lf()

  // 7. Receipt reference
  text(data.receiptRef)
  lf()

  // 8. Separator
  text('-'.repeat(32))
  lf()

  // 9. Line items
  for (const item of data.items) {
    text(`${item.name}\t${item.quantity}x${formatRupiah(item.sellingPrice)}`)
    lf()
  }

  // 10. Separator
  text('-'.repeat(32))
  lf()

  // 11. Subtotal
  text(`Subtotal:${formatRupiah(data.subtotal)}`)
  lf()

  // 12. Payment method
  text(`Pembayaran:${data.paymentMethod}`)
  lf()

  // 13. Change
  text(`Kembalian:${formatRupiah(data.change)}`)
  lf()

  // 14. Paper feed (3× LF)
  push([LF, LF, LF])

  // 15. Partial cut
  push(CMD_CUT)

  // Concatenate all segments into one Uint8Array
  const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const seg of segments) {
    result.set(seg, offset)
    offset += seg.length
  }

  return result
}
