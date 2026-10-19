/**
 * WebUSB thermal printer singleton service.
 * All navigator.usb calls are guarded by isSupported.
 */

export interface PrinterState {
  isConnected: boolean
  isSupported: boolean
  device: USBDevice | null
}

// Singleton state — module-level, persists across re-renders
const state: PrinterState = {
  isConnected: false,
  isSupported: typeof navigator !== 'undefined' && 'usb' in navigator,
  device: null,
}

/**
 * Prompts the browser device picker for USB class 7 (printers).
 */
export async function requestPrinterDevice(): Promise<USBDevice> {
  if (!state.isSupported) {
    throw new Error('WebUSB tidak didukung di browser ini')
  }
  const device = await navigator.usb.requestDevice({ filters: [{ classCode: 7 }] })
  return device
}

/**
 * Opens the device, selects configuration 1, claims interface 0,
 * and registers a disconnect listener.
 */
export async function connectPrinter(device: USBDevice): Promise<void> {
  if (!state.isSupported) {
    throw new Error('WebUSB tidak didukung di browser ini')
  }

  await device.open()
  await device.selectConfiguration(1)
  await device.claimInterface(0)

  state.device = device
  state.isConnected = true

  // Auto-disconnect when the physical device is unplugged
  navigator.usb.addEventListener('disconnect', (event: USBConnectionEvent) => {
    if (event.device === state.device) {
      disconnectPrinter()
    }
  })
}

/**
 * Releases interface, closes device, and resets singleton state.
 */
export function disconnectPrinter(): void {
  if (!state.device) return

  const device = state.device

  // Reset state first so any re-entrant calls see disconnected state
  state.device = null
  state.isConnected = false

  // Best-effort cleanup — ignore errors if device already gone
  device.releaseInterface(0).catch(() => {})
  device.close().catch(() => {})
}

/**
 * Sends a raw ESC/POS buffer to the printer via the bulk-out endpoint.
 */
export async function sendBuffer(buffer: Uint8Array): Promise<void> {
  if (!state.isSupported) {
    throw new Error('WebUSB tidak didukung di browser ini')
  }
  if (!state.isConnected || !state.device) {
    throw new Error('Printer tidak terhubung')
  }

  const device = state.device
  const interfaces = device.configuration?.interfaces

  if (!interfaces || interfaces.length === 0) {
    throw new Error('Tidak ada interface USB ditemukan')
  }

  const endpoints = interfaces[0].alternate.endpoints
  const bulkOut = endpoints.find(
    (ep) => ep.direction === 'out' && ep.type === 'bulk'
  )

  if (!bulkOut) {
    throw new Error('Bulk-out endpoint tidak ditemukan pada printer')
  }

  await device.transferOut(bulkOut.endpointNumber, buffer)
}

/**
 * Returns a snapshot of the current printer state.
 */
export function getPrinterState(): PrinterState {
  return { ...state }
}
