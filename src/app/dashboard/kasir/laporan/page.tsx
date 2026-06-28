"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  TrendingUp,
  Receipt,
  Award,
  Clock,
  RefreshCw,
  Flame,
} from "lucide-react";

interface TopItem {
  id: string;
  productName: string;
  variantName: string;
  quantity: number;
  revenue: number;
}

export default function KasirLaporanHariIniPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // State Metrik Hari Ini
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayTxCount, setTodayTxCount] = useState(0);
  const [topItems, setTopItems] = useState<TopItem[]>([]);

  useEffect(() => {
    // 1. Tarik data pertama kali halaman dibuka
    fetchTodayReport();

    // 2. SENSOR REAL-TIME SUPABASE (Sinkronisasi Antar Kasir)
    // Jika ada transaksi baru yang masuk ke tabel 'transactions', otomatis perbarui laporan
    const channel = supabase
      .channel("realtime-kasir-laporan")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        (payload) => {
          console.log("Transaksi baru terdeteksi!", payload);
          fetchTodayReport(true); // Panggil ulang data secara diam-diam (background refresh)
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "transactions" },
        () => {
          fetchTodayReport(true); // Berguna jika ada transaksi yang dibatalkan
        },
      )
      .subscribe();

    // Bersihkan sensor saat kasir pindah halaman
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTodayReport = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setIsRefreshing(true);

    try {
      // LOGIKA ZONA WAKTU LOKAL (Mencegah Bug Tengah Malam)
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
      );

      // Tarik transaksi HARI INI yang berstatus SUKSES
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select(
          `
          id,
          total,
          transaction_items (
            variant_id,
            quantity,
            price,
            product_variants (
              name,
              products ( name )
            )
          )
        `,
        )
        .eq("status", "SUKSES")
        .gte("created_at", startOfDay.toISOString())
        .lte("created_at", endOfDay.toISOString());

      if (error) throw error;

      if (transactions) {
        // 1. Hitung Total Pendapatan & Jumlah Transaksi
        const totalUang = transactions.reduce((sum, tx) => sum + tx.total, 0);
        setTodayRevenue(totalUang);
        setTodayTxCount(transactions.length);

        // 2. Olah Data Menu Terlaris (Agregasi)
        const itemMap = new Map<string, TopItem>();

        transactions.forEach((tx) => {
          tx.transaction_items?.forEach((item: any) => {
            const vId = item.variant_id;
            const existing = itemMap.get(vId);

            if (existing) {
              existing.quantity += item.quantity;
              existing.revenue += item.quantity * item.price;
            } else {
              itemMap.set(vId, {
                id: vId,
                productName:
                  item.product_variants?.products?.name ||
                  "Produk Tidak Diketahui",
                variantName: item.product_variants?.name || "-",
                quantity: item.quantity,
                revenue: item.quantity * item.price,
              });
            }
          });
        });

        // Urutkan berdasarkan kuantitas terbanyak, ambil 5 teratas
        const sortedTopItems = Array.from(itemMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        setTopItems(sortedTopItems);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Gagal menarik laporan hari ini:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 px-2 sm:px-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white p-5 md:p-6 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden">
        {/* Dekorasi Latar Belakang Geometris */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-gradient-to-br from-[#FF5B37]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-black font-inter text-zinc-900 tracking-tight">
            Performa Hari Ini
          </h1>
          <div className="flex items-center gap-2 text-zinc-500 font-jakarta text-sm">
            <Clock size={16} />
            <p>
              Sesi Aktif:{" "}
              <span className="font-bold text-zinc-700">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 relative z-10 w-full sm:w-auto">
          <button
            onClick={() => fetchTodayReport(false)}
            disabled={loading || isRefreshing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-bold font-inter text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={`${loading || isRefreshing ? "animate-spin text-[#FF5B37]" : ""}`}
            />
            {isRefreshing ? "Menyinkronkan..." : "Segarkan Data"}
          </button>
          <p className="text-[10px] text-zinc-400 font-jakarta font-medium text-right w-full">
            Pembaruan terakhir: {formatTime(lastUpdated)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={32} className="animate-spin text-zinc-300" />
          <p className="text-zinc-400 font-jakarta text-sm animate-pulse">
            Menghitung performa kasir hari ini...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* GRID METRIK UTAMA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kartu Pendapatan */}
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                    Pendapatan Kotor
                  </p>
                  <p className="text-sm font-jakarta text-emerald-600 font-semibold mt-0.5">
                    Hari Ini
                  </p>
                </div>
              </div>
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-black text-zinc-900 font-inter tracking-tight">
                  <span className="text-2xl text-zinc-400 mr-1">Rp</span>
                  {todayRevenue.toLocaleString("id-ID")}
                </h2>
              </div>
            </div>

            {/* Kartu Total Transaksi */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full transition-transform group-hover:scale-110" />
              <div className="relative z-10 flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                  <Receipt size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-inter">
                    Total Struk
                  </p>
                  <p className="text-sm font-jakarta text-blue-500 font-semibold mt-0.5">
                    Berhasil Dicetak
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex items-baseline gap-2">
                <h2 className="text-4xl md:text-5xl font-black text-zinc-900 font-inter tracking-tight">
                  {todayTxCount}
                </h2>
                <span className="text-lg font-bold text-zinc-400 font-jakarta">
                  Transaksi
                </span>
              </div>
            </div>
          </div>

          {/* SECTION MENU TERLARIS */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF5B37]/10 text-[#FF5B37] rounded-xl flex items-center justify-center">
                  <Flame size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 font-inter text-lg">
                    Menu Terlaris Hari Ini
                  </h3>
                  <p className="text-xs text-zinc-500 font-jakarta">
                    5 Produk paling banyak dipesan pelanggan
                  </p>
                </div>
              </div>
            </div>

            {topItems.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-400 space-y-3">
                <Award size={48} strokeWidth={1} className="opacity-50" />
                <p className="font-jakarta text-sm">
                  Belum ada data penjualan hari ini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {topItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 md:p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Badge Peringkat */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm font-inter shrink-0 shadow-sm
                        ${
                          index === 0
                            ? "bg-amber-100 text-amber-600 border border-amber-200"
                            : index === 1
                              ? "bg-zinc-200 text-zinc-600 border border-zinc-300"
                              : index === 2
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-zinc-50 text-zinc-400 border border-zinc-100"
                        }
                      `}
                      >
                        {index + 1}
                      </div>

                      <div>
                        <h4 className="font-bold text-zinc-800 font-inter leading-tight group-hover:text-[#FF5B37] transition-colors">
                          {item.productName}
                        </h4>
                        <p className="text-xs text-zinc-500 font-jakarta mt-0.5">
                          Varian:{" "}
                          <span className="font-semibold text-zinc-600">
                            {item.variantName}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-zinc-900 font-inter text-lg">
                        {item.quantity}{" "}
                        <span className="text-xs text-zinc-400 font-medium">
                          pcs
                        </span>
                      </p>
                      <p className="text-[11px] font-bold text-emerald-600 font-jakarta mt-0.5">
                        Rp {item.revenue.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
