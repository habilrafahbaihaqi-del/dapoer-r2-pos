"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Search,
  Calendar,
  Filter,
  Eye,
  FileSpreadsheet,
  FileText,
  X,
  Receipt,
} from "lucide-react";

interface TransactionItem {
  quantity: number;
  product_variants: {
    name: string;
    price: number;
    products: { name: string };
  };
}

interface Transaction {
  id: string;
  created_at: string;
  total: number;
  invoice_number: string;
  payment_method: string;
  transaction_items: TransactionItem[];
}

interface StoreSettings {
  store_name: string;
  address: string;
  phone: string;
}

export default function RiwayatTransaksiPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    null,
  );

  // State Filter
  const [timeRange, setTimeRange] = useState("Hari Ini");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State Modal Struk
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchStoreSettings();
    // Set default tanggal hari ini
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
    fetchTransactions(today, today);
  }, []);

  const fetchStoreSettings = async () => {
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .single();
    if (data) setStoreSettings(data);
  };

  const fetchTransactions = async (start: string, end: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select(
          `
          id,
          created_at,
          total,
          payment_method, 
          transaction_items (
            quantity,
            product_variants (
              name,
              price,
              products ( name )
            )
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (start) {
        const startDateTime = new Date(start);
        startDateTime.setHours(0, 0, 0, 0);
        query = query.gte("created_at", startDateTime.toISOString());
      }
      if (end) {
        const endDateTime = new Date(end);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endDateTime.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const formattedData = data.map((trx: any) => {
          const dateStr = new Date(trx.created_at)
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "");
          const shortId = trx.id.substring(0, 4).toUpperCase();
          return {
            ...trx,
            invoice_number: `INV-${dateStr}-${shortId}`,
            // Mengambil metode pembayaran asli dari database (TUNAI/QRIS), jika kosong fallback ke TUNAI
            payment_method: trx.payment_method || "TUNAI",
          };
        });
        setTransactions(formattedData as Transaction[]);
      }
    } catch (error) {
      console.error("Gagal memuat transaksi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchTransactions(startDate, endDate);
  };

  const openReceiptModal = (trx: Transaction) => {
    setSelectedTransaction(trx);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 relative">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 px-2">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-inter text-zinc-900 tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-zinc-500 font-jakarta text-sm lg:text-base">
            Pantau seluruh riwayat transaksi dan unduh laporan penjualan.
          </p>
        </div>

        {/* Tombol Export */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold text-sm rounded-xl hover:bg-emerald-100 transition-colors active:scale-95">
            <FileSpreadsheet size={18} />
            Export Excel
          </button>
          <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 font-bold text-sm rounded-xl hover:bg-red-100 transition-colors active:scale-95">
            <FileText size={18} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 flex flex-col md:flex-row items-end gap-4">
        <div className="space-y-1.5 w-full md:w-auto flex-1">
          <label className="text-xs font-bold text-zinc-500 font-inter">
            Rentang Waktu
          </label>
          <div className="relative">
            <Calendar
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-jakarta text-zinc-800 focus:outline-none focus:border-[#FF5B37] appearance-none bg-white"
            >
              <option>Hari Ini</option>
              <option>7 Hari Terakhir</option>
              <option>30 Hari Terakhir</option>
              <option>Kustom</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5 w-full md:w-auto flex-1">
          <label className="text-xs font-bold text-zinc-500 font-inter">
            Dari Tanggal
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-jakarta text-zinc-800 focus:outline-none focus:border-[#FF5B37]"
            />
          </div>
        </div>

        <div className="space-y-1.5 w-full md:w-auto flex-1">
          <label className="text-xs font-bold text-zinc-500 font-inter">
            Sampai Tanggal
          </label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm font-jakarta text-zinc-800 focus:outline-none focus:border-[#FF5B37]"
            />
          </div>
        </div>

        <button
          onClick={handleApplyFilter}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FF5B37] text-white font-bold text-sm rounded-xl hover:bg-[#e04a2a] transition-all shadow-md shadow-[#FF5B37]/20 active:scale-95 h-[42px]"
        >
          <Filter size={16} />
          Terapkan Filter
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center gap-2">
          <Receipt size={20} className="text-[#FF5B37]" />
          <h2 className="font-bold text-zinc-800 font-inter">
            Daftar Transaksi
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter w-16 text-center">
                  No
                </th>
                <th className="px-6 py-4 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter">
                  Tanggal
                </th>
                <th className="px-6 py-4 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter">
                  Nomor Invoice
                </th>
                <th className="px-6 py-4 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter text-center">
                  Metode Pembayaran
                </th>
                <th className="px-6 py-4 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter">
                  Total
                </th>
                <th className="px-6 py-4 font-bold text-zinc-400 text-[11px] uppercase tracking-widest font-inter text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-zinc-400 font-jakarta text-sm animate-pulse"
                  >
                    Mencari riwayat transaksi...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-zinc-400 font-jakarta text-sm italic"
                  >
                    Tidak ada transaksi pada rentang waktu ini.
                  </td>
                </tr>
              ) : (
                transactions.map((trx, index) => (
                  <tr
                    key={trx.id}
                    className="group hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-zinc-500 font-inter text-center">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 font-jakarta">
                      {formatDate(trx.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-800 font-inter text-sm">
                        {trx.invoice_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-bold font-jakarta uppercase tracking-wider">
                        {trx.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-600 font-inter text-sm">
                      Rp {trx.total.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openReceiptModal(trx)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 transition-colors rounded-lg font-bold text-xs font-inter border border-red-100 active:scale-95"
                      >
                        <Eye size={14} />
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-zinc-50/30 border-t border-zinc-100 flex justify-between items-center px-6">
          <p className="text-xs font-medium text-zinc-500 font-jakarta">
            Menampilkan {transactions.length > 0 ? 1 : 0} -{" "}
            {transactions.length} transaksi
          </p>
        </div>
      </div>

      {/* --- MODAL DETAIL STRUK --- */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="text-sm font-bold text-zinc-900 font-inter">
                Detail Struk Transaksi
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Area Pratinjau Kertas Nota (Persis seperti Profil Toko) */}
            <div className="p-6 bg-zinc-100 flex justify-center">
              <div className="bg-white rounded-lg shadow-sm p-5 w-full relative font-mono text-zinc-700 text-xs border border-zinc-200">
                <div className="absolute top-0 inset-x-0 h-1 bg-[linear-gradient(45deg,transparent_33.333%,#fff_33.333%,#fff_66.667%,transparent_66.667%),linear-gradient(-45deg,transparent_33.333%,#fff_33.333%,#fff_66.667%,transparent_66.667%)] bg-[size:8px_8px] -mt-1" />

                <div className="space-y-4">
                  {/* Kop Nota */}
                  <div className="text-center space-y-1">
                    <h3 className="text-sm font-bold text-zinc-900 font-inter tracking-tight uppercase break-words">
                      {storeSettings?.store_name || "Dapoer R2"}
                    </h3>
                    <p className="whitespace-pre-wrap break-words text-[10px] text-zinc-500 leading-tight">
                      {storeSettings?.address || "Alamat outlet belum diatur"}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      Telp: {storeSettings?.phone || "-"}
                    </p>
                  </div>

                  <div className="border-b border-dashed border-zinc-300 w-full" />

                  {/* Metadata Invoice */}
                  <div className="space-y-0.5 text-zinc-500 text-[10px]">
                    <div className="flex justify-between">
                      <span>No. Nota:</span>
                      <span>{selectedTransaction.invoice_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tanggal:</span>
                      <span>{formatDate(selectedTransaction.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Metode:</span>
                      <span>{selectedTransaction.payment_method}</span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-zinc-300 w-full" />

                  {/* Item Belanja Dinamis dari Database */}
                  <div className="space-y-2 text-[11px]">
                    {selectedTransaction.transaction_items?.map((item, idx) => {
                      const variantName = item.product_variants?.name;
                      const productName = item.product_variants?.products?.name;
                      const price = item.product_variants?.price || 0;
                      const subtotal = price * item.quantity;

                      return (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between font-bold text-zinc-800">
                            <span>
                              {productName} ({variantName})
                            </span>
                            <span>{subtotal.toLocaleString("id-ID")}</span>
                          </div>
                          <div className="flex justify-between text-zinc-400 text-[10px]">
                            <span>
                              {item.quantity} pcs x{" "}
                              {price.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-b border-dashed border-zinc-300 w-full" />

                  {/* Akumulasi Total */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between font-black text-sm text-zinc-900">
                      <span>TOTAL:</span>
                      <span>
                        Rp {selectedTransaction.total.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-zinc-300 w-full" />

                  {/* Footer Nota */}
                  <div className="text-center space-y-0.5 pt-1 text-[10px]">
                    <p className="font-bold text-zinc-800 uppercase tracking-wider">
                      Terima Kasih
                    </p>
                    <p className="text-zinc-400">
                      Selamat Menikmati Hidangan Kami
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-0 inset-x-0 h-1 bg-[linear-gradient(45deg,transparent_33.333%,#fff_33.333%,#fff_66.667%,transparent_66.667%),linear-gradient(-45deg,transparent_33.333%,#fff_33.333%,#fff_66.667%,transparent_66.667%)] bg-[size:8px_8px] rotate-180 -mb-1" />
              </div>
            </div>

            {/* Action Bawah Modal */}
            <div className="p-4 bg-white border-t border-zinc-100 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
