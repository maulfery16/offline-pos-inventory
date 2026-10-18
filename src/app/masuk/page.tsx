'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Wifi, WifiOff, Eye, EyeOff, Check, ChevronDown, AlertCircle, CloudOff } from 'lucide-react';
import { getDeviceToken, setSessionToken, getAuthHeaders } from '@/core/auth/client';

type Role = 'kasir' | 'admin' | 'owner';

// kasirOptions loaded from API in useEffect

// TODO: replace with WatermelonDB query — this is prototype mock data
const cabangOptions = [
  { value: 'semua', label: 'Semua cabang (konsolidasi)' },
  { value: 'pusat', label: 'Toko Pusat — Jakarta Selatan' },
  { value: 'bandung', label: 'Cabang Bandung — Dago' },
  { value: 'surabaya', label: 'Cabang Surabaya — Diponegoro' },
];

const pendingSyncCount = 0; // TODO: wire to useSyncManager in TASK-3.5

// Debug-only: the offline simulator toggle is only rendered in dev builds.
const isDev = process.env.NODE_ENV === 'development';

export default function MasukPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>('kasir');
  const [pin, setPin] = useState('');
  const [selectedKasir, setSelectedKasir] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCabang, setSelectedCabang] = useState('semua');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [kasirList, setKasirList] = useState<{ value: string; label: string }[]>([]);
  const [deviceToken, setDeviceTokenState] = useState<string | null>(null);

  useEffect(() => {
    const token = getDeviceToken();
    setDeviceTokenState(token);
    if (!token) return;
    // Load cashier list from API
    fetch('/api/users?role=kasir', { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.users) {
          setKasirList(data.users.map((u: { id: string; name: string; shift?: string }) => ({
            value: u.id,
            label: u.shift ? `${u.name} — ${u.shift}` : u.name,
          })));
        }
      })
      .catch(() => {
        // offline or API error — leave list empty, user can still attempt login
      });
  }, []);

  const pinInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // On-screen keypad writes to the same `pin` state that the hidden PIN input
  // is bound to, so the input stays the single source of truth for the dots.
  const handlePinKey = useCallback((key: string) => {
    if (isSubmitting) return;
    if (key === 'clear') {
      setPin('');
    } else if (key === 'back') {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 6) {
      setPin((prev) => prev + key);
    }
  }, [pin, isSubmitting]);

  // Physical keyboard / device number-pad entry. Captured on the kasir form
  // wrapper so a cashier can type the PIN without tapping the on-screen pad.
  // The hidden PIN input handles its own keys natively; native form controls
  // (the kasir <select>) keep their own keys.
  const handlePhysicalKey = (e: React.KeyboardEvent) => {
    if (isSubmitting) return;
    const target = e.target as HTMLElement;
    if (target === pinInputRef.current) return;
    const tag = target.tagName;
    if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;

    const k = e.key;
    if (k >= '0' && k <= '9') {
      e.preventDefault();
      setPin((prev) => (prev.length < 6 ? prev + k : prev));
    } else if (k === 'Backspace') {
      e.preventDefault();
      setPin((prev) => prev.slice(0, -1));
    } else if (k === 'Enter') {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (selectedRole === 'kasir') {
      if (!selectedKasir) { setError('Pilih kasir aktif terlebih dahulu.'); return; }
      if (pin.length < 4) { setError('PIN harus 4–6 digit angka.'); return; }
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/auth/pin-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ userId: selectedKasir, pin }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'PIN salah. Coba lagi.');
          return;
        }
        const data = await res.json();
        setSessionToken(data.sessionToken);
        router.push('/kasir');
      } catch {
        setError('Koneksi gagal. Periksa jaringan internet.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!email || !password) { setError('Isi email dan kata sandi terlebih dahulu.'); return; }
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Email atau kata sandi salah.');
          return;
        }
        const data = await res.json();
        setSessionToken(data.sessionToken);
        router.push(selectedRole === 'owner' ? '/laporan' : '/inventaris');
      } catch {
        setError('Koneksi gagal. Periksa jaringan internet.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const toggleOffline = () => setIsOffline((prev) => !prev);

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    // Admin hanya melihat satu cabang — jangan biarkan 'semua' tetap terpilih.
    if (role === 'admin' && selectedCabang === 'semua') {
      setSelectedCabang('pusat');
    }
  };

  // Filter cabang by role: admin never sees the konsolidasi option.
  const visibleCabangOptions =
    selectedRole === 'admin' ? cabangOptions.filter((o) => o.value !== 'semua') : cabangOptions;

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-[#f2f4f7] text-[#182230] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[30rem] bg-white border border-[#e2e6ec] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,.05),0_18px_40px_-28px_rgba(16,24,40,.35)] p-6 lg:p-8 flex flex-col gap-6">
          {/* Connectivity banner — DESIGN.md Status Bar (Connectivity Banner) */}
          <div
            role="status"
            aria-live="polite"
            className={`-mx-6 -mt-6 lg:-mx-8 lg:-mt-8 flex items-center gap-3 px-6 lg:px-8 py-3 border-b rounded-t-[14px] ${
              isOffline ? 'bg-[#fdf0da] border-[#eccf9c] text-[#8a5300]' : 'bg-[#f7f8fa] border-[#e2e6ec] text-[#5a6675]'
            }`}
          >
            <span className="flex-none">
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
            </span>
            <span className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-medium tabular-nums">
                {isOffline
                  ? `Offline — ${pendingSyncCount} transaksi menunggu sinkron`
                  : 'Online — tersinkron 12:04'}
              </span>
              {isOffline && (
                <span className="text-xs">Kamu tetap bisa masuk, transaksi akan tersinkron otomatis.</span>
              )}
            </span>
          </div>

          {/* Logo — identity preserved inside the single login card (brand panel removed). */}
          <div className="flex items-center gap-3 font-bold text-lg tracking-tight text-[#182230]">
            <span className="grid place-items-center w-[38px] h-[38px] rounded-[10px] bg-[#0f6d5f] text-white">
              <Store className="w-[22px] h-[22px]" />
            </span>
            <span>Toko Lintas Cabang</span>
          </div>

          {/* Heading — eyebrow removed per craft-floor kicker ban; heading carries its own weight. */}
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-xl font-bold tracking-tight leading-[1.3]">Pilih peran kamu</h1>
            <p className="m-0 text-sm text-[#5a6675]">Setiap peran membuka modul yang berbeda. Kamu bisa berganti peran kapan saja sebelum masuk.</p>
          </div>

          {/* Role Selection */}
          <div className="grid gap-3" role="group" aria-label="Pilih peran pengguna">
            {[
              { role: 'kasir' as Role, icon: <ShoppingBagIcon />, name: 'Kasir', desc: 'Transaksi cepat di modul kasir. Masuk dengan PIN.' },
              { role: 'admin' as Role, icon: <GraduationCapIcon />, name: 'Admin / Manajer Toko', desc: 'Barang masuk, stok opname, dan pengelolaan batch FEFO.' },
              { role: 'owner' as Role, icon: <BarChartIcon />, name: 'Owner / Pemilik Usaha', desc: 'Laporan laba, margin kotor, dan analitik semua cabang.' },
            ].map(({ role, icon, name, desc }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`w-full text-left cursor-pointer grid grid-cols-[40px_1fr_20px] gap-3 items-center p-3 rounded-[10px] border transition-all focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0f6d5f] focus-visible:outline-offset-2 ${
                  selectedRole === role
                    ? 'border-[#0f6d5f] bg-[#e2f2ee]'
                    : 'border-[#cbd2dc] bg-white hover:border-[#0f6d5f]'
                }`}
                aria-pressed={selectedRole === role}
              >
                <span className={`w-10 h-10 grid place-items-center rounded-[6px] transition-colors ${
                  selectedRole === role ? 'bg-[#0f6d5f] text-white' : 'bg-[#f7f8fa] text-[#5a6675]'
                }`}>
                  {icon}
                </span>
                <span>
                  <span className="text-base font-semibold">{name}</span>
                  <p className="m-0 mt-0.5 text-xs text-[#5a6675] leading-snug">{desc}</p>
                </span>
                <span className={`transition-opacity ${selectedRole === role ? 'opacity-100 text-[#0f6d5f]' : 'opacity-0'}`}>
                  <Check className="w-[18px] h-[18px]" />
                </span>
              </button>
            ))}
          </div>

          {/* Forms */}
          <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5">
            {/* Kasir Form */}
            {selectedRole === 'kasir' && (
              <div className="grid gap-5" onKeyDown={handlePhysicalKey}>
                <div className="grid gap-2">
                  <label htmlFor="kasir" className="text-sm font-medium">Kasir aktif</label>
                  <div className="relative">
                    <select
                      id="kasir"
                      value={selectedKasir}
                      onChange={(e) => setSelectedKasir(e.target.value)}
                      className="w-full min-h-[46px] px-3 pr-10 text-base border border-[#cbd2dc] rounded-[10px] bg-white appearance-none cursor-pointer focus:outline-none focus:border-[#0f6d5f] focus:ring-[3px] focus:ring-[#e2f2ee]"
                    >
                      <option value="" disabled>— Pilih kasir —</option>
                      {kasirList.length > 0
                        ? kasirList.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))
                        : <option value="" disabled>— Memuat daftar kasir… —</option>
                      }
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6675] pointer-events-none" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="pin" className="text-sm font-medium">PIN 4–6 digit</label>
                  <div
                    className="flex items-center justify-between gap-3 p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa] cursor-text transition-colors focus-within:border-[#0f6d5f] focus-within:ring-[3px] focus-within:ring-[#e2f2ee]"
                    onClick={() => pinInputRef.current?.focus()}
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={`${pin.length} digit PIN dimasukkan`}
                  >
                    <input
                      ref={pinInputRef}
                      id="pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="sr-only outline-none"
                      aria-label="Masukkan PIN"
                    />
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                            i < pin.length ? 'bg-[#182230] border-[#182230]' : 'border-[#cbd2dc] bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#5a6675] tabular-nums whitespace-nowrap">{pin.length} digit</span>
                  </div>
                  <p className="text-xs text-[#5a6675]">Tekan angka di keypad atau gunakan papan angka perangkat.</p>
                  <p className="text-xs text-[#5a6675]">Belum punya PIN? Admin toko dapat membuatkan.</p>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePinKey(key)}
                      aria-label={key === 'clear' ? 'Hapus semua digit' : key === 'back' ? 'Hapus satu digit' : undefined}
                      className={`min-h-[52px] grid place-items-center rounded-[10px] border text-base font-medium transition-all cursor-pointer ${
                        key === 'clear' || key === 'back'
                          ? 'text-[#5a6675] bg-[#f7f8fa] border-[#cbd2dc]'
                          : 'text-[#182230] bg-white border-[#cbd2dc] hover:border-[#0f6d5f] hover:bg-[#e2f2ee]'
                      } active:scale-[0.97] focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0f6d5f] focus-visible:outline-offset-2`}
                    >
                      {key === 'clear' ? <ClearIcon /> : key === 'back' ? <BackspaceIcon /> : key}
                    </button>
                  ))}
                </div>

                {/* Enter / OK — submit in flow without leaving the keypad */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[52px] w-full flex items-center justify-center gap-2 px-4 text-base font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] cursor-pointer transition-all hover:bg-[#0b564a] active:translate-y-0.5 focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0f6d5f] focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Memproses…' : 'Masuk'}
                </button>
              </div>
            )}

            {/* Admin/Owner Form */}
            {selectedRole !== 'kasir' && (
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">Email kerja</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@tokolintascabang.id"
                    className="w-full min-h-[46px] px-3 text-base border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f] focus:ring-[3px] focus:ring-[#e2f2ee]"
                  />
                </div>

                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-medium">Kata sandi</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full min-h-[46px] px-3 pr-24 text-base border border-[#cbd2dc] rounded-[10px] focus:outline-none focus:border-[#0f6d5f] focus:ring-[3px] focus:ring-[#e2f2ee]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[44px] px-3 text-sm font-medium text-[#5a6675] bg-transparent border-none rounded-[6px] cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0f6d5f] focus-visible:outline-offset-2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="cabang" className="text-sm font-medium">Cabang</label>
                  <div className="relative">
                    <select
                      id="cabang"
                      value={selectedCabang}
                      onChange={(e) => setSelectedCabang(e.target.value)}
                      className="w-full min-h-[46px] px-3 pr-10 text-base border border-[#cbd2dc] rounded-[10px] bg-white appearance-none cursor-pointer focus:outline-none focus:border-[#0f6d5f] focus:ring-[3px] focus:ring-[#e2f2ee]"
                    >
                      {visibleCabangOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6675] pointer-events-none" />
                  </div>
                  <p className="text-xs text-[#5a6675]">Admin hanya melihat satu cabang; owner dapat melihat seluruh cabang sekaligus.</p>
                </div>

                <div className="grid gap-1">
                  <label className="inline-flex items-center gap-2 text-sm text-[#5a6675] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="w-[18px] h-[18px] accent-[#182230]"
                    />
                    <span>Ingat perangkat ini selama 30 hari</span>
                  </label>
                  {rememberDevice && (
                    <p className="m-0 text-xs text-[#5a6675]">Perangkat terakhir dikenali: iPad Kasir — Toko Pusat (12 Jun 2025).</p>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div role="alert" className="flex gap-2 p-3 rounded-[6px] bg-[#fbe8e5] text-[#a52b22] text-sm">
                <AlertCircle className="flex-none w-4 h-4 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit — primary CTA for admin/owner. The kasir flow submits in-flow via the keypad
                "Masuk" key, so it does not render a second teal CTA here (One Teal Rule: one CTA per view). */}
            {selectedRole !== 'kasir' && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[48px] w-full flex items-center justify-center gap-2 px-4 text-base font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] cursor-pointer transition-all hover:bg-[#0b564a] active:translate-y-0.5 focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0f6d5f] focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Memproses…' : 'Masuk ke dasbor'}
              </button>
            )}

            <p className="flex flex-wrap items-center justify-between gap-2 pt-5 border-t border-[#e2e6ec] text-xs text-[#5a6675]">
              <button type="button" className="text-sm font-medium text-[#5a6675] bg-transparent border-none cursor-pointer hover:underline">
                {selectedRole === 'kasir' ? 'Lupa PIN?' : 'Lupa kata sandi?'}
              </button>
              <span>
                {selectedRole === 'kasir'
                  ? 'Hubungi admin toko untuk reset PIN.'
                  : selectedRole === 'admin'
                  ? 'Hubungi owner atau admin lain untuk reset kata sandi.'
                  : 'Hubungi dukungan teknis untuk reset kata sandi.'}
              </span>
            </p>
          </form>

          {/* Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-5 border-t border-[#e2e6ec] text-xs text-[#5a6675]">
            <span className="inline-flex items-center gap-2">
              <CloudOff className="flex-none w-4 h-4" aria-hidden="true" />
              <span>Halaman ini bisa dibuka walau internet putus.</span>
            </span>
            {isDev && (
              <button
                type="button"
                onClick={toggleOffline}
                className="text-sm font-medium text-[#5a6675] bg-transparent border-none cursor-pointer hover:underline"
              >
                {isOffline ? 'Kembali online' : 'Simulasikan offline'}
              </button>
            )}
          </div>

          {/* Branch + version — ambient info relocated from the removed brand panel. */}
          <p className="m-0 text-center text-xs text-[#5a6675]">
            Cabang aktif: Toko Pusat — Jakarta Selatan · Versi 2.4.1
          </p>
        </div>
    </div>
  );
}

// Icon components
function ShoppingBagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4h6l1.2 4H7.8L9 4Z" />
      <path d="M4.5 8h15l-1.3 10.4A2 2 0 0 1 16.2 20H7.8a2 2 0 0 1-2-1.6L4.5 8Z" />
      <path d="M9.5 12.5h5" />
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7.5V17a2 2 0 0 1-1.6 1.9l-6 1.2-6-1.2A2 2 0 0 1 4.8 17V7.5" />
      <path d="m3 8 9-4 9 4-9 3.6L3 8Z" />
      <path d="M12 11.6V20" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19h16" />
      <path d="M6.5 19V9.5" />
      <path d="M12 19V5" />
      <path d="M17.5 19v-6" />
    </svg>
  );
}

function BackspaceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6H9l-5 6 5 6h11a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1Z" />
      <path d="m15 10-3 4m0-4 3 4" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6m0-6 6 6" />
    </svg>
  );
}
