"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface VariantWithProduct {
  id: string;
  name: string;
  stock: number;
  products: {
    name: string;
  };
}

export default function StokKasirPage() {
  const supabase = createClient();
  const [variants, setVariants] = useState<VariantWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk modal Edit Stok
  const [selectedVariant, setSelectedVariant] =
    useState<VariantWithProduct | null>(null);
  const [newStock, setNewStock] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    // Mengambil data varian sekaligus menarik nama produk induknya
    const { data, error } = await supabase
      .from("product_variants")
      .select(
        `
        id,
        name,
        stock,
        products ( name )
      `,
      )
      .order("created_at", { ascending: false });

    if (data) setVariants(data as unknown as VariantWithProduct[]);
    setLoading(false);
  };

  const openEditModal = (variant: VariantWithProduct) => {
    setSelectedVariant(variant);
    setNewStock(variant.stock.toString()); // Isi otomatis form dengan stok saat ini
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || newStock === "") return;

    setIsUpdating(true);
    const { error } = await supabase
      .from("product_variants")
      .update({ stock: parseInt(newStock) })
      .eq("id", selectedVariant.id);

    if (!error) {
      setSelectedVariant(null);
      fetchStockData(); // Segarkan data tabel setelah berhasil
    } else {
      alert("Gagal memperbarui stok.");
    }
    setIsUpdating(false);
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-inter text-zinc-900">
          Manajemen Stok
        </h1>
        <p className="text-sm text-zinc-500 font-jakarta mt-1">
          Perbarui jumlah stok fisik yang tersedia di toko.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <p className="text-center text-zinc-500 mt-10 font-jakarta text-sm">
            Memuat data stok...
          </p>
        ) : variants.length === 0 ? (
          <p className="text-center text-zinc-500 mt-10 font-jakarta text-sm">
            Belum ada varian produk.
          </p>
        ) : (
          <div className="space-y-3">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex justify-between items-center"
              >
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block font-jakarta mb-0.5">
                    {variant.products?.name}
                  </span>
                  <h3 className="font-bold text-zinc-900 font-inter text-sm mb-1">
                    {variant.name}
                  </h3>
                  <span
                    className={`text-xs font-semibold font-jakarta ${
                      variant.stock > 5
                        ? "text-green-600"
                        : variant.stock > 0
                          ? "text-amber-500"
                          : "text-red-500"
                    }`}
                  >
                    Sisa: {variant.stock}
                  </span>
                </div>
                <button
                  onClick={() => openEditModal(variant)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs rounded-lg transition-colors font-jakarta active:scale-[0.95]"
                >
                  Ubah Stok
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Edit Stok */}
      {selectedVariant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:w-96 rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold font-inter text-zinc-900">
                  Ubah Stok
                </h3>
                <p className="text-xs text-zinc-500 font-jakarta">
                  {selectedVariant.products?.name} - {selectedVariant.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedVariant(null)}
                className="text-zinc-400 font-bold text-xl mb-4"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 font-jakarta mb-1.5 uppercase tracking-wider">
                  Jumlah Stok Fisik (Total)
                </label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-800 font-jakarta text-lg font-bold"
                  required
                  min="0"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold active:scale-[0.98] transition-transform shadow-md disabled:opacity-70"
              >
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
