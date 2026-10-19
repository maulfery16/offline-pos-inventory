'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  getPrinterState,
  requestPrinterDevice,
  connectPrinter,
  sendBuffer,
  type PrinterState,
} from '@/features/pos/hardware/webusb'
import { buildReceipt, formatRupiah, type ReceiptData } from '@/features/pos/hardware/receipt'

export interface UsePrinterReturn {
  isConnected: boolean
  isSupported: boolean
  connect: () => Promise<void>
  print: (data: ReceiptData) => Promise<void>
}

/**
 * Generates a minimal HTML receipt for the iframe fallback path.
 */
function buildReceiptHtml(data: ReceiptData): string {
  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td>${item.name}</td>
          <td style="text-align:right">${item.quantity}x</td>
          <td style="text-align:right">${formatRupiah(item.sellingPrice)}</td>
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Struk</title>
  <style>
    body { font-family: monospace; font-size: 12px; margin: 0; padding: 8px; width: 280px; }
    h2, h3 { margin: 4px 0; text-align: center; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 2px 0; }
    hr { border: none; border-top: 1px dashed #000; }
    .right { text-align: right; }
  </style>
</head>
<body>
  <h2>${data.storeName}</h2>
  <h3>${data.branchName}</h3>
  <p style="text-align:center;margin:2px 0">${data.transactionDate.toLocaleString('id-ID')}</p>
  <p style="text-align:center;margin:2px 0">${data.receiptRef}</p>
  <hr />
  <table>
    ${itemRows}
  </table>
  <hr />
  <table>
    <tr><td>Subtotal</td><td class="right">${formatRupiah(data.subtotal)}</td></tr>
    <tr><td>Pembayaran</td><td class="right">${data.paymentMethod}</td></tr>
    <tr><td>Kembalian</td><td class="right">${formatRupiah(data.change)}</td></tr>
  </table>
</body>
</html>`
}

/**
 * Prints via a hidden iframe — used when WebUSB is unavailable or printer disconnected.
 */
function iframePrint(data: ReceiptData): void {
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.srcdoc = buildReceiptHtml(data)

  iframe.onload = () => {
    iframe.contentWindow?.print()
    // Remove after print dialog is dismissed
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }

  document.body.appendChild(iframe)
}

export function usePrinter(): UsePrinterReturn {
  const [printerState, setPrinterState] = useState<PrinterState>(getPrinterState)

  const connect = async (): Promise<void> => {
    try {
      const device = await requestPrinterDevice()
      await connectPrinter(device)
      setPrinterState(getPrinterState())
    } catch (err) {
      // User cancelled the device picker — DOMException with name 'NotFoundError'
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        return // Silent: user dismissed picker
      }
      toast.error('Gagal menghubungkan printer')
    }
  }

  const print = async (data: ReceiptData): Promise<void> => {
    const { isConnected, isSupported } = getPrinterState()

    if (!isConnected || !isSupported) {
      // Fallback to iframe print
      iframePrint(data)
      return
    }

    try {
      const buffer = buildReceipt(data)
      await sendBuffer(buffer)
      setPrinterState(getPrinterState())
    } catch (err) {
      // transferOut failure or disconnect mid-print
      toast.error('Gagal mencetak — coba lagi')

      // Refresh state so UI reflects disconnected printer if applicable
      setPrinterState(getPrinterState())

      // Attempt iframe fallback so the receipt is not lost
      iframePrint(data)
    }
  }

  return {
    isConnected: printerState.isConnected,
    isSupported: printerState.isSupported,
    connect,
    print,
  }
}
