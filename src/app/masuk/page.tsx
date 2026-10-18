'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Sparkles, Wifi, Eye, EyeOff, Check, ChevronDown, TrendingUp } from 'lucide-react';

type Role = 'kasir' | 'admin' | 'owner';

// TODO: replace with WatermelonDB query — this is prototype mock data
const kasirOptions = [
  { value: 'rina', label: 'Rina — Shift pagi (07:00–15:00)' },
  { value: 'dwi', label: 'Dwi — Shift siang (15:00–23:00)' },
  { value: 'agus', label: 'Agus — Shift malam (23:00–07:00)' },
];

// TODO: replace with WatermelonDB query — this is prototype mock data
const cabangOptions = [
  { value: 'semua', label: 'Semua cabang (konsolidasi)' },
  { value: 'pusat', label: 'Toko Pusat — Jakarta Selatan' },
  { value: 'bandung', label: 'Cabang Bandung — Dago' },
  { value: 'surabaya', label: 'Cabang Surabaya — Diponegoro' },
];

export default function MasukPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>('kasir');
  const [pin, setPin] = useState('');
  const [selectedKasir, setSelectedKasir] = useState('rina');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCabang, setSelectedCabang] = useState('semua');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState('');

  const handlePinKey = useCallback((key: string) => {
    if (key === 'clear') {
      setPin('');
    } else if (key === 'back') {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 6) {
      setPin((prev) => prev + key);
    }
  }, [pin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedRole === 'kasir') {
      if (pin.length < 4) {
        setError('PIN harus 4–6 digit angka.');
        return;
      }
      router.push('/kasir');
    } else {
      if (!email || !password) {
        setError('Isi email dan kata sandi terlebih dahulu.');
        return;
      }
      router.push(selectedRole === 'owner' ? '/laporan' : '/inventaris');
    }
  };

  const toggleOffline = () => setIsOffline((prev) => !prev);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] bg-[#f2f4f7] text-[#182230]">
      {/* Brand Panel */}
      <section className="relative overflow-hidden p-8 lg:p-10 bg-[#101828] text-white flex flex-col gap-8">
        {/* Gradient overlay */}
        <div className="absolute -right-[120px] -bottom-[160px] w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,109,95,.55),rgba(15,109,95,0)_68%)] pointer-events-none" />

        <div className="relative z-10 max-w-[34rem] flex flex-col gap-8 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
            <span className="grid place-items-center w-[38px] h-[38px] rounded-[10px] bg-[#0f6d5f]">
              <Store className="w-[22px] h-[22px]" />
            </span>
            <span>Toko Lintas Cabang</span>
          </div>

          {/* Tagline */}
          <div>
            <h1 className="m-0 text-2xl lg:text-3xl font-bold leading-tight tracking-tight text-balance">
              Kasir tetap jalan, stok tetap akurat.
            </h1>
            <p className="mt-4 text-base leading-normal text-[#cfd6df] max-w-[46ch]">
              Sistem kasir dan inventaris ritel yang menyimpan transaksi secara lokal saat internet putus, lalu menyinkronkan stok dan HPP begitu koneksi kembali.
            </p>
          </div>

          {/* Feature Points */}
          <ul className="grid gap-4 list-none m-0 p-0">
            <li className="flex gap-3 items-start">
              <span className="flex-none grid place-items-center w-[34px] h-[34px] rounded-[6px] bg-white/10 text-[#9fe0d2]">
                <Sparkles className="w-[18px] h-[18px]" />
              </span>
              <div>
                <p className="m-0 text-sm font-semibold">Kasir cepat dengan PIN</p>
                <p className="m-0 mt-0.5 text-sm text-[#aeb8c5]">Masuk 4–6 digit, siap melayani tanpa mengetik email.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-none grid place-items-center w-[34px] h-[34px] rounded-[6px] bg-white/10 text-[#9fe0d2]">
                <Check className="w-[18px] h-[18px]" />
              </span>
              <div>
                <p className="m-0 text-sm font-semibold">HPP akurat per batch</p>
                <p className="m-0 mt-0.5 text-sm text-[#aeb8c5]">Laba dihitung dari batch FEFO yang benar-benar terjual.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-none grid place-items-center w-[34px] h-[34px] rounded-[6px] bg-white/10 text-[#9fe0d2]">
                <Wifi className="w-[18px] h-[18px]" />
              </span>
              <div>
                <p className="m-0 text-sm font-semibold">Toleran saat offline</p>
                <p className="m-0 mt-0.5 text-sm text-[#aeb8c5]">Transaksi tetap tercatat lokal, sinkron otomatis setelah online.</p>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="flex-none grid place-items-center w-[34px] h-[34px] rounded-[6px] bg-white/10 text-[#9fe0d2]">
                <TrendingUp className="w-[18px] h-[18px]" />
              </span>
              <div>
                <p className="m-0 text-sm font-semibold">Laporan lintas cabang</p>
                <p className="m-0 mt-0.5 text-sm text-[#aeb8c5]">Laba kotor, margin, dan tutup kasir dalam satu tampilan.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Branch Status */}
        <div className="relative z-10 border-t border-white/15 pt-5 flex flex-wrap gap-3 gap-x-6 items-center text-sm text-[#cfd6df]">
          <span className="inline-flex items-center gap-2 font-medium">
            <span className={`w-2 h-2 rounded-full flex-none ${isOffline ? 'bg-[#f0b45e]' : 'bg-[#4ed39a]'}`} />
            {isOffline ? 'Offline — belum tersinkron' : 'Online — tersinkron 12:04'}
          </span>
          <span>Cabang aktif: Toko Pusat — Jakarta Selatan</span>
          <span>Versi 2.4.1</span>
        </div>
      </section>

      {/* Form Panel */}
      <section className="p-8 lg:p-10 flex items-center justify-center">
        <div className="w-full max-w-[30rem] bg-white border border-[#e2e6ec] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,.05),0_18px_40px_-28px_rgba(16,24,40,.35)] p-8 flex flex-col gap-6">
          {/* Heading */}
          <div className="flex flex-col gap-2">
            <p className="m-0 text-xs font-semibold uppercase tracking-wider text-[#0f6d5f]">Masuk ke sistem</p>
            <h2 className="m-0 text-xl lg:text-2xl font-bold tracking-tight leading-tight">Pilih peran kamu</h2>
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
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left cursor-pointer grid grid-cols-[40px_1fr_20px] gap-3 items-center p-3 rounded-[10px] border transition-all ${
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
          <form onSubmit={handleSubmit} className="grid gap-5">
            {/* Kasir Form */}
            {selectedRole === 'kasir' && (
              <>
                <div className="grid gap-2">
                  <label htmlFor="kasir" className="text-sm font-medium">Kasir aktif</label>
                  <div className="relative">
                    <select
                      id="kasir"
                      value={selectedKasir}
                      onChange={(e) => setSelectedKasir(e.target.value)}
                      className="w-full min-h-[46px] px-3 pr-10 text-base border border-[#cbd2dc] rounded-[10px] bg-white appearance-none cursor-pointer focus:outline-none focus:border-[#0f6d5f] focus:ring-[3px] focus:ring-[#e2f2ee]"
                    >
                      {kasirOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6675] pointer-events-none" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <span className="text-sm font-medium">PIN 4–6 digit</span>
                  <div
                    className="flex items-center justify-between gap-3 p-3 border border-[#e2e6ec] rounded-[10px] bg-[#f7f8fa]"
                    aria-live="polite"
                    aria-atomic="true"
                    aria-label={`${pin.length} dari 6 digit PIN dimasukkan`}
                  >
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <span
                          key={i}
                          className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                            i < pin.length ? 'bg-[#0f6d5f] border-[#0f6d5f]' : 'border-[#cbd2dc] bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#5a6675] tabular-nums whitespace-nowrap">{pin.length}/6 digit</span>
                  </div>
                  <p className="text-xs text-[#5a6675]">Tekan angka di keypad atau gunakan papan angka perangkat.</p>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePinKey(key)}
                      className={`min-h-[52px] grid place-items-center rounded-[10px] border text-base font-medium transition-all cursor-pointer ${
                        key === 'clear'
                          ? 'text-sm text-[#5a6675] bg-[#f7f8fa] border-[#cbd2dc]'
                          : key === 'back'
                          ? 'text-[#5a6675] bg-[#f7f8fa] border-[#cbd2dc]'
                          : 'text-[#182230] bg-white border-[#cbd2dc] hover:border-[#0f6d5f] hover:bg-[#e2f2ee]'
                      } active:scale-[0.97] focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0f6d5f] focus-visible:outline-offset-2`}
                    >
                      {key === 'clear' ? 'Hapus' : key === 'back' ? <BackspaceIcon /> : key}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Admin/Owner Form */}
            {selectedRole !== 'kasir' && (
              <>
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
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-9 px-3 text-sm font-medium text-[#0f6d5f] bg-transparent border-none rounded-[6px] cursor-pointer"
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
                      {cabangOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6675] pointer-events-none" />
                  </div>
                  <p className="text-xs text-[#5a6675]">Admin hanya melihat satu cabang; owner dapat melihat seluruh cabang sekaligus.</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[#5a6675] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="w-[18px] h-[18px] accent-[#0f6d5f]"
                    />
                    <span>Ingat perangkat ini selama 30 hari</span>
                  </label>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="flex gap-2 p-3 rounded-[6px] bg-[#fbe8e5] text-[#a52b22] text-sm">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="min-h-[48px] w-full flex items-center justify-center gap-2 px-4 text-base font-semibold text-white bg-[#0f6d5f] border border-[#0f6d5f] rounded-[10px] cursor-pointer transition-all hover:bg-[#0b564a] active:translate-y-0.5 focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0f6d5f] focus-visible:outline-offset-2"
            >
              {selectedRole === 'kasir' ? 'Masuk sebagai kasir' : 'Masuk ke dasbor'}
            </button>

            <p className="flex flex-wrap items-center justify-between gap-2 pt-5 border-t border-[#e2e6ec] text-xs text-[#5a6675]">
              <button type="button" className="text-sm font-medium text-[#0f6d5f] bg-transparent border-none cursor-pointer hover:underline">
                {selectedRole === 'kasir' ? 'Lupa PIN?' : 'Lupa kata sandi?'}
              </button>
              <span>{selectedRole === 'kasir' ? 'Hubungi admin toko untuk reset PIN.' : ''}</span>
            </p>
          </form>

          {/* Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-5 border-t border-[#e2e6ec] text-xs text-[#5a6675]">
            <span className="inline-flex items-center gap-2">
              <span>📥</span>
              <span>Halaman ini bisa dibuka walau internet putus.</span>
            </span>
            <button
              type="button"
              onClick={toggleOffline}
              className="text-sm font-medium text-[#0f6d5f] bg-transparent border-none cursor-pointer hover:underline"
            >
              {isOffline ? 'Kembali online' : 'Simulasikan offline'}
            </button>
          </div>
        </div>
      </section>
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
