"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Transaction {
  id: string;
  invoice_number: string;
  total: number;
  payment_method: string;
  created_at: string;
}

export default function RiwayatKasirPage() {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("cashier_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  // Fungsi untuk membatalkan transaksi dan mengembalikan stok
  const handleDeleteTransaction = async (trxId: string) => {
    const confirmDelete = window.confirm(
      "Apakah Anda yakin ingin membatalkan transaksi ini?\n\nStok produk dari transaksi ini akan otomatis dikembalikan ke sistem.",
    );
    if (!confirmDelete) return;

    setIsDeleting(trxId);
    try {
      // 1. Tarik data detail item dari transaksi yang akan dihapus
      const { data: items, error: fetchError } = await supabase
        .from("transaction_items")
        .select("variant_id, quantity")
        .eq("transaction_id", trxId);

      if (fetchError) throw new Error("Gagal membaca detail transaksi.");

      // 2. Kembalikan stok untuk setiap item satu per satu
      if (items) {
        for (const item of items) {
          if (item.variant_id) {
            // Pastikan varian belum dihapus permanen oleh Owner
            // Ambil stok saat ini
            const { data: variantData } = await supabase
              .from("product_variants")
              .select("stock")
              .eq("id", item.variant_id)
              .single();

            if (variantData) {
              // Tambahkan stok saat ini dengan jumlah barang yang dibatalkan
              const newStock = variantData.stock + item.quantity;

              await supabase
                .from("product_variants")
                .update({ stock: newStock })
                .eq("id", item.variant_id);
            }
          }
        }
      }

      // 3. Hapus data transaksi utama
      // (Data di transaction_items akan otomatis terhapus karena kita menggunakan ON DELETE CASCADE di database)
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", trxId);

      if (deleteError)
        throw new Error("Gagal menghapus data transaksi dari sistem.");

      alert("Transaksi berhasil dibatalkan dan stok telah dikembalikan!");
      fetchTransactions(); // Refresh tabel riwayat
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-inter text-zinc-900">
          Riwayat Transaksi
        </h1>
        <p className="text-sm text-zinc-500 font-jakarta mt-1">
          Daftar penjualan yang telah Anda proses.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {loading ? (
          <p className="text-center text-zinc-500 mt-10 font-jakarta text-sm">
            Memuat data riwayat...
          </p>
        ) : transactions.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-zinc-200 border-dashed text-center mt-4">
            <p className="text-zinc-400 font-jakarta">
              Belum ada transaksi yang tercatat.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((trx) => (
              <div
                key={trx.id}
                className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block font-jakarta mb-0.5">
                      {formatDate(trx.created_at)}
                    </span>
                    <h3 className="font-bold text-zinc-900 font-inter text-sm">
                      {trx.invoice_number}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider font-jakarta ${
                      trx.payment_method === "QRIS"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {trx.payment_method}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-900 font-inter">
                    Rp {trx.total.toLocaleString("id-ID")}
                  </span>
                  <button
                    onClick={() => handleDeleteTransaction(trx.id)}
                    disabled={isDeleting === trx.id}
                    className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors px-3 py-1.5 bg-red-50 rounded-lg active:scale-[0.95] disabled:opacity-50"
                  >
                    {isDeleting === trx.id
                      ? "Memproses..."
                      : "Batalkan Transaksi"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
