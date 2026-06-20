"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function OwnerDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  // State untuk metrik
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [topProduct, setTopProduct] = useState("-");

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      // 1. Dapatkan tanggal hari ini (mulai dari jam 00:00:00)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // 2. Tarik data transaksi HARI INI untuk pendapatan
      const { data: todayTrx } = await supabase
        .from("transactions")
        .select("total")
        .gte("created_at", todayISO);

      if (todayTrx) {
        const revenue = todayTrx.reduce(
          (sum, trx) => sum + Number(trx.total),
          0,
        );
        setTodayRevenue(revenue);
      }

      // 3. Tarik TOTAL seluruh transaksi
      const { count: totalCount } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true });

      if (totalCount !== null) {
        setTotalTransactions(totalCount);
      }

      // 4. Hitung produk terlaris (Logika sederhana MVP)
      const { data: itemsData } = await supabase.from("transaction_items")
        .select(`
          quantity,
          product_variants (
            name,
            products (name)
          )
        `);

      if (itemsData && itemsData.length > 0) {
        // Hitung frekuensi penjualan tiap varian
        const salesCount: Record<string, number> = {};
        itemsData.forEach((item: any) => {
          if (item.product_variants && item.product_variants.products) {
            const productName = `${item.product_variants.products.name} - ${item.product_variants.name}`;
            salesCount[productName] =
              (salesCount[productName] || 0) + item.quantity;
          }
        });

        // Cari yang penjualannya paling tinggi
        let maxSales = 0;
        let bestSelling = "-";
        for (const [name, qty] of Object.entries(salesCount)) {
          if (qty > maxSales) {
            maxSales = qty;
            bestSelling = name;
          }
        }
        setTopProduct(bestSelling);
      }
    } catch (error) {
      console.error("Gagal memuat metrik:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-inter text-zinc-900">
        Dashboard Utama
      </h1>
      <p className="text-zinc-500 font-jakarta">
        Selamat datang! Berikut adalah ringkasan operasional bisnis Anda.
      </p>

      {/* Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-zinc-500 font-jakarta">
            Pendapatan Hari Ini
          </h3>
          {loading ? (
            <div className="h-8 w-24 bg-zinc-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-2xl font-bold text-zinc-900 mt-2 font-inter">
              Rp {todayRevenue.toLocaleString("id-ID")}
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-zinc-500 font-jakarta">
            Total Transaksi
          </h3>
          {loading ? (
            <div className="h-8 w-16 bg-zinc-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-2xl font-bold text-zinc-900 mt-2 font-inter">
              {totalTransactions}{" "}
              <span className="text-sm font-normal text-zinc-500">struk</span>
            </p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-zinc-500 font-jakarta">
            Produk Terlaris
          </h3>
          {loading ? (
            <div className="h-8 w-32 bg-zinc-100 animate-pulse rounded mt-2"></div>
          ) : (
            <p className="text-lg font-bold text-zinc-900 mt-2 font-inter leading-tight">
              {topProduct}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-zinc-900 rounded-xl p-6 shadow-md text-white">
        <h3 className="font-bold font-inter">Siap Melayani Pelanggan</h3>
        <p className="text-sm text-zinc-400 font-jakarta mt-2">
          Pantau terus aktivitas kasir dari notifikasi lonceng di pojok kanan
          atas.
        </p>
      </div>
    </div>
  );
}
