"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  ReceiptText,
  ArrowDownLeft,
  X,
  Store,
  AlertOctagon,
  CalendarDays,
} from "lucide-react";

interface TransactionItem {
  quantity: number;
  price: number;
  product_variants: {
    name: string;
    products: { name: string };
  };
}

interface Transaction {
  id: string;
  created_at: string;
  total: number;
  invoice_number: string;
  payment_method: string;
  status: string;
  transaction_items: TransactionItem[];
}

export default function RiwayatKasirPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");

  // State Modal
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchCashierHistory();
  }, []);

  const fetchCashierHistory = async () => {
    setLoading(true);
    try {
      // Ambil transaksi 7 hari terakhir yang statusnya SUKSES saja
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          id,
          created_at,
          total,
          invoice_number,
          payment_method,
          status,
          transaction_items (
            quantity,
            price,
            product_variants (
              name,
              products ( name )
            )
          )
        `,
        )
        .eq("status", "SUKSES") // HANYA TAMPILKAN YANG SUKSES
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data as any as Transaction[]);
    } catch (error) {
      console.error("Gagal memuat riwayat:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA PEMBATALAN TRANSAKSI (Sesuai Blueprint) ---
  const handleCancelTransaction = async (tx: Transaction) => {
    const confirmCancel = window.confirm(
      `Apakah Anda yakin ingin membatalkan transaksi ${tx.invoice_number}?\n\nStok barang akan otomatis dikembalikan ke gudang.`,
    );
    if (!confirmCancel) return;

    setIsCancelling(true);
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

      // 1. Kembalikan stok item ke tabel product_variants
      const items = tx.transaction_items || [];
      // Ambil data item dari database untuk mendapatkan variant_id (karena di query atas kita tidak memanggil variant_id secara eksplisit)
      const { data: rawItems } = await supabase
        .from("transaction_items")
        .select("variant_id, quantity")
        .eq("transaction_id", tx.id);

      if (rawItems) {
        for (const item of rawItems) {
          // Cek stok terbaru
          const { data: currentVariant } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", item.variant_id)
            .single();

          if (currentVariant) {
            const restoredStock = currentVariant.stock + item.quantity;
            await supabase
              .from("product_variants")
              .update({ stock: restoredStock })
              .eq("id", item.variant_id);
          }
        }
      }

      // 2. Update status transaksi menjadi DIBATALKAN
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ status: "DIBATALKAN" })
        .eq("id", tx.id);

      if (updateError) throw updateError;

      // 3. Catat ke Audit Log
      await supabase.from("audit_logs").insert([
        {
          user_name: cashierName,
          role: "kasir",
          action: "BATAL_TRANSAKSI",
          description: `Membatalkan transaksi ${tx.invoice_number}. Stok dikembalikan.`,
        },
      ]);

      alert("Transaksi berhasil dibatalkan!");
      setIsModalOpen(false);
      fetchCashierHistory(); // Refresh, transaksi ini akan hilang karena filter "SUKSES"
    } catch (error: any) {
      alert(`Gagal membatalkan transaksi: ${error.message}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // --- LOGIKA GROUPING BERDASARKAN TANGGAL (Mobile Banking Style) ---
  const filteredData = transactions.filter((tx) =>
    tx.invoice_number.toLowerCase().includes(search.toLowerCase()),
  );

  const groupedTransactions = filteredData.reduce((groups: any, tx) => {
    const dateObj = new Date(tx.created_at);
    // Format: "26 Juni 2026"
    const dateStr = dateObj.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Cek apakah tanggal ini adalah "Hari Ini"
    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const label = dateStr === todayStr ? "Hari Ini" : dateStr;

    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
    return groups;
  }, {});

  const groupKeys = Object.keys(groupedTransactions);

  // --- UTILITAS FORMAT WAKTU ---
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getItemsSummary = (items: TransactionItem[]) => {
    if (!items || items.length === 0) return "-";
    const summary = items.map(
      (item) => `${item.product_variants?.products?.name} (${item.quantity})`,
    );
    return summary.join(", ");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header Halaman */}
      <div className="space-y-1.5 px-2">
        <h1 className="text-2xl font-black font-inter text-zinc-900 tracking-tight">
          Riwayat Transaksi
        </h1>
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          7 Hari Terakhir
        </p>
      </div>

      {/* Pencarian (Penting untuk cari nomor resi cepat) */}
      <div className="relative px-2">
        <Search
          size={18}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          placeholder="Cari nomor struk (INV-...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-zinc-200 focus:border-[#FF5B37] pl-12 pr-4 py-3.5 rounded-2xl shadow-sm font-jakarta text-sm transition-all outline-none focus:ring-2 focus:ring-[#FF5B37]/20 text-zinc-800 font-medium"
        />
      </div>

      {/* AREA DAFTAR TRANSAKSI (Timeline View) */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-12 text-sm text-zinc-400 font-jakarta animate-pulse">
            Menarik data riwayat...
          </div>
        ) : groupKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 space-y-3 opacity-70">
            <ReceiptText size={48} strokeWidth={1.5} />
            <p className="text-sm font-jakarta">
              Belum ada transaksi yang tercatat.
            </p>
          </div>
        ) : (
          groupKeys.map((dateLabel) => (
            <div key={dateLabel} className="space-y-3">
              {/* Sticky Header ala Mobile Banking */}
              <div className="sticky top-20 z-30 bg-[#f4f7f6]/90 backdrop-blur-sm py-2 px-2 flex items-center gap-2">
                <CalendarDays size={16} className="text-zinc-400" />
                <h3 className="text-sm font-bold text-zinc-600 font-inter">
                  {dateLabel}
                </h3>
              </div>

              {/* Kumpulan Kartu Transaksi di hari tersebut */}
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden divide-y divide-zinc-100">
                {groupedTransactions[dateLabel].map((tx: Transaction) => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      setSelectedTx(tx);
                      setIsModalOpen(true);
                    }}
                    className="p-4 flex items-center justify-between hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Ikon Tanda Masuk Uang */}
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                        <ArrowDownLeft size={24} strokeWidth={2.5} />
                      </div>

                      {/* Info Kiri */}
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-800 font-inter text-sm mb-0.5">
                          {tx.invoice_number}
                        </p>
                        <p className="text-xs text-zinc-400 font-jakarta truncate max-w-[180px] sm:max-w-xs">
                          {getItemsSummary(tx.transaction_items)}
                        </p>
                      </div>
                    </div>

                    {/* Nominal Kanan */}
                    <div className="text-right shrink-0">
                      <p className="font-black text-emerald-600 font-inter text-base">
                        + Rp {tx.total.toLocaleString("id-ID")}
                      </p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-zinc-400">
                          {formatTime(tx.created_at)}
                        </span>
                        <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                          {tx.payment_method}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL DETAIL & BATALKAN TRANSAKSI --- */}
      {isModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#FF5B37] rounded-lg flex items-center justify-center text-white">
                  <Store size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 font-inter leading-tight">
                    Detail Struk
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-jakarta">
                    {selectedTx.invoice_number}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 rounded-full transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            {/* Isi Struk (Bisa discroll) */}
            <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
              <div className="text-center">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Total Pembayaran
                </p>
                <p className="text-3xl font-black text-zinc-900 font-inter">
                  Rp {selectedTx.total.toLocaleString("id-ID")}
                </p>
                <span className="inline-block px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold mt-2 uppercase tracking-widest border border-zinc-200">
                  {selectedTx.payment_method}
                </span>
              </div>

              <div className="border-t border-dashed border-zinc-200" />

              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Rincian Pesanan
                </p>
                {selectedTx.transaction_items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-start text-sm"
                  >
                    <div>
                      <p className="font-bold text-zinc-800 font-inter">
                        {item.product_variants?.products?.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-jakarta">
                        {item.quantity}x {item.product_variants?.name} (@ Rp{" "}
                        {item.price.toLocaleString("id-ID")})
                      </p>
                    </div>
                    <p className="font-bold text-zinc-900 font-inter">
                      {(item.price * item.quantity).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-zinc-200" />

              <div className="flex justify-between text-[11px] text-zinc-500 font-jakarta">
                <span>Waktu Transaksi:</span>
                <span className="font-medium">
                  {new Date(selectedTx.created_at).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Area Bawah: Tombol Batalkan */}
            <div className="p-5 border-t border-zinc-100 bg-zinc-50/80 shrink-0">
              <button
                onClick={() => handleCancelTransaction(selectedTx)}
                disabled={isCancelling}
                className="w-full py-3.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold font-inter text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <AlertOctagon size={16} />
                {isCancelling ? "Memproses Batal..." : "Batalkan Transaksi Ini"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
