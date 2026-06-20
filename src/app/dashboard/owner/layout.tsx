"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  FileText,
  Users,
  Store,
  ShieldCheck,
  LogOut,
  User,
  Settings,
  Menu, // Tambahan Icon Hamburger
  X, // Tambahan Icon Close
} from "lucide-react";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [ownerName, setOwnerName] = useState("Owner");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [timeString, setTimeString] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk Sidebar HP

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOwnerProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "owner") {
          alert("Akses Ditolak: Halaman ini khusus Owner.");
          router.push("/dashboard/kasir");
          return;
        }
        setOwnerEmail(user.email || "");
        setOwnerName(profile.name);
      } else {
        router.push("/login");
      }
    };
    fetchOwnerProfile();
  }, [router, supabase]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      setTimeString(
        `${now.toLocaleDateString("id-ID", options)} • ${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mainNavItems = [
    {
      name: "Dashboard Utama",
      href: "/dashboard/owner",
      icon: LayoutDashboard,
    },
    {
      name: "Manajemen Kategori",
      href: "/dashboard/owner/kategori",
      icon: FolderOpen,
    },
    {
      name: "Manajemen Produk",
      href: "/dashboard/owner/produk",
      icon: Package,
    },
    {
      name: "Riwayat & Laporan",
      href: "/dashboard/owner/riwayat",
      icon: FileText,
    },
    { name: "Akun Kasir", href: "/dashboard/owner/kasir", icon: Users },
  ];

  const settingItems = [
    { name: "Profil Toko", href: "#", icon: Store },
    { name: "Keamanan Akun", href: "#", icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const renderMenu = (items: typeof mainNavItems) => (
    <nav className="space-y-1.5">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard/owner"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setIsSidebarOpen(false)} // Otomatis tutup sidebar di HP saat menu ditekan
            className={`flex items-center gap-3 px-4 py-3 rounded-r-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-[#FF5B37]/10 text-[#FF5B37] border-l-4 border-[#FF5B37] font-bold"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border-l-4 border-transparent"
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#f4f7f6] font-jakarta">
      {/* Backdrop Hitam Transparan untuk Layar HP */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Responsive Slider) */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white border-r border-zinc-200 flex flex-col justify-between shadow-xl lg:shadow-sm z-40`}
      >
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-100">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-[#FF5B37] flex items-center justify-center mr-3 shadow-md">
                <span className="text-white font-bold text-sm font-inter">
                  R2
                </span>
              </div>
              <span className="text-xl font-bold font-inter text-zinc-900 tracking-tight">
                Dapoer R2
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-zinc-400 hover:text-zinc-900"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 block px-4 font-inter">
              Operasional
            </span>
            {renderMenu(mainNavItems)}
          </div>
        </div>

        <div>
          <div className="p-4 border-t border-zinc-100">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 block px-4 font-inter">
              Pengaturan
            </span>
            {renderMenu(settingItems)}
            <button
              onClick={handleLogout}
              className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
            >
              <LogOut size={20} strokeWidth={2} /> Keluar Akun
            </button>
          </div>
        </div>
      </aside>

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        <header className="h-auto min-h-[5rem] py-3 lg:py-0 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex flex-wrap lg:flex-nowrap items-center justify-between px-4 lg:px-8 z-10 shadow-sm gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-600 hover:bg-zinc-100"
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <span className="text-xs lg:text-sm text-zinc-400 font-medium font-jakarta">
                Selamat datang kembali,
              </span>
              <span className="text-sm lg:text-lg font-bold text-zinc-800 font-inter leading-tight">
                Halo, {ownerName.split(" ")[0]} 👋
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6 ml-auto">
            <div className="hidden lg:block text-right border-r border-zinc-200 pr-6">
              <p className="text-xs font-bold text-zinc-700 font-inter bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">
                🕒 {timeString || "Memuat..."}
              </p>
            </div>
            <NotificationBell />
            <span className="text-zinc-200 hidden lg:inline">|</span>
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="h-10 w-10 rounded-xl bg-[#FF5B37]/10 border border-[#FF5B37]/30 flex items-center justify-center text-[#FF5B37] hover:bg-[#FF5B37]/20 transition-all"
              >
                <User size={20} strokeWidth={2.5} />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl border border-zinc-200 shadow-xl z-50">
                  <div className="p-4 bg-zinc-50 border-b border-zinc-100">
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {ownerName}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {ownerEmail}
                    </p>
                    <span className="inline-block text-[10px] bg-[#FF5B37]/10 text-[#FF5B37] px-2 py-0.5 rounded-full font-bold mt-2">
                      Owner Toko
                    </span>
                  </div>
                  <div className="p-1.5 border-t border-zinc-100 bg-zinc-50/50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut size={16} /> Keluar Aplikasi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Overflow pada main agar grafik bisa discroll ke bawah di HP */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
