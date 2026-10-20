'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ScanBarcode, Sparkles, Wifi, WifiOff, Pause, Trash2, Check, Banknote, QrCode, CreditCard, Printer, AlertCircle, X, RefreshCw } from 'lucide-react';
import { cn } from '@/shared/utils';
import { useRequireAuth } from '@/core/auth/useRequireAuth';
import { decodeSessionToken, getSessionToken, getAuthHeaders, getTenantInfo } from '@/core/auth/client';
import { useDatabase, useProducts, useInventoryBatches } from '@/core/db/hooks';
import { useCartStore } from '@/features/pos/store';
import useSyncManager from '@/core/sync/useSyncManager';
import { v4 as uuidv4 } from 'uuid';
import { Q } from '@nozbe/watermelondb';
import { checkProductExpiry } from '@/features/inventory/expiryGuard';
import { toast } from 'sonner';
import { usePrinter } from '@/features/pos/hooks/usePrinter';

type PaymentMethod = 'Tunai' | 'QRIS' | 'Kartu';

interface Product {
  sku: string;
  name: string;
  price: number;
  batch: string;
  days: number;
  stock: number;
  blocked?: boolean;
}

// CartSnapshot is used only for the receipt dialog display
interface CartSnapshot {
  sku: string;
  name: string;
  price: number;
  batch: string;
  days: number;
  stock: number;
  qty: number;
}

const rupiah = (value: number) => 'Rp' + Math.round(value).toLocaleString('id-ID');

const discount = 0;

export default function KasirPage() {
  useRequireAuth(['kasir']);

  const sessionPayload = decodeSessionToken<{ userName?: string; userId?: string }>(getSessionToken() ?? '');
  const userName = sessionPayload?.userName ?? 'Kasir';
  const storeName = getTenantInfo()?.tenantName ?? 'Kasir POS';
  const branchName = getTenantInfo()?.branchName ?? 'Cabang';

  const [shiftStart] = useState(() => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
  const [todayTxCount, setTodayTxCount] = useState(0);

  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [cashReceived, setCashReceived] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  // heldTransactions now from Zustand store (see storeHeldTransactions above)
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidTargetSku, setVoidTargetSku] = useState<string | null>(null);
  const [voidPin, setVoidPin] = useState('');
  const [voidError, setVoidError] = useState(false);
  const [isVoidVerifying, setIsVoidVerifying] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{ total: number; method: PaymentMethod; cash: number; change: number; syncedOnline: boolean; ref: string } | null>(null);
  const [cartSnapshot, setCartSnapshot] = useState<CartSnapshot[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pendingRestoreId, setPendingRestoreId] = useState<string | null>(null);
  const [expiryBlockedMessage, setExpiryBlockedMessage] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const clearConfirmBtnRef = useRef<HTMLButtonElement>(null);
  const restoreConfirmBtnRef = useRef<HTMLButtonElement>(null);

  // WatermelonDB hooks (5.1)
  const db = useDatabase();
  const { products: rawProducts } = useProducts(scanInput.length >= 2 ? scanInput : undefined);
  const { batches: allBatches } = useInventoryBatches();
  const { isSyncing, triggerSync } = useSyncManager(db);
  const { isConnected: printerConnected, isSupported: printerSupported, connect: connectPrinter, print: printReceipt } = usePrinter();

  // Count today's transactions from WatermelonDB
  useEffect(() => {
    if (!db) return;
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    db.get('transactions').query(Q.where('created_at', Q.gte(startOfDay.getTime()))).fetchCount()
      .then(setTodayTxCount).catch(() => {});
  }, [db]);

  // Map WatermelonDB products to the Product interface used by the UI
  const now = Date.now();
  const products: Product[] = rawProducts.map(p => {
    const productBatches = allBatches.filter(b => b.productId === p.id && !b.isBlocked);
    const totalStock = productBatches.reduce((sum, b) => sum + b.currentQty, 0);
    const nearestBatch = productBatches
      .filter(b => b.expiryDate)
      .sort((a, b) => {
        const aT = a.expiryDate instanceof Date ? a.expiryDate.getTime() : Number(a.expiryDate);
        const bT = b.expiryDate instanceof Date ? b.expiryDate.getTime() : Number(b.expiryDate);
        return aT - bT;
      })[0];
    const daysToExpiry = nearestBatch
      ? Math.floor(((nearestBatch.expiryDate instanceof Date ? nearestBatch.expiryDate.getTime() : Number(nearestBatch.expiryDate)) - now) / 86400000)
      : 999;
    const allExpired = productBatches.length > 0 && productBatches.every(b => {
      const expT = b.expiryDate instanceof Date ? b.expiryDate.getTime() : Number(b.expiryDate);
      return expT < now;
    });
    return {
      sku: p.sku,
      name: p.name,
      price: p.sellingPrice,
      batch: nearestBatch?.batchNumber || '—',
      days: daysToExpiry,
      stock: Math.max(0, totalStock),
      blocked: allExpired || productBatches.every(b => b.isBlocked),
    };
  });

  // Zustand cart store (5.2)
  const cartItems = useCartStore(state => state.items);
  const storeAddItem = useCartStore(state => state.addItem);
  const storeUpdateQty = useCartStore(state => state.updateQty);
  const storeRemoveItem = useCartStore(state => state.removeItem);
  const storeHoldTransaction = useCartStore(state => state.holdTransaction);
  const storeRestoreTransaction = useCartStore(state => state.restoreTransaction);
  const storeClearCart = useCartStore(state => state.clearCart);
  const storeSubtotal = useCartStore(state => state.subtotal);
  const storeHeldTransactions = useCartStore(state => state.heldTransactions);
  const cart = cartItems; // alias for existing UI code

  // P1-A: Auto-focus on mount
  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  const total = storeSubtotal();
  const change = Math.max(0, cashReceived - total);

  const addToCart = useCallback((product: Product) => {
    if (product.blocked) return;
    setScanError('');
    storeAddItem({
      productId: product.sku,
      name: product.name,
      sku: product.sku,
      sellingPrice: product.price,
      expiryStatus: product.days <= 0 ? 'blocked' : product.days <= 7 ? 'warning' : 'ok',
    });
    setTimeout(() => scanInputRef.current?.focus(), 0);
  }, [storeAddItem]);

  const suggestions = scanInput.length >= 2
    ? products.filter((p) =>
        p.name.toLowerCase().includes(scanInput.toLowerCase()) ||
        p.sku.includes(scanInput)
      ).slice(0, 5)
    : [];

  const handleScanKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const exactMatch = products.find((p) => p.sku === scanInput.trim());
      if (exactMatch) {
        // Req 6.1–6.5: check expiry before adding to cart (WatermelonDB only, no network)
        if (db) {
          const result = await checkProductExpiry(exactMatch.sku, db);
          if (result.status === 'blocked') {
            setExpiryBlockedMessage(result.message);
            setScanInput('');
            return;
          }
          if (result.status === 'warning') {
            toast.warning(result.message);
          }
        }
        addToCart(exactMatch);
        setScanInput('');
        setScanError('');
      } else if (scanInput.trim().length > 0) {
        // P0-B: Barcode not found error
        setScanError('Barcode tidak ditemukan. Cari manual atau tambah produk baru.');
        setShaking(false); // reset first in case already shaking
        setTimeout(() => setShaking(true), 10); // force re-trigger
        setTimeout(() => setShaking(false), 500); // fallback if onAnimationEnd doesn't fire
      }
    }
  };

  const updateQty = useCallback((sku: string, delta: number) => {
    const existing = cartItems.find(i => i.sku === sku);
    if (existing) {
      const newQty = existing.quantity + delta;
      storeUpdateQty(sku, Math.max(0, newQty));
    }
  }, [cartItems, storeUpdateQty]);

  const removeFromCart = useCallback((sku: string) => {
    storeRemoveItem(sku);
    setShowVoidDialog(false);
    setVoidTargetSku(null);
    setVoidPin('');
    setVoidError(false);
  }, [storeRemoveItem]);

  const handleVoidRequest = (sku: string) => {
    setVoidTargetSku(sku);
    setShowVoidDialog(true);
  };

  const confirmVoid = async () => {
    const token = getSessionToken();
    if (!token) {
      setVoidError(true);
      return;
    }
    const session = decodeSessionToken<{ userId: string; role: string }>(token);
    if (!session?.userId) {
      setVoidError(true);
      return;
    }
    setIsVoidVerifying(true);
    try {
      const res = await fetch('/api/auth/pin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ userId: session.userId, pin: voidPin }),
      });
      if (res.ok) {
        removeFromCart(voidTargetSku!);
        setVoidPin('');
      } else {
        setVoidError(true);
      }
    } catch {
      setVoidError(true);
    } finally {
      setIsVoidVerifying(false);
    }
  };

  const holdTransaction = useCallback(() => {
    if (cartItems.length === 0) return;
    storeHoldTransaction();
    setCashReceived(0);
  }, [cartItems, storeHoldTransaction]);

  // P1-C: restoreHeld with guard
  const restoreHeld = (held: { id: string }) => {
    if (cartItems.length > 0) {
      setPendingRestoreId(held.id);
    } else {
      storeRestoreTransaction(held.id);
    }
  };

  // P1-B: clearCart called only after confirmation
  const clearCart = () => {
    storeClearCart();
    setCashReceived(0);
  };

  // processPayment — writes to WatermelonDB (5.3), never fetch/API (critical constraint)
  const processPayment = useCallback(async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === 'Tunai' && cashReceived < total) return;
    const actualCash = paymentMethod === 'Tunai' ? cashReceived : total;
    const txRef = uuidv4();

    // Write transaction to WatermelonDB — NEVER call fetch/API directly
    if (db) {
      try {
        await db.write(async () => {
          const txCollection = db.collections.get('transactions');
          await txCollection.create((tx: any) => {
            tx._raw.id = txRef;
            tx.branchId = 'local'; // will be overwritten by sync with real branchId from JWT
            tx.cashierId = sessionPayload?.userId ?? 'local';
            tx.paymentMethod = paymentMethod.toLowerCase();
            tx.totalAmount = total;
            tx.cashReceived = actualCash;
            tx.status = 'pending_sync';
            // synced_at stays null until sync engine processes it
          });
          const itemsCollection = db.collections.get('transaction_items');
          for (const item of cartItems) {
            await itemsCollection.create((ti: any) => {
              ti.transactionId = txRef;
              ti.productId = item.productId;
              ti.productName = item.name;
              ti.quantity = item.quantity;
              ti.sellingPrice = item.sellingPrice;
            });
          }
        });
        // Trigger background sync after write (5.4)
        triggerSync();
      } catch (err) {
        console.error('Failed to write transaction to WatermelonDB:', err);
      }
    }

    // Build and print receipt — fire-and-forget; never blocks the WatermelonDB write
    const receiptStoreName = storeName;
    const receiptBranchName = branchName;
    const receiptData = {
      storeName: receiptStoreName,
      branchName: receiptBranchName,
      receiptRef: txRef,
      transactionDate: new Date(),
      items: cartItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        sellingPrice: i.sellingPrice,
      })),
      subtotal: total,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === 'Tunai' ? cashReceived : total,
      change: paymentMethod === 'Tunai' ? change : 0,
    };
    printReceipt(receiptData).catch(() => {
      // Print failure must NOT roll back the WatermelonDB write (critical constraint)
    });

    // P1-D: snapshot cart before clearing
    setCartSnapshot([...cartItems.map(i => ({
      sku: i.sku, name: i.name, price: i.sellingPrice, batch: '—', days: 0, stock: 0, qty: i.quantity
    }))]);
    // P2-A: record sync state
    setLastTransaction({ total, method: paymentMethod, cash: actualCash, change: paymentMethod === 'Tunai' ? change : 0, syncedOnline: isOnline, ref: txRef });
    setShowReceiptDialog(true);
    storeClearCart();
    setCashReceived(0);
  }, [cartItems, paymentMethod, cashReceived, total, change, isOnline, db, triggerSync, storeClearCart]);

  // Keyboard shortcuts: F4 = Hold, F9 = Pay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire if focus is inside an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'F4') {
        e.preventDefault();
        holdTransaction();
      }
      if (e.key === 'F9') {
        e.preventDefault();
        processPayment();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [holdTransaction, processPayment]);

  // Focus management: clear-confirm dialog
  useEffect(() => {
    if (showClearConfirm) clearConfirmBtnRef.current?.focus();
  }, [showClearConfirm]);

  // Focus management: restore-confirm dialog
  useEffect(() => {
    if (pendingRestoreId) restoreConfirmBtnRef.current?.focus();
  }, [pendingRestoreId]);

  const setQuickCash = (amount: number | 'exact') => {
    if (amount === 'exact') {
      setCashReceived(total);
    } else {
      setCashReceived(amount);
    }
  };

  const getStockChip = (product: Product) => {
    if (product.blocked) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#fbe8e5] text-[#a52b22]">Batch kedaluwarsa</span>;
    }
    if (product.stock <= 10) {
      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#fdf0da] text-[#8a5300]">Stok {product.stock}</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#e3f4e9] text-[#136b3f]">Stok {product.stock}</span>;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(360px,420px)] gap-6 items-start">
      {/* Status Bar */}
      <div role="region" aria-label="Status shift kasir" className="col-span-full bg-white border border-[#e2e6ec] rounded-[14px] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="m-0 text-[15px] font-semibold">Shift kasir · {userName}</h2>
            <p className="m-0 mt-1 text-xs text-[#5a6675]">{userName} · {branchName} · Buka {shiftStart} · {todayTxCount} transaksi</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">Antrean normal · 3 pelanggan</span>
            {/* Printer connect button — hidden if WebUSB not supported */}
            {printerSupported ? (
              <button
                type="button"
                onClick={connectPrinter}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[8px] border transition-colors cursor-pointer',
                  printerConnected
                    ? 'bg-[#e3f4e9] border-[#7cc49b] text-[#136b3f]'
                    : 'bg-white border-[#cbd2dc] text-[#5a6675] hover:border-[#0f6d5f] hover:text-[#0f6d5f]'
                )}
                aria-label={printerConnected ? 'Printer terhubung' : 'Hubungkan printer'}
              >
                <span className={cn('w-2 h-2 rounded-full', printerConnected ? 'bg-[#136b3f]' : 'bg-[#8a94a3]')} aria-hidden="true" />
                <Printer className="w-3.5 h-3.5" />
                {printerConnected ? 'Printer terhubung' : 'Hubungkan Printer'}
              </button>
            ) : (
              /* Fallback icon when WebUSB not supported */
              <span title="Cetak via dialog browser" className="flex items-center gap-1 px-2 py-1 text-xs text-[#5a6675]">
                <Printer className="w-3.5 h-3.5" />
                Cetak browser
              </span>
            )}
          </div>
        </div>
        <div className={cn(
          'flex items-center gap-2 p-3 rounded-[10px] border text-sm',
          isOnline
            ? 'bg-[#f7f8fa] border-[#e2e6ec] text-[#5a6675]'
            : 'bg-[#fdf0da] border-[#f1c97a] text-[#8a5300]'
        )}>
          {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          {/* A11y-A: aria-live on connectivity status */}
          <span aria-live="polite" aria-atomic="true">{isOnline ? 'Online — stok tersinkron ke cloud.' : 'Offline — transaksi disimpan lokal.'}</span>
          {/* A11y-F: aria-pressed on simulate offline */}
          <button
            type="button"
            aria-pressed={!isOnline}
            onClick={() => setIsOnline((prev) => !prev)}
            className="ml-auto px-2 py-1 text-xs font-medium text-[#5a6675] hover:text-[#0f6d5f] cursor-pointer"
          >
            {isOnline ? 'Simulasikan offline' : 'Kembali online'}
          </button>
        </div>
      </div>

      {/* Catalog Panel */}
      <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
        <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
          <h2 className="m-0 text-[15px] font-semibold">Pindai & pilih barang</h2>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e3f4e9] text-[#136b3f]">Scanner siap</span>
        </div>
        <div className="p-4 lg:p-5 space-y-4">
          {/* Scan Input */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            {/* P0-B: scan-shake wrapper */}
            <div
              className={cn('relative', shaking && 'scan-shake')}
              onAnimationEnd={() => setShaking(false)}
            >
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8a94a3]" />
              <input
                ref={scanInputRef}
                type="search"
                value={scanInput}
                onChange={(e) => { setScanInput(e.target.value); setScanError(''); }}
                onKeyDown={handleScanKeyDown}
                placeholder="Pindai barcode atau ketik nama barang…"
                className="w-full min-h-[48px] pl-10 pr-3 text-[15px] border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
              />
            </div>
            <button
              type="button"
              disabled
              title="Kamera SKU — segera hadir"
              aria-describedby="camera-hint"
              className="flex items-center justify-center gap-2 min-h-[48px] px-4 text-[15px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] opacity-50 cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              Aktifkan kamera
            </button>
            <p id="camera-hint" className="sr-only">Fitur kamera SKU akan segera tersedia</p>
          </div>
          <p className="text-xs text-[#5a6675]">Scanner fisik otomatis mengisi kolom ini. Tekan Enter untuk menambah barang.</p>
          {/* P0-B: Scan error alert */}
          {scanError && (
            <div role="alert" className="flex gap-2 items-start p-3 rounded-[10px] bg-[#fbe8e5] text-[#a52b22] text-sm">
              <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
              <span className="flex-1">{scanError}</span>
              <button
                type="button"
                onClick={() => setScanError('')}
                className="flex-none text-[#a52b22] hover:opacity-70 cursor-pointer"
                aria-label="Tutup pesan error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <ul className="mt-3 grid gap-1 list-none m-0 p-0">
              {suggestions.map((item) => (
                <li key={item.sku}>
                  <button
                    type="button"
                    onClick={() => { addToCart(item); setScanInput(''); setTimeout(() => scanInputRef.current?.focus(), 0); }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 border border-transparent rounded-[10px] bg-[#f7f8fa] text-left cursor-pointer hover:border-[#0f6d5f] hover:bg-[#e2f2ee]"
                  >
                    <span>
                      {/* D-C: text-sm for name, text-xs for SKU */}
                      <span className="text-sm font-medium">{item.name}</span>
                      {' '}
                      <span className="font-mono text-xs text-[#5a6675]">{item.sku}</span>
                    </span>
                    <span className="text-sm tabular-nums">{rupiah(item.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {scanInput.length >= 2 && suggestions.length === 0 && !scanError && (
            <div className="mt-3 flex gap-2 p-3 rounded-[10px] bg-[#e8eef7] text-[#12507f] text-xs">
              <span>Barcode belum terdaftar. Tekan Enter untuk menambah barang cepat dengan harga manual.</span>
            </div>
          )}

          {/* Product Grid */}
          <div>
            <h3 className="m-0 mb-3 text-xs uppercase tracking-wider text-[#5a6675]">Produk cepat</h3>
            <ul className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 list-none m-0 p-0">
              {products.map((product) => (
                <li key={product.sku}>
                  <button
                    type="button"
                    onClick={() => { addToCart(product); setTimeout(() => scanInputRef.current?.focus(), 0); }}
                    disabled={product.blocked}
                    className={cn(
                      'w-full h-full grid gap-2 content-start p-3 text-left border rounded-[10px] transition-all cursor-pointer',
                      product.blocked
                        ? 'bg-[#fbe8e5] border-[#e8b4ae] cursor-not-allowed' /* danger-soft border */
                        : product.days <= 7
                          ? 'bg-[#fdf9ec] border-[#f3d88a] hover:border-[#8a5300] hover:-translate-y-0.5'
                          : 'bg-white border-[#e2e6ec] hover:border-[#0f6d5f] hover:-translate-y-0.5'
                    )}
                  >
                    {/* D-C: text-sm for product name */}
                    <span className="text-sm font-semibold leading-snug">{product.name}</span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-[#5a6675]">
                      {getStockChip(product)}
                      {!product.blocked && (
                        <span className={cn(
                          'text-xs',
                          product.days <= 7 ? 'text-[#8a5300] font-medium' : 'text-[#5a6675]'
                        )}>
                          {product.days <= 7 ? `⚠ Exp ${product.days} hari` : `Batch ${product.batch} · ${product.days} hari`}
                        </span>
                      )}
                    </span>
                    <span className="text-[15px] font-bold tabular-nums">{rupiah(product.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Cart Panel */}
      <aside className="sticky top-[96px] grid gap-3 max-h-[calc(100dvh-120px)] overflow-y-auto">
        {/* Cart Items */}
        <div className="bg-white border border-[#e2e6ec] rounded-[14px] overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">
              {/* D-B: tabular-nums on cart item count */}
              Keranjang · <span className="tabular-nums">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span> item
            </h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">FEFO otomatis</span>
          </div>
          <div className="p-4 lg:p-5 pb-3">
            {cart.length === 0 ? (
              <p className="p-5 text-center text-sm text-[#5a6675] border border-dashed border-[#cbd2dc] rounded-[10px]">
                Keranjang kosong. Pindai barcode atau pilih produk cepat.
              </p>
            ) : (
              <ul className="grid gap-2 list-none m-0 p-0 max-h-[300px] overflow-y-auto">
                {cart.map((item) => (
                  <li key={item.sku} className="grid grid-cols-[1fr_auto] gap-2 p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]">
                    <div>
                      {/* D-C: text-sm for cart item name */}
                      <p className="m-0 text-sm font-semibold">{item.name}</p>
                      <p className="m-0 mt-0.5 text-xs text-[#5a6675]">FEFO</p>
                    </div>
                    <p className="m-0 text-sm tabular-nums whitespace-nowrap">{rupiah(item.sellingPrice * item.quantity)}</p>
                    <div className="col-span-2 flex items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1">
                        {/* A11y-D: aria-label on qty steppers */}
                        <button
                          type="button"
                          onClick={() => updateQty(item.sku, -1)}
                          aria-label={`Kurangi jumlah ${item.name}`}
                          className="w-8 h-8 grid place-items-center border border-[#cbd2dc] rounded-[6px] bg-white cursor-pointer"
                        >
                          −
                        </button>
                        {/* D-C: text-sm for qty */}
                        <output className="min-w-[32px] text-center text-sm tabular-nums">{item.quantity}</output>
                        <button
                          type="button"
                          onClick={() => updateQty(item.sku, 1)}
                          aria-label={`Tambah jumlah ${item.name}`}
                          className="w-8 h-8 grid place-items-center border border-[#cbd2dc] rounded-[6px] bg-white cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      {/* D-C: text-xs for remove button */}
                      <button
                        type="button"
                        onClick={() => handleVoidRequest(item.sku)}
                        className="ml-auto px-2 py-1 text-xs font-medium text-[#a52b22] hover:bg-[#fbe8e5] rounded-[6px] cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Totals */}
          <dl className="grid gap-2 p-4 lg:p-5 border-t border-[#e2e6ec]">
            <div className="flex items-baseline justify-between text-sm text-[#5a6675]">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{rupiah(total)}</dd>
            </div>
            {/* P2-D: hide discount row when zero */}
            {discount > 0 && (
              <div className="flex items-baseline justify-between text-sm text-[#5a6675]">
                <dt>Diskon member</dt>
                <dd className="tabular-nums">−{rupiah(discount)}</dd>
              </div>
            )}
            {/* P3: 20px/700, A11y-B: aria-live on total */}
            <div className="flex items-baseline justify-between text-[20px] font-bold text-[#182230]">
              <dt>Total</dt>
              <dd className="tabular-nums" aria-live="polite" aria-atomic="true">{rupiah(total)}</dd>
            </div>
          </dl>
        </div>

        {/* Payment */}
        <div className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="p-4 lg:p-5 grid gap-3">
            <h2 className="m-0 text-[15px] font-semibold">Pembayaran</h2>
            {/* Payment Methods */}
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Metode pembayaran">
              {(['Tunai', 'QRIS', 'Kartu'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  aria-pressed={paymentMethod === method}
                  className={cn(
                    'grid gap-0.5 justify-items-center min-h-[60px] p-2 border rounded-[10px] text-xs cursor-pointer',
                    paymentMethod === method
                      ? 'border-[#0f6d5f] bg-[#e2f2ee] text-[#0b564a] font-semibold'
                      : 'border-[#cbd2dc] bg-white text-inherit'
                  )}
                >
                  {method === 'Tunai' && <Banknote className="w-5 h-5" />}
                  {method === 'QRIS' && <QrCode className="w-5 h-5" />}
                  {method === 'Kartu' && <CreditCard className="w-5 h-5" />}
                  {method}
                </button>
              ))}
            </div>

            {/* Cash Input */}
            {paymentMethod === 'Tunai' && (
              <>
                <div className="grid gap-1">
                  <label htmlFor="cash" className="text-xs font-medium text-[#5a6675]">Uang diterima</label>
                  {/* P2-B: min="0" */}
                  <input
                    id="cash"
                    type="number"
                    min="0"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                    className="min-h-[44px] px-3 text-[15px] tabular-nums border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                  />
                </div>
                {/* P0-A: shortfall warning */}
                {paymentMethod === 'Tunai' && cashReceived > 0 && cashReceived < total && (
                  <div className="text-sm text-[#a52b22] bg-[#fbe8e5] px-3 py-2 rounded-[10px]">
                    Uang kurang {rupiah(total - cashReceived)}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {[50000, 100000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setQuickCash(amount)}
                      className="min-h-9 px-2.5 text-xs border border-[#cbd2dc] rounded-full bg-white hover:border-[#0f6d5f] cursor-pointer"
                    >
                      {rupiah(amount)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setQuickCash('exact')}
                    className="min-h-9 px-2.5 text-xs border border-[#cbd2dc] rounded-full bg-white hover:border-[#0f6d5f] cursor-pointer"
                  >
                    Uang pas
                  </button>
                </div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-[#5a6675]">Kembalian</span>
                  {/* A11y-C: aria-live on kembalian */}
                  <strong className="tabular-nums text-[#182230] font-semibold" aria-live="polite" aria-atomic="true">{rupiah(change)}</strong>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={holdTransaction}
                className="flex items-center justify-center gap-2 min-h-[48px] px-4 text-[15px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                Tahan
              </button>
              {/* P1-B: Kosongkan triggers confirmation */}
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center justify-center gap-2 min-h-[48px] px-4 text-[15px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#a52b22] hover:text-[#a52b22] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Kosongkan
              </button>
            </div>
            {/* P1-A: Keyboard hints */}
            <div className="flex justify-between text-xs text-[#8a94a3] px-1">
              <span>F4 · Tahan</span>
              <span>F9 · Bayar</span>
            </div>
            {/* P0-A: disabled when underpayment */}
            <button
              type="button"
              onClick={processPayment}
              disabled={cart.length === 0 || (paymentMethod === 'Tunai' && cashReceived < total)}
              className="flex items-center justify-center gap-2 min-h-[48px] w-full px-4 text-[15px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Bayar & cetak struk
            </button>
          </div>
        </div>

        {/* P2-C: Held Transactions — only shown when non-empty */}
        {storeHeldTransactions.length > 0 && (
          <div className="bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
              <h2 className="m-0 text-[15px] font-semibold">Transaksi ditahan</h2>
              {/* D-B: tabular-nums on held count */}
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]"><span className="tabular-nums">{storeHeldTransactions.length}</span></span>
            </div>
            <div className="p-4 lg:p-5">
              <ul className="grid gap-2 list-none m-0 p-0">
                {storeHeldTransactions.map((held) => (
                  <li key={held.id} className="flex items-center justify-between gap-3 p-3 border border-[#e2e6ec] rounded-[10px] text-sm">
                    <div>
                      {/* D-B: tabular-nums on held total; D-C: text-sm for item count */}
                      <strong className="text-sm">{held.items.length} item</strong>
                      <span className="block text-xs text-[#5a6675]">
                        {new Date(held.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        <span className="tabular-nums">{rupiah(held.items.reduce((s, i) => s + i.quantity * i.sellingPrice, 0))}</span>
                      </span>
                    </div>
                    {/* P1-C: guard against active cart */}
                    <button
                      type="button"
                      onClick={() => restoreHeld(held)}
                      className="px-3 py-1.5 text-xs font-medium text-[#0f6d5f] border border-[#0f6d5f] rounded-[6px] hover:bg-[#e2f2ee] cursor-pointer"
                    >
                      Kembalikan
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </aside>

      {/* Void Dialog */}
      {showVoidDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          {/* A11y-E: role/aria on void dialog */}
          <div role="dialog" aria-modal="true" aria-labelledby="void-dialog-title" className="w-[min(440px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="void-dialog-title" className="m-0 text-lg font-bold">Otorisasi admin</h2>
                  <p className="m-0 mt-1 text-xs text-[#5a6675]">
                    Hapus <strong>item</strong> dari keranjang? Masukkan PIN admin 4–6 digit.
                  </p>
                </div>
              </div>
              <div className="grid gap-1">
                <label htmlFor="void-pin" className="text-xs font-medium text-[#5a6675]">PIN admin</label>
                <input
                  id="void-pin"
                  type="password"
                  value={voidPin}
                  onChange={(e) => { setVoidPin(e.target.value); setVoidError(false); }}
                  maxLength={6}
                  className="min-h-[44px] px-3 text-[22px] tabular-nums tracking-widest text-center border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                />
              </div>
              {voidError && (
                <p className="text-xs font-medium text-[#a52b22]">PIN salah. Coba lagi atau minta admin memasukkan PIN.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 lg:p-5 border-t border-[#e2e6ec] bg-[#f7f8fa]">
              <button
                type="button"
                onClick={() => { setShowVoidDialog(false); setVoidPin(''); setVoidError(false); }}
                className="min-h-[42px] px-4 text-sm font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
              >
                Batal
              </button>
              {/* D-A: hover:opacity-90 instead of hardcoded hover bg; D-C: text-sm */}
              <button
                type="button"
                onClick={confirmVoid}
                disabled={isVoidVerifying}
                className="min-h-[42px] px-4 text-sm font-semibold text-white bg-[#a52b22] border border-[#a52b22] rounded-[10px] hover:opacity-90 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {isVoidVerifying ? 'Memverifikasi…' : 'Hapus item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Dialog */}
      {showReceiptDialog && lastTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          {/* A11y-E: role/aria on receipt dialog */}
          <div role="dialog" aria-modal="true" aria-labelledby="receipt-dialog-title" className="w-[min(440px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="receipt-dialog-title" className="m-0 text-lg font-bold">Transaksi selesai</h2>
                  <p className="m-0 mt-1 text-xs text-[#5a6675]">Struk #{lastTransaction.ref} · {userName}</p>
                </div>
                {/* P2-A: conditional sync badge */}
                {lastTransaction.syncedOnline
                  ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#e3f4e9] text-[#136b3f]">Tersinkron</span>
                  : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#fdf0da] text-[#8a5300]">Tersimpan lokal · akan disinkron</span>
                }
              </div>
              <ul className="grid gap-2 list-none m-0 p-0 text-sm">
                <li className="flex justify-between"><span>Total</span><strong className="tabular-nums">{rupiah(lastTransaction.total)}</strong></li>
                <li className="flex justify-between"><span>{lastTransaction.method}</span><span className="tabular-nums">{rupiah(lastTransaction.cash)}</span></li>
                {lastTransaction.method === 'Tunai' && (
                  <li className="flex justify-between"><span>Kembalian</span><span className="tabular-nums">{rupiah(lastTransaction.change)}</span></li>
                )}
              </ul>
              {/* P1-D: itemized cart snapshot */}
              {cartSnapshot.length > 0 && (
                <ul className="max-h-[180px] overflow-y-auto border border-[#e2e6ec] rounded-[10px] divide-y divide-[#e2e6ec] list-none m-0 p-0">
                  {cartSnapshot.map(item => (
                    <li key={item.sku} className="flex justify-between gap-3 px-3 py-2 text-sm">
                      <span>{item.name} ×{item.qty}</span>
                      <span className="tabular-nums whitespace-nowrap" aria-label={`Harga: ${rupiah(item.price * item.qty)}`}>
                        {rupiah(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2 p-3 rounded-[10px] bg-[#e8eef7] text-[#12507f] text-xs">
                <Printer className="w-4 h-4 flex-none" />
                <span>Struk tercetak di printer kasir. Antrean berikutnya siap dilayani.</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 lg:p-5 border-t border-[#e2e6ec] bg-[#f7f8fa]">
              <button
                type="button"
                onClick={() => {
                  setShowReceiptDialog(false);
                  setLastTransaction(null);
                  // P1-A: refocus scan input on new transaction
                  setTimeout(() => scanInputRef.current?.focus(), 50);
                }}
                className="min-h-[42px] px-4 text-sm font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:opacity-90 cursor-pointer"
              >
                Transaksi baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* P1-B: Clear cart confirmation dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          <div role="dialog" aria-modal="true" aria-labelledby="clear-dialog-title" className="w-[min(400px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-2">
              <h2 id="clear-dialog-title" className="m-0 text-lg font-bold">Kosongkan keranjang?</h2>
              <p className="m-0 text-sm text-[#5a6675]">{cart.length} item akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[#e2e6ec] bg-[#f7f8fa]">
              <button ref={clearConfirmBtnRef} onClick={() => setShowClearConfirm(false)} className="min-h-[42px] px-4 text-sm font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer">Batal</button>
              <button onClick={() => { clearCart(); setShowClearConfirm(false); }} className="min-h-[42px] px-4 text-sm font-semibold text-white bg-[#a52b22] border border-[#a52b22] rounded-[10px] hover:opacity-90 cursor-pointer">Kosongkan</button>
            </div>
          </div>
        </div>
      )}

      {/* P1-C: Restore held transaction confirmation dialog */}
      {pendingRestoreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          <div role="dialog" aria-modal="true" aria-labelledby="restore-dialog-title" className="w-[min(400px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-2">
              <h2 id="restore-dialog-title" className="m-0 text-lg font-bold">Ganti keranjang aktif?</h2>
              <p className="m-0 text-sm text-[#5a6675]">Keranjang aktif berisi {cart.length} item. Item ini akan digantikan dengan transaksi yang ditahan.</p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[#e2e6ec] bg-[#f7f8fa]">
              <button ref={restoreConfirmBtnRef} onClick={() => setPendingRestoreId(null)} className="min-h-[42px] px-4 text-sm font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer">Batal</button>
              <button
                onClick={() => {
                  storeRestoreTransaction(pendingRestoreId!);
                  setPendingRestoreId(null);
                }}
                className="min-h-[42px] px-4 text-sm font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:opacity-90 cursor-pointer"
              >
                Ganti keranjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Req 6.3: Expiry blocked dialog — shown when all batches are expired/blocked */}
      {expiryBlockedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          <div role="alertdialog" aria-modal="true" aria-labelledby="expiry-blocked-title" className="w-[min(440px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-none text-[#a52b22] mt-0.5" />
                <div>
                  <h2 id="expiry-blocked-title" className="m-0 text-lg font-bold text-[#a52b22]">Produk tidak dapat dijual</h2>
                  <p className="m-0 mt-1 text-sm text-[#5a6675]">{expiryBlockedMessage}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-[#e2e6ec] bg-[#f7f8fa]">
              <button
                type="button"
                onClick={() => { setExpiryBlockedMessage(null); setTimeout(() => scanInputRef.current?.focus(), 50); }}
                className="min-h-[42px] px-4 text-sm font-semibold text-white bg-[#a52b22] border border-[#a52b22] rounded-[10px] hover:opacity-90 cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
