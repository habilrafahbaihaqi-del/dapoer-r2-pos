"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import NotificationBell from "@/components/NotificationBell";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems = [
    { name: "Dashboard", href: "/dashboard/owner" },
    { name: "Manajemen Kategori", href: "/dashboard/owner/kategori" },
    { name: "Manajemen Produk", href: "/dashboard/owner/produk" },
    { name: "Riwayat Transaksi", href: "/dashboard/owner/riwayat" },
    { name: "Manajemen User", href: "/dashboard/owner/kasir" },
  ];

  // Fungsi untuk memproses proses keluar (logout)
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-jakarta">
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-zinc-200">
            <span className="text-xl font-bold font-inter text-zinc-900">
              Dapoer R2
            </span>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard/owner"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white shadow-md"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tombol Logout di bagian paling bawah sidebar */}
        <div className="p-4 border-t border-zinc-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors active:scale-[0.98]"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Sisi Konten Utama dengan Header Tambahan */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <span className="text-sm font-semibold text-zinc-400 font-jakarta">
            Panel Kendali Utama
          </span>
          <NotificationBell />
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
