"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  ShoppingCart,
  Package,
  Receipt,
  PieChart,
  Settings,
  LogOut,
  Store,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

const navItems = [
  { name: "Kasir", href: "/dashboard/kasir", icon: ShoppingCart },
  { name: "Stok", href: "/dashboard/kasir/stok", icon: Package },
  { name: "Riwayat", href: "/dashboard/kasir/riwayat", icon: Receipt },
  { name: "Laporan", href: "/dashboard/kasir/laporan", icon: PieChart },
  { name: "Pengaturan", href: "/dashboard/kasir/pengaturan", icon: Settings },
];

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // State Data Identitas
  const [profileName, setProfileName] = useState("Kasir");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("Dapoer R2");
  const [currentTime, setCurrentTime] = useState("");

  // State Kontrol UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // PERBAIKAN: Ref untuk mengontrol dropdown secara elegan
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserData();

    // SINKRONISASI REAL-TIME DARI PENGATURAN PROFIL
    window.addEventListener("profileUpdated", fetchUserData);

    const updateTime = () => {
      const now = new Date();
      const weekday = now.toLocaleDateString("id-ID", { weekday: "long" });
      const day = now.toLocaleDateString("id-ID", { day: "numeric" });
      const month = now.toLocaleDateString("id-ID", { month: "long" });
      const year = now.toLocaleDateString("id-ID", { year: "numeric" });
      const time = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      setCurrentTime(
        `${weekday}, ${day} ${month} ${year} • ${time.replace(/\./g, ":")}`,
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // PERBAIKAN: Hook pendeteksi klik di luar dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Pembersihan event listener saat komponen dibongkar
    return () => {
      clearInterval(interval);
      window.removeEventListener("profileUpdated", fetchUserData);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setProfileName(profile.name || "Kasir");
        setAvatarUrl(profile.avatar_url || null);
      }
    }

    const { data: store } = await supabase
      .from("store_settings")
      .select("store_name")
      .limit(1)
      .single();
    if (store && store.store_name) setStoreName(store.store_name);
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm(
      "Apakah Anda yakin ingin keluar dari sistem?",
    );
    if (!confirmLogout) return;

    // Catat logout ke audit log
    await supabase.from("audit_logs").insert([
      {
        user_name: profileName,
        role: "kasir",
        action: "LOGOUT",
        description:
          "Kasir mengakhiri sesi dan keluar melalui Dropdown Layout.",
      },
    ]);

    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex font-jakarta overflow-hidden relative">
      {/* =========================================
          1. SIDEBAR NAVIGATION (KHUSUS PC/TABLET)
      ============================================= */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-zinc-200 fixed inset-y-0 z-50 transition-all duration-300 ease-in-out shadow-sm
          ${isSidebarOpen ? "w-64" : "w-20"}
        `}
      >
        {/* Tombol Toggle Sidebar */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3.5 top-24 bg-white border border-zinc-200 text-zinc-500 rounded-full p-1 shadow-sm hover:text-[#FF5B37] hover:border-[#FF5B37] transition-colors z-50"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>

        {/* Logo Toko */}
        <div className="h-20 flex items-center justify-center border-b border-zinc-100 overflow-hidden shrink-0">
          <div
            className={`flex items-center gap-2.5 px-4 w-full ${isSidebarOpen ? "" : "justify-center"}`}
          >
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-[#FF5B37] to-[#ff7e61] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#FF5B37]/30">
              <Store size={22} strokeWidth={2.5} />
            </div>
            {/* Nama toko hanya tampil saat sidebar terbuka */}
            <div
              className={`transition-opacity duration-200 whitespace-nowrap ${isSidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}
            >
              <h1 className="font-black text-xl font-inter text-zinc-900 tracking-tight leading-none">
                {storeName}
              </h1>
              <p className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase mt-0.5">
                POS System
              </p>
            </div>
          </div>
        </div>

        {/* Menu Navigasi Sidebar */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {/* Label Menu Kasir hanya saat terbuka */}
          {isSidebarOpen && (
            <p className="px-3 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 whitespace-nowrap">
              Menu Kasir
            </p>
          )}

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isSidebarOpen ? item.name : undefined}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 font-bold text-sm whitespace-nowrap overflow-hidden
                  ${
                    isActive
                      ? "bg-[#FF5B37] text-white shadow-md shadow-[#FF5B37]/20"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                  }
                  ${!isSidebarOpen && "justify-center"}
                `}
              >
                <Icon
                  size={isSidebarOpen ? 18 : 22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="shrink-0"
                />
                <span
                  className={`transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Tombol Logout Sidebar */}
        <div className="p-3 border-t border-zinc-100 shrink-0">
          <button
            onClick={handleLogout}
            title={!isSidebarOpen ? "Keluar Aplikasi" : undefined}
            className={`flex items-center gap-3 w-full px-3.5 py-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-bold text-sm overflow-hidden whitespace-nowrap
              ${!isSidebarOpen && "justify-center"}
            `}
          >
            <LogOut
              size={isSidebarOpen ? 18 : 22}
              strokeWidth={2.5}
              className="shrink-0"
            />
            <span
              className={`transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 hidden"}`}
            >
              Keluar
            </span>
          </button>
        </div>
      </aside>

      {/* =========================================
          2. AREA KONTEN UTAMA
      ============================================= */}
      <div
        className={`flex-1 flex flex-col min-h-screen pb-16 md:pb-0 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "md:ml-64" : "md:ml-20"}
        `}
      >
        {/* HEADER ATAS */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between px-4 lg:px-8 z-40 sticky top-0 shadow-sm shrink-0">
          {/* Sisi Kiri Header */}
          <div className="flex items-center gap-3">
            <div className="flex md:hidden items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-[#FF5B37] to-[#ff7e61] rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
                <Store size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-[15px] font-black text-zinc-800 font-inter tracking-tight truncate max-w-[140px]">
                {storeName}
              </h2>
            </div>

            <div className="hidden md:block">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Selamat Datang,
              </p>
              <h2 className="text-lg font-bold text-zinc-800 font-inter leading-tight truncate max-w-[200px] lg:max-w-xs">
                Kasir {profileName}
              </h2>
            </div>
          </div>

          {/* Sisi Kanan Header */}
          <div className="flex items-center gap-3 lg:gap-5">
            <div className="hidden md:block font-jakarta text-xs font-semibold text-zinc-500 tracking-wide">
              {currentTime}
            </div>

            <div className="hidden md:block h-8 w-[1px] bg-zinc-200"></div>

            <NotificationBell />

            <div className="h-8 w-[1px] bg-zinc-200 hidden md:block"></div>

            {/* PERBAIKAN: DROPDOWN PROFIL DENGAN REF */}
            <div className="relative z-[60]" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`flex items-center gap-2 md:gap-3 p-1.5 md:pr-3 rounded-full transition-all border outline-none
                  ${
                    isDropdownOpen
                      ? "bg-zinc-50 border-zinc-200 ring-2 ring-[#FF5B37]/20"
                      : "border-transparent hover:bg-zinc-50 hover:border-zinc-200"
                  }
                `}
              >
                {/* AVATAR RENDERER */}
                <div className="w-9 h-9 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 font-bold font-inter text-sm shadow-inner shrink-0 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profileName}
                      className="w-full h-full object-cover"
                    />
                  ) : profileName ? (
                    profileName.charAt(0).toUpperCase()
                  ) : (
                    "K"
                  )}
                </div>

                <div className="hidden lg:block text-left">
                  <p className="text-sm font-bold text-zinc-800 font-inter leading-none truncate max-w-[100px]">
                    {profileName}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                    Role: Kasir
                  </p>
                </div>

                <ChevronDown
                  size={14}
                  className={`hidden lg:block text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* KOTAK MENU DROPDOWN */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                      Masuk Sebagai
                    </p>
                    <p className="font-bold text-zinc-800 font-inter truncate">
                      {profileName}
                    </p>
                  </div>

                  <div className="p-2 space-y-1">
                    <Link
                      href="/dashboard/kasir/pengaturan"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 transition-colors text-sm font-bold font-inter"
                    >
                      <Settings size={16} className="text-zinc-400" />
                      Pengaturan Akun
                    </Link>
                  </div>

                  <div className="p-2 border-t border-zinc-100">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors text-sm font-bold font-inter"
                    >
                      <LogOut size={16} />
                      Keluar (Logout)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* TEMPAT HALAMAN BERGANTI */}
        <main className="flex-1 p-4 lg:p-6 relative overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* =========================================
          3. BOTTOM NAVIGATION (KHUSUS HP/MOBILE)
      ============================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-40 flex justify-around items-center h-[72px] pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.06)] px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-1.5 relative ${
                isActive
                  ? "text-[#FF5B37]"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-[#FF5B37] rounded-b-full"></div>
              )}

              <Icon
                size={isActive ? 22 : 20}
                strokeWidth={isActive ? 2.5 : 2}
                className={isActive ? "mt-1 shrink-0" : "shrink-0"}
              />
              <span
                className={`text-[10px] font-bold font-inter ${isActive ? "text-[#FF5B37]" : ""}`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
