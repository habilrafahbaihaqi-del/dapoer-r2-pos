"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import NotificationBell from "@/components/NotificationBell";

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems = [
    { name: "POS", href: "/dashboard/kasir", icon: "🛒" },
    { name: "Stok", href: "/dashboard/kasir/stok", icon: "📦" },
    { name: "Riwayat", href: "/dashboard/kasir/riwayat", icon: "🧾" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-jakarta pb-16 sm:pb-0">
      {/* Header Atas */}
      <header className="bg-white border-b border-zinc-200 h-14 flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
        <span className="text-lg font-bold font-inter text-zinc-900">
          Kasir R2
        </span>
        <div className="flex items-center gap-2">
          {/* Tombol notifikasi realtime */}
          <NotificationBell />
          <span className="text-zinc-200">|</span>
          <button
            onClick={handleLogout}
            className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors p-2"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>

      {/* Bottom Navigation (Khusus Tampilan HP) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 flex justify-around items-center h-16 sm:relative sm:border-none sm:justify-start sm:gap-4 sm:px-4 sm:h-auto sm:py-4 sm:bg-transparent z-10">
        {navItems.map((item) => {
          // Logika ketat agar warna menu aktif tidak menumpuk/bocor ke halaman lain
          const isActive =
            item.href === "/dashboard/kasir"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full sm:w-auto sm:flex-row sm:gap-2 sm:px-4 sm:py-2 sm:rounded-lg transition-colors ${
                isActive
                  ? "text-zinc-900 sm:bg-zinc-900 sm:text-white"
                  : "text-zinc-400 hover:text-zinc-600 sm:hover:bg-zinc-200"
              }`}
            >
              <span className="text-xl sm:text-sm">{item.icon}</span>
              <span
                className={`text-[10px] sm:text-sm font-semibold mt-1 sm:mt-0 ${isActive ? "font-bold" : ""}`}
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
