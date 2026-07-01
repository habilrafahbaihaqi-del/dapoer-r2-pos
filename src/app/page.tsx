"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  ShieldCheck,
  ArrowRight,
  Clock,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

// Komponen Logo memanggil fail gambar asli dari folder public
const DapurLogo = ({ className }: { className?: string }) => (
  <img
    src="/logo.png"
    alt="Logo Dapur R2"
    className={`object-contain ${className}`}
  />
);

export default function InternalHubLandingPage() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }) +
          " • " +
          now
            .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
            .replace(":", "."),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // Perbarui setiap menit
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FCFAF5] flex flex-col justify-between relative overflow-hidden font-jakarta select-none">
      {/* =========================================
          DEKORASI LATAR BELAKANG (BACKGROUND)
      ============================================= */}
      {/* Ornamen Lengkung Kiri Bawah (Mirip Referensi) */}
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#9B111E] rounded-full ring-[12px] ring-[#D4AF37] ring-offset-[8px] ring-offset-[#FCFAF5] opacity-90 pointer-events-none shadow-2xl" />

      {/* Watermark Logo Kanan (Transparan) */}
      <div className="absolute top-1/4 -right-48 opacity-[0.03] pointer-events-none mix-blend-multiply">
        <DapurLogo className="w-[800px] h-[800px]" />
      </div>

      {/* =========================================
          HEADER (FLOATING PILL STYLE)
      ============================================= */}
      <div className="pt-6 px-4 md:px-8 w-full max-w-7xl mx-auto relative z-20">
        <header className="w-full bg-white/80 backdrop-blur-md rounded-full border border-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-16 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-3">
            <DapurLogo className="w-8 h-8" />
            <span className="font-light font-inter text-lg text-[#9B111E] tracking-widest mt-1">
              DAPOER R2
            </span>
            <span className="hidden sm:inline-block text-[#9B111E] font-bold text-[10px] ml-2 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              POS v1.0
            </span>
          </div>

          {/* Jam Real-time Internal */}
          <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-500 bg-zinc-50/80 border border-zinc-100 px-4 py-2 rounded-full">
            <Clock size={14} className="text-zinc-400" />
            <span className="mt-0.5">{currentTime}</span>
          </div>
        </header>
      </div>

      {/* =========================================
          KONTEN UTAMA (HERO & SELECTION CARDS)
      ============================================= */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto w-full relative z-10 py-16">
        {/* Teks Sapaan Utama */}
        <div className="text-center space-y-5 mb-14">
          <div className="inline-block px-4 py-1.5 bg-[#FFF9E5] border border-[#FDECB2] text-[#B8860B] rounded-full text-xs font-bold uppercase tracking-widest">
            Selamat Datang
          </div>
          <h1 className="text-4xl md:text-[54px] font-black font-inter text-zinc-900 tracking-tight leading-tight">
            Portal <span className="text-[#A81717]">Sistem</span> Operasional
          </h1>
          <p className="text-sm md:text-base text-zinc-500 max-w-xl mx-auto leading-relaxed font-medium">
            Selamat datang di hub internal{" "}
            <span className="font-bold text-zinc-800">Dapoer R2</span>. Silakan
            pilih gerbang masuk sesuai dengan hak akses dan tugas Anda hari ini.
          </p>
        </div>

        {/* GRID PILIHAN PERAN (ROLE CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* GERBANG 1: DIVISI KASIR */}
          <Link
            href="/login" // DIARAHKAN KE LOGIN
            className="group bg-white rounded-[32px] border border-zinc-100 p-8 lg:p-10 flex flex-col justify-between hover:shadow-[0_20px_60px_-15px_rgba(155,17,30,0.1)] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-50 text-[#A81717] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                <ShoppingCart size={32} strokeWidth={2} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black font-inter text-zinc-900 tracking-tight">
                  Layar Utama Kasir
                </h2>
                <p className="text-[13px] md:text-[14px] text-zinc-500 leading-relaxed font-medium">
                  Masuk ke terminal transaksi penjualan, pengelolaan pesanan
                  pelanggan, cek ketersediaan stok produk, dan pantau ringkasan
                  performa harian outlet.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-8 border-t border-zinc-100 flex items-center justify-between font-bold text-sm text-[#A81717]">
              <span>Buka Terminal Kasir</span>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-2 duration-300"
              />
            </div>
          </Link>

          {/* GERBANG 2: DIVISI OWNER (PEMILIK BISNIS) */}
          <Link
            href="/login" // DIARAHKAN KE LOGIN
            className="group bg-white rounded-[32px] border border-zinc-100 p-8 lg:p-10 flex flex-col justify-between hover:shadow-[0_20px_60px_-15px_rgba(155,17,30,0.1)] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-50 text-[#A81717] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                <ShieldCheck size={32} strokeWidth={2} />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-black font-inter text-zinc-900 tracking-tight">
                  Konsol Owner (Manajemen)
                </h2>
                <p className="text-[13px] md:text-[14px] text-zinc-500 leading-relaxed font-medium">
                  Akses audit laporan keuangan menyeluruh, manajemen produk dan
                  varian harga, kontrol akun manajemen kasir, serta riwayat log
                  aktivitas operasional.
                </p>
              </div>
            </div>

            <div className="pt-6 mt-8 border-t border-zinc-100 flex items-center justify-between font-bold text-sm text-[#A81717]">
              <span>Masuk Konsol Pemilik</span>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-2 duration-300"
              />
            </div>
          </Link>
        </div>

        {/* BANNER INFORMASI FITUR INTEGRASI PWA */}
        <div className="w-full max-w-4xl mt-8 bg-white border border-zinc-100 rounded-[24px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F0FDF4] text-[#16A34A] rounded-2xl flex items-center justify-center shrink-0">
              <Smartphone size={24} />
            </div>
            <div className="text-center sm:text-left mt-1">
              <h4 className="text-[14px] font-black text-zinc-900 font-inter tracking-tight">
                Sistem Siap Diinstal Aplikasi (PWA Support)
              </h4>
              <p className="text-[12px] text-zinc-500 mt-0.5 font-medium">
                Untuk akses instan tanpa browser, klik opsi ikon unduh/instal di
                pojok kanan atas URL bar Anda.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F0FDF4] border border-[#DCFCE7] text-[#15803D] text-[11px] font-bold font-inter uppercase tracking-widest px-4 py-2 rounded-xl shrink-0">
            <CheckCircle2 size={14} strokeWidth={3} />
            <span className="mt-0.5">Aktif & Stabil</span>
          </div>
        </div>
      </main>

      {/* =========================================
          FOOTER BAWAH
      ============================================= */}
      <footer className="w-full pb-8 pt-4 flex flex-col items-center justify-center relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <DapurLogo className="w-5 h-5" />
          <span className="font-light font-inter text-sm text-[#9B111E] tracking-widest mt-0.5">
            DAPOER R2
          </span>
        </div>
        <p className="text-[10px] font-bold text-zinc-400 font-inter uppercase tracking-widest text-center">
          &copy; {new Date().getFullYear()} Dapoer R2. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
