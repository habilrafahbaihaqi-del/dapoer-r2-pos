"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TimeRange = "today" | "7days" | "30days" | "all" | "custom";

interface ChartDataPoint {
  date: string;
  revenue: number;
  fullDate: Date;
}

export default function OwnerDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [customDate, setCustomDate] = useState("");

  const [revenue, setRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [topProduct, setTopProduct] = useState("-");

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartStats, setChartStats] = useState({
    avg: 0,
    max: 0,
    maxDate: "-",
    min: 0,
    minDate: "-",
  });

  useEffect(() => {
    if (timeRange === "custom" && !customDate) return;
    fetchDashboardMetrics(timeRange);
  }, [timeRange, customDate]);

  const fetchDashboardMetrics = async (range: TimeRange) => {
    setLoading(true);
    try {
      let startDate = new Date();
      let endDate = new Date();

      if (range === "today") {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (range === "7days") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (range === "30days") {
        startDate.setDate(startDate.getDate() - 30);
      } else if (range === "custom" && customDate) {
        startDate = new Date(customDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        startDate = new Date(2020, 0, 1);
      }

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      let query = supabase
        .from("transactions")
        .select("id, total, created_at")
        .gte("created_at", startISO);
      if (range !== "all") query = query.lte("created_at", endISO);

      const { data: trxData } = await query;

      if (trxData) {
        const totalRev = trxData.reduce(
          (sum, trx) => sum + Number(trx.total),
          0,
        );
        setRevenue(totalRev);
        setTotalTransactions(trxData.length);

        const groupedData: Record<string, ChartDataPoint> = {};
        trxData.forEach((trx) => {
          const d = new Date(trx.created_at);
          const dateStr = d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          });
          if (!groupedData[dateStr])
            groupedData[dateStr] = { date: dateStr, revenue: 0, fullDate: d };
          groupedData[dateStr].revenue += Number(trx.total);
        });

        const sortedChartData = Object.values(groupedData).sort(
          (a, b) => a.fullDate.getTime() - b.fullDate.getTime(),
        );
        setChartData(sortedChartData);

        if (sortedChartData.length > 0) {
          const revenues = sortedChartData.map((d) => d.revenue);
          setChartStats({
            avg: totalRev / sortedChartData.length,
            max: Math.max(...revenues),
            maxDate:
              sortedChartData.find((d) => d.revenue === Math.max(...revenues))
                ?.date || "-",
            min: Math.min(...revenues),
            minDate:
              sortedChartData.find((d) => d.revenue === Math.min(...revenues))
                ?.date || "-",
          });
        } else {
          setChartStats({ avg: 0, max: 0, maxDate: "-", min: 0, minDate: "-" });
        }

        if (trxData.length > 0) {
          const trxIds = trxData.map((t) => t.id);
          const { data: itemsData } = await supabase
            .from("transaction_items")
            .select(`quantity, product_variants ( name, products (name) )`)
            .in("transaction_id", trxIds);

          if (itemsData && itemsData.length > 0) {
            const salesCount: Record<string, number> = {};
            itemsData.forEach((item: any) => {
              if (item.product_variants && item.product_variants.products) {
                const productName = `${item.product_variants.products.name} - ${item.product_variants.name}`;
                salesCount[productName] =
                  (salesCount[productName] || 0) + item.quantity;
              }
            });
            let bestSelling = "-";
            let maxSales = 0;
            for (const [name, qty] of Object.entries(salesCount)) {
              if (qty > maxSales) {
                maxSales = qty;
                bestSelling = name;
              }
            }
            setTopProduct(bestSelling);
          } else setTopProduct("-");
        } else setTopProduct("-");
      }
    } catch (error) {
      console.error("Gagal memuat metrik:", error);
    } finally {
      setLoading(false);
    }
  };

  const FilterButton = ({
    value,
    label,
  }: {
    value: TimeRange;
    label: string;
  }) => (
    <button
      onClick={() => setTimeRange(value)}
      className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-bold rounded-lg transition-colors font-jakarta flex-1 sm:flex-none text-center ${
        timeRange === value
          ? "bg-[#FF5B37] text-white shadow-md border border-[#FF5B37]"
          : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {label}
    </button>
  );

  const yAxisFormatter = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 text-white p-3 rounded-lg shadow-xl text-sm font-jakarta border border-zinc-700">
          <p className="font-bold text-zinc-300 mb-1">{label}</p>
          <p className="text-[#FF5B37] font-bold text-lg">
            Rp {payload[0].value.toLocaleString("id-ID")}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 lg:space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header & Filter Row (Responsive Mobile) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-inter text-zinc-900 tracking-tight">
            Ringkasan Bisnis
          </h1>
          <p className="text-sm lg:text-base text-zinc-500 font-jakarta mt-1">
            Pantau performa penjualan Anda secara presisi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-white rounded-xl border border-zinc-200 shadow-sm w-full lg:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <FilterButton value="today" label="Hari Ini" />
            <FilterButton value="7days" label="7 Hari" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <FilterButton value="30days" label="30 Hari" />
            <FilterButton value="all" label="Semua" />
          </div>

          <div className="relative flex items-center mt-2 sm:mt-0 sm:ml-2 sm:border-l sm:border-zinc-200 sm:pl-3 w-full sm:w-auto">
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setTimeRange("custom");
              }}
              className={`w-full px-3 py-2 lg:py-1.5 text-xs lg:text-sm font-bold rounded-lg transition-all font-jakarta outline-none border ${
                timeRange === "custom"
                  ? "bg-[#FF5B37]/10 text-[#FF5B37] border-[#FF5B37]"
                  : "bg-white text-zinc-500 border-zinc-200"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Kartu Metrik Modern */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 lg:p-6 opacity-5">
            <span className="text-5xl lg:text-6xl">💰</span>
          </div>
          <h3 className="text-xs lg:text-sm font-bold text-zinc-400 uppercase tracking-wider font-inter mb-2">
            Pendapatan
          </h3>
          {loading ? (
            <div className="h-8 lg:h-10 w-32 bg-zinc-100 animate-pulse rounded-lg"></div>
          ) : (
            <p className="text-3xl lg:text-4xl font-black text-[#FF5B37] font-inter tracking-tight">
              Rp {revenue.toLocaleString("id-ID")}
            </p>
          )}
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 lg:p-6 opacity-5">
            <span className="text-5xl lg:text-6xl">🧾</span>
          </div>
          <h3 className="text-xs lg:text-sm font-bold text-zinc-400 uppercase tracking-wider font-inter mb-2">
            Transaksi
          </h3>
          {loading ? (
            <div className="h-8 lg:h-10 w-20 bg-zinc-100 animate-pulse rounded-lg"></div>
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-3xl lg:text-4xl font-black text-zinc-900 font-inter tracking-tight">
                {totalTransactions}
              </p>
              <span className="text-xs lg:text-sm font-bold text-zinc-500 font-jakarta">
                Struk
              </span>
            </div>
          )}
        </div>

        <div className="bg-white p-5 lg:p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 lg:p-6 opacity-5">
            <span className="text-5xl lg:text-6xl">🏆</span>
          </div>
          <h3 className="text-xs lg:text-sm font-bold text-zinc-400 uppercase tracking-wider font-inter mb-2">
            Produk Terlaris
          </h3>
          {loading ? (
            <div className="h-8 lg:h-10 w-40 bg-zinc-100 animate-pulse rounded-lg"></div>
          ) : (
            <p className="text-xl lg:text-2xl font-bold text-zinc-900 font-inter leading-tight truncate">
              {topProduct}
            </p>
          )}
        </div>
      </div>

      {/* Area Visualisasi Grafik Penjualan */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 lg:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h3 className="text-base lg:text-lg font-bold text-zinc-900 font-inter flex items-center gap-2">
            <span className="text-[#FF5B37]">📈</span> Grafik Penjualan
          </h3>
          <span className="text-[10px] lg:text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200 flex items-center gap-2 w-fit">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5B37] inline-block"></span>{" "}
            Pendapatan (Rp)
          </span>
        </div>

        {loading ? (
          <div className="h-[250px] lg:h-[350px] w-full flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-100">
            <p className="text-zinc-400 font-jakarta text-xs lg:text-sm font-bold animate-pulse">
              Menyiapkan kanvas...
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[250px] lg:h-[350px] w-full flex items-center justify-center bg-zinc-50 rounded-xl border border-zinc-100">
            <p className="text-zinc-400 font-jakarta text-xs lg:text-sm text-center px-4">
              Tidak ada data transaksi pada rentang waktu ini.
            </p>
          </div>
        ) : (
          <div className="h-[250px] lg:h-[350px] w-full -ml-4 lg:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5B37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF5B37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f4f4f5"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  dy={10}
                  minTickGap={20}
                />
                <YAxis
                  tickFormatter={yAxisFormatter}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#71717a" }}
                  dx={-5}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#FF5B37"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 5, fill: "#FF5B37", stroke: "none" }}
                  dot={{
                    r: 3,
                    fill: "#fff",
                    stroke: "#FF5B37",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mt-6 lg:mt-8 pt-6 border-t border-zinc-100">
          <div className="bg-zinc-50 p-3 lg:p-4 rounded-xl text-center border border-zinc-100">
            <p className="text-[9px] lg:text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-inter">
              Total
            </p>
            <p className="text-sm lg:text-lg font-bold text-[#FF5B37] font-inter">
              Rp {revenue.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="bg-zinc-50 p-3 lg:p-4 rounded-xl text-center border border-zinc-100">
            <p className="text-[9px] lg:text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-inter">
              Rata-rata
            </p>
            <p className="text-sm lg:text-lg font-bold text-red-600 font-inter">
              Rp{" "}
              {chartStats.avg.toLocaleString("id-ID", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className="bg-zinc-50 p-3 lg:p-4 rounded-xl text-center border border-zinc-100">
            <p className="text-[9px] lg:text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-inter">
              Tertinggi
            </p>
            <p className="text-sm lg:text-lg font-bold text-red-600 font-inter">
              Rp {chartStats.max.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="bg-zinc-50 p-3 lg:p-4 rounded-xl text-center border border-zinc-100">
            <p className="text-[9px] lg:text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1 font-inter">
              Terendah
            </p>
            <p className="text-sm lg:text-lg font-bold text-red-600 font-inter">
              Rp {chartStats.min.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
