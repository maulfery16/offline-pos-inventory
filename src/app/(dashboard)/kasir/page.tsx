'use client';

import { useState, useCallback, useRef } from 'react';
import { ScanBarcode, Sparkles, Wifi, WifiOff, Pause, Trash2, Check, Banknote, QrCode, CreditCard, Printer } from 'lucide-react';
import { cn } from '@/shared/utils';

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

interface CartItem extends Product {
  qty: number;
}

const products: Product[] = [
  { sku: '8991002101147', name: 'Indomie Goreng 85g', price: 3500, batch: 'A2311', days: 62, stock: 48 },
  { sku: '8992761123456', name: 'Aqua 600ml', price: 4000, batch: 'A2298', days: 118, stock: 9 },
  { sku: '8991234567890', name: 'Susu Ultra 250ml', price: 7500, batch: 'B1174', days: 5, stock: 12 },
  { sku: '8998765432109', name: 'Roti Tawar Sari Roti', price: 18000, batch: 'B1180', days: 3, stock: 6 },
  { sku: '8991112223334', name: 'Teh Pucuk 350ml', price: 4500, batch: 'A2305', days: 96, stock: 36 },
  { sku: '8995000112233', name: 'Kopi Kapal Api 165g', price: 12500, batch: 'A2280', days: 210, stock: 21 },
  { sku: '8996000223344', name: 'Yogurt Cimory 200ml', price: 9500, batch: 'B1160', days: -2, stock: 4, blocked: true },
];

interface HeldTransaction {
  id: string;
  items: CartItem[];
  total: number;
  time: string;
}

const rupiah = (value: number) => 'Rp' + Math.round(value).toLocaleString('id-ID');

export default function KasirPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [cashReceived, setCashReceived] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [heldTransactions, setHeldTransactions] = useState<HeldTransaction[]>([]);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidTargetSku, setVoidTargetSku] = useState<string | null>(null);
  const [voidPin, setVoidPin] = useState('');
  const [voidError, setVoidError] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{ total: number; method: PaymentMethod; cash: number; change: number } | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const change = Math.max(0, cashReceived - total);

  const addToCart = useCallback((product: Product) => {
    if (product.blocked) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.sku === product.sku);
      if (existing) {
        return prev.map((item) =>
          item.sku === product.sku ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((sku: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.sku === sku ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0)
    );
  }, []);

  const removeFromCart = useCallback((sku: string) => {
    setCart((prev) => prev.filter((item) => item.sku !== sku));
    setShowVoidDialog(false);
    setVoidTargetSku(null);
    setVoidPin('');
    setVoidError(false);
  }, []);

  const handleVoidRequest = (sku: string) => {
    setVoidTargetSku(sku);
    setShowVoidDialog(true);
  };

  const confirmVoid = () => {
    if (voidPin.length >= 4) {
      removeFromCart(voidTargetSku!);
    } else {
      setVoidError(true);
    }
  };

  const holdTransaction = () => {
    if (cart.length === 0) return;
    setHeldTransactions((prev) => [
      ...prev,
      {
        id: `held-${Date.now()}`,
        items: [...cart],
        total,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setCart([]);
  };

  const restoreHeld = (held: HeldTransaction) => {
    setCart(held.items);
    setHeldTransactions((prev) => prev.filter((h) => h.id !== held.id));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived(0);
  };

  const processPayment = () => {
    if (cart.length === 0) return;
    const actualCash = paymentMethod === 'Tunai' ? cashReceived : total;
    setLastTransaction({ total, method: paymentMethod, cash: actualCash, change: paymentMethod === 'Tunai' ? change : 0 });
    setShowReceiptDialog(true);
    setCart([]);
    setCashReceived(0);
  };

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
      <header className="col-span-full bg-white border border-[#e2e6ec] rounded-[14px] p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="m-0 text-[15px] font-semibold">Shift kasir · Sari Wulandari</h2>
            <p className="m-0 mt-1 text-xs text-[#5a6675]">Kasir 01 · Cabang Kebayoran · Buka 08:12 · 62 transaksi</p>
          </div>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">Antrean normal · 3 pelanggan</span>
        </div>
        <div className={cn(
          'flex items-center gap-2 p-3 rounded-[10px] border text-sm',
          isOnline
            ? 'bg-[#f7f8fa] border-[#e2e6ec] text-[#5a6675]'
            : 'bg-[#fdf0da] border-[#eccf9c] text-[#8a5300]'
        )}>
          {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span>{isOnline ? 'Online — stok tersinkron ke cloud.' : 'Offline — transaksi disimpan lokal.'}</span>
          <button
            type="button"
            onClick={() => setIsOnline((prev) => !prev)}
            className="ml-auto px-2 py-1 text-xs font-medium text-[#5a6675] hover:text-[#0f6d5f] cursor-pointer"
          >
            Simulasikan offline
          </button>
        </div>
      </header>

      {/* Catalog Panel */}
      <section className="bg-white border border-[#e2e6ec] rounded-[14px]">
        <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
          <h2 className="m-0 text-[15px] font-semibold">Pindai & pilih barang</h2>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e3f4e9] text-[#136b3f]">Scanner siap</span>
        </div>
        <div className="p-4 lg:p-5 space-y-4">
          {/* Scan Input */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8a94a3]" />
              <input
                ref={scanInputRef}
                type="search"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Pindai barcode atau ketik nama barang…"
                className="w-full min-h-[48px] pl-10 pr-3 text-[15px] border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
              />
            </div>
            <button
              type="button"
              className="flex items-center justify-center gap-2 min-h-[48px] px-4 text-[15px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Aktifkan kamera
            </button>
          </div>
          <p className="text-xs text-[#5a6675]">Scanner fisik otomatis mengisi kolom ini. Tekan Enter untuk menambah barang.</p>

          {/* Product Grid */}
          <div>
            <h3 className="m-0 mb-3 text-xs uppercase tracking-wider text-[#5a6675]">Produk cepat</h3>
            <ul className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 list-none m-0 p-0">
              {products.map((product) => (
                <li key={product.sku}>
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    disabled={product.blocked}
                    className={cn(
                      'w-full h-full grid gap-2 content-start p-3 text-left border rounded-[10px] transition-all cursor-pointer',
                      product.blocked
                        ? 'bg-[#fbe8e5] border-[#e7b7b1] cursor-not-allowed'
                        : 'bg-white border-[#e2e6ec] hover:border-[#0f6d5f] hover:-translate-y-0.5'
                    )}
                  >
                    <span className="text-[13px] font-semibold leading-snug">{product.name}</span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-[#5a6675]">
                      {getStockChip(product)}
                      {!product.blocked && <span>Batch {product.batch} · {product.days} hari</span>}
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
      <aside className="sticky top-[96px] grid gap-3">
        {/* Cart Items */}
        <div className="bg-white border border-[#e2e6ec] rounded-[14px] overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">
              Keranjang · <span>{cart.reduce((sum, item) => sum + item.qty, 0)} item</span>
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
                      <p className="m-0 text-[13px] font-semibold">{item.name}</p>
                      <p className="m-0 mt-0.5 text-xs text-[#5a6675]">Batch {item.batch} · FEFO</p>
                    </div>
                    <p className="m-0 text-[13px] tabular-nums whitespace-nowrap">{rupiah(item.price * item.qty)}</p>
                    <div className="col-span-2 flex items-center flex-wrap gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQty(item.sku, -1)}
                          className="w-8 h-8 grid place-items-center border border-[#cbd2dc] rounded-[6px] bg-white cursor-pointer"
                        >
                          −
                        </button>
                        <output className="min-w-[32px] text-center text-[13px] tabular-nums">{item.qty}</output>
                        <button
                          type="button"
                          onClick={() => updateQty(item.sku, 1)}
                          className="w-8 h-8 grid place-items-center border border-[#cbd2dc] rounded-[6px] bg-white cursor-pointer"
                        >
                          +
                        </button>
                      </div>
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
            <div className="flex items-baseline justify-between text-sm text-[#5a6675]">
              <dt>Diskon member</dt>
              <dd className="tabular-nums">−Rp0</dd>
            </div>
            <div className="flex items-baseline justify-between text-[22px] font-bold text-[#182230]">
              <dt>Total</dt>
              <dd className="tabular-nums">{rupiah(total)}</dd>
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
                  <input
                    id="cash"
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value) || 0)}
                    className="min-h-[44px] px-3 text-[15px] tabular-nums border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f]"
                  />
                </div>
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
                  <strong className="tabular-nums text-[#182230] font-semibold">{rupiah(change)}</strong>
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
              <button
                type="button"
                onClick={clearCart}
                className="flex items-center justify-center gap-2 min-h-[48px] px-4 text-[15px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Kosongkan
              </button>
            </div>
            <button
              type="button"
              onClick={processPayment}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-2 min-h-[48px] w-full px-4 text-[15px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Bayar & cetak struk
            </button>
          </div>
        </div>

        {/* Held Transactions */}
        <div className="bg-white border border-[#e2e6ec] rounded-[14px]">
          <div className="flex items-center justify-between gap-3 p-4 lg:p-5 border-b border-[#e2e6ec]">
            <h2 className="m-0 text-[15px] font-semibold">Transaksi ditahan</h2>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e8eef7] text-[#12507f]">{heldTransactions.length}</span>
          </div>
          <div className="p-4 lg:p-5">
            {heldTransactions.length === 0 ? (
              <p className="py-2 text-sm text-[#5a6675]">Belum ada transaksi ditahan.</p>
            ) : (
              <ul className="grid gap-2 list-none m-0 p-0">
                {heldTransactions.map((held) => (
                  <li key={held.id} className="flex items-center justify-between gap-3 p-3 border border-[#e2e6ec] rounded-[10px] text-sm">
                    <div>
                      <strong className="text-[13px]">{held.items.length} item</strong>
                      <span className="block text-xs text-[#5a6675]">{held.time} · {rupiah(held.total)}</span>
                    </div>
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
            )}
          </div>
        </div>
      </aside>

      {/* Void Dialog */}
      {showVoidDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          <div className="w-[min(440px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-bold">Otorisasi admin</h2>
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
                className="min-h-[42px] px-4 text-[13px] font-semibold bg-white border border-[#cbd2dc] rounded-[10px] hover:border-[#0f6d5f] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmVoid}
                className="min-h-[42px] px-4 text-[13px] font-semibold text-white bg-[#a52b22] border border-[#a52b22] rounded-[10px] hover:bg-[#8a241c] cursor-pointer"
              >
                Hapus item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Dialog */}
      {showReceiptDialog && lastTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,22,33,0.5)]">
          <div className="w-[min(440px,92vw)] bg-white border border-[#e2e6ec] rounded-[14px]">
            <div className="p-5 grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="m-0 text-lg font-bold">Transaksi selesai</h2>
                  <p className="m-0 mt-1 text-xs text-[#5a6675]">Struk #TRX-0000 · Kasir 01</p>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#e3f4e9] text-[#136b3f]">Tersinkron</span>
              </div>
              <ul className="grid gap-2 list-none m-0 p-0 text-sm">
                <li className="flex justify-between"><span>Total</span><strong className="tabular-nums">{rupiah(lastTransaction.total)}</strong></li>
                <li className="flex justify-between"><span>{lastTransaction.method}</span><span className="tabular-nums">{rupiah(lastTransaction.cash)}</span></li>
                {lastTransaction.method === 'Tunai' && (
                  <li className="flex justify-between"><span>Kembalian</span><span className="tabular-nums">{rupiah(lastTransaction.change)}</span></li>
                )}
              </ul>
              <div className="flex gap-2 p-3 rounded-[10px] bg-[#e8eef7] text-[#12507f] text-xs">
                <Printer className="w-4 h-4 flex-none" />
                <span>Struk tercetak di printer kasir 01. Antrean berikutnya siap dilayani.</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 lg:p-5 border-t border-[#e2e6ec] bg-[#f7f8fa]">
              <button
                type="button"
                onClick={() => { setShowReceiptDialog(false); setLastTransaction(null); }}
                className="min-h-[42px] px-4 text-[13px] font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] hover:bg-[#0b564a] cursor-pointer"
              >
                Transaksi baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
