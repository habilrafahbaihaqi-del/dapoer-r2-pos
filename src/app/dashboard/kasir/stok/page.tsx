"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Save,
  Loader2,
} from "lucide-react";

// --- INTERFACES ---
interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  categories: { name: string };
  product_variants: Variant[];
}

export default function KasirManajemenStokPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );

  // State Filter & Pencarian
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  // State untuk menampung perubahan stok sementara sebelum disimpan
  const [stockChanges, setStockChanges] = useState<{
    [variantId: string]: number;
  }>({});
  const [isSaving, setIsSaving] = useState<string | null>(null); // Menyimpan ID variant yang sedang di-save

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from("products")
          .select(
            `
          id, 
          name, 
          image_url, 
          category_id, 
          categories(name), 
          product_variants(id, name, price, stock)
        `,
          )
          .order("name"),
        supabase.from("categories").select("id, name").order("name"),
      ]);

      if (prodRes.data) setProducts(prodRes.data as any as Product[]);
      if (catRes.data) setCategories(catRes.data as any);
    } catch (error) {
      console.error("Gagal memuat inventaris:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA FILTERING ---
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        activeCategory === "Semua" || p.categories?.name === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, activeCategory]);

  // --- LOGIKA PERUBAHAN STOK INTERAKTIF ---
  const handleStockAdjust = (
    variantId: string,
    currentStock: number,
    delta: number,
  ) => {
    setStockChanges((prev) => {
      // Ambil nilai perubahan yang sudah ada, atau mulai dari 0
      const prevChange = prev[variantId] !== undefined ? prev[variantId] : 0;
      const newChange = prevChange + delta;

      // Cegah stok akhir bernilai negatif
      if (currentStock + newChange < 0) return prev;

      return { ...prev, [variantId]: newChange };
    });
  };

  // --- LOGIKA SIMPAN PERUBAHAN KE DATABASE & AUDIT LOG ---
  const handleSaveStock = async (variant: Variant, productName: string) => {
    const change = stockChanges[variant.id];
    if (change === undefined || change === 0) return;

    const newStockAmount = variant.stock + change;
    setIsSaving(variant.id);

    try {
      // 1. Ambil data Kasir yang sedang bertugas
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let cashierName = "Kasir Dapoer R2";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        if (profile) cashierName = profile.name;
      }

      // 2. Update stok varian di database
      const { error: updateError } = await supabase
        .from("product_variants")
        .update({ stock: newStockAmount })
        .eq("id", variant.id);

      if (updateError) throw updateError;

      // 3. SUNTIKKAN AUDIT LOG NYATA (Sesuai Blueprint!)
      await supabase.from("audit_logs").insert([
        {
          user_name: cashierName,
          role: "kasir",
          action: "UPDATE_STOK",
          description: `Memperbarui stok ${productName} (${variant.name}) dari ${variant.stock} menjadi ${newStockAmount} pcs`,
        },
      ]);

      // 4. Reset state lokal & muat ulang data dari database
      setStockChanges((prev) => {
        const updated = { ...prev };
        delete updated[variant.id];
        return updated;
      });

      await fetchInventoryData();
      alert(`Stok ${productName} (${variant.name}) berhasil diperbarui!`);
    } catch (error: any) {
      alert(`Gagal memperbarui stok: ${error.message}`);
    } finally {
      setIsSaving(null);
    }
  };

  // --- LOGIKA INSTAN TOGGLE PRODUK HABIS (STOK SET KE 0) ---
  const handleSetOutOfStock = async (variant: Variant, productName: string) => {
    if (variant.stock === 0) return;
    const confirmOut = window.confirm(
      `Tandai ${productName} (${variant.name}) sebagai "Habis" sekarang?`,
    );
    if (!confirmOut) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let cashierName = "Kasir Dapoer R2";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        if (profile) cashierName = profile.name;
      }

      await supabase
        .from("product_variants")
        .update({ stock: 0 })
        .eq("id", variant.id);

      await supabase.from("audit_logs").insert([
        {
          user_name: cashierName,
          role: "kasir",
          action: "UPDATE_STOK",
          description: `Menandai menu ${productName} (${variant.name}) sebagai "HABIS / KOSONG"`,
        },
      ]);

      fetchInventoryData();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header Halaman */}
      <div className="space-y-1.5 px-1">
        <h1 className="text-2xl font-black font-inter text-zinc-900 tracking-tight">
          Cek & Atur Stok Menu
        </h1>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Operasional Real-Time Kasir
        </p>
      </div>

      {/* Kontrol Konten: Pencarian & Kategori Swiper */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm space-y-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Cari nama menu produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-[#FF5B37]/30 pl-11 pr-4 py-3 rounded-xl font-jakarta text-sm transition-all outline-none text-zinc-800 font-medium"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("Semua")}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              activeCategory === "Semua"
                ? "bg-[#FF5B37] text-white border-[#FF5B37] shadow-sm"
                : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat.name
                  ? "bg-[#FF5B37] text-white border-[#FF5B37] shadow-sm"
                  : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ARTIFAK UTAMA: STRUKTUR LIST CARD RESPONSif */}
      {loading ? (
        <div className="text-center py-12 text-sm text-zinc-400 font-jakarta animate-pulse">
          Menghubungkan ke gudang penyimpanan...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-sm text-zinc-400 font-jakarta italic">
          Menu tidak ditemukan.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Bagian Kiri Card: Informasi Produk */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-50 border border-zinc-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-zinc-300">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package size={24} />
                  )}
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 bg-zinc-100 text-zinc-500 text-[10px] font-bold rounded-md mb-1 uppercase tracking-wider border border-zinc-100">
                    {product.categories?.name}
                  </span>
                  <h3 className="font-bold text-zinc-800 font-inter text-base leading-tight">
                    {product.name}
                  </h3>
                </div>
              </div>

              {/* Bagian Kanan Card: Struktur Baris Varian */}
              <div className="flex-1 max-w-xl w-full space-y-2 md:border-l md:border-zinc-100 md:pl-4">
                {product.product_variants?.map((variant) => {
                  const currentChange = stockChanges[variant.id] || 0;
                  const targetStock = variant.stock + currentChange;
                  const hasChange = currentChange !== 0;

                  return (
                    <div
                      key={variant.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 transition-colors"
                    >
                      {/* Varian Info & Status Ketersediaan */}
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <div>
                          <p className="font-bold text-zinc-700 text-xs font-inter">
                            {variant.name}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Stok Saat Ini:{" "}
                            <span className="font-bold text-zinc-600">
                              {variant.stock} pcs
                            </span>
                          </p>
                        </div>

                        {/* Lencana Status */}
                        {variant.stock > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md font-bold font-jakarta">
                            <CheckCircle2 size={10} /> Tersedia
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-bold font-jakarta">
                            <XCircle size={10} /> Habis
                          </span>
                        )}
                      </div>

                      {/* Kontrol Pengubah Stok Jari Kasir */}
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
                          <button
                            onClick={() =>
                              handleStockAdjust(variant.id, variant.stock, -1)
                            }
                            className="w-8 h-8 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-lg active:scale-95 transition-all"
                            title="Kurangi 1"
                          >
                            <Minus size={14} />
                          </button>

                          {/* Indikator Angka Fleksibel */}
                          <div className="w-14 text-center font-inter font-black text-sm text-zinc-800">
                            {hasChange ? (
                              <span className="text-[#FF5B37] animate-pulse">
                                {targetStock}
                              </span>
                            ) : (
                              variant.stock
                            )}
                          </div>

                          <button
                            onClick={() =>
                              handleStockAdjust(variant.id, variant.stock, 1)
                            }
                            className="w-8 h-8 flex items-center justify-center bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-lg active:scale-95 transition-all"
                            title="Tambah 1"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Tombol Aksi Simpan per Varian */}
                        {hasChange ? (
                          <button
                            onClick={() =>
                              handleSaveStock(variant, product.name)
                            }
                            disabled={isSaving === variant.id}
                            className="px-3 h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-inter shadow-md shadow-emerald-600/10 flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            {isSaving === variant.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Save size={14} />
                            )}
                            Simpan
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleSetOutOfStock(variant, product.name)
                            }
                            disabled={variant.stock === 0}
                            className="px-3 h-10 bg-white hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-xl text-xs font-bold font-inter border border-zinc-200 transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-zinc-400"
                          >
                            Set Habis
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
