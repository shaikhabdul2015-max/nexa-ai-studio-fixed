import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, TrendingUp, Layers, Info } from "lucide-react";
import { ResearchChartConfig } from "../../types";

interface ResearchChartsSectionProps {
  charts: ResearchChartConfig[];
  topic: string;
}

export const ResearchChartsSection: React.FC<ResearchChartsSectionProps> = ({ charts, topic }) => {
  if (!charts || charts.length === 0) return null;

  const [activeChartIndex, setActiveChartIndex] = useState(0);
  const [chartTypeOverride, setChartTypeOverride] = useState<"bar" | "line" | "area" | null>(null);

  const activeConfig = charts[activeChartIndex] || charts[0];
  const effectiveType = chartTypeOverride || activeConfig.type || "bar";

  // Calculate high-level summary metrics from data
  const dataValues = activeConfig.data
    .map((item) => {
      const primaryKey = activeConfig.dataKeys[0]?.key;
      return primaryKey ? Number(item[primaryKey]) : NaN;
    })
    .filter((v) => !isNaN(v));

  const peakVal = dataValues.length > 0 ? Math.max(...dataValues) : 0;
  const minVal = dataValues.length > 0 ? Math.min(...dataValues) : 0;
  const avgVal =
    dataValues.length > 0 ? (dataValues.reduce((a, b) => a + b, 0) / dataValues.length).toFixed(1) : "0";

  return (
    <section
      id="research-charts-section"
      className="my-8 p-6 md:p-8 rounded-3xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-6"
    >
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Data Visualizations
            </span>
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
            Empirical Metrics & Statistical Analysis
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Auto-synthesized quantitative models derived from {topic} research data
          </p>
        </div>

        {/* Chart View & Type Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dataset Selector if multiple charts */}
          {charts.length > 1 && (
            <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700">
              {charts.map((c, idx) => (
                <button
                  key={c.id || idx}
                  onClick={() => {
                    setActiveChartIndex(idx);
                    setChartTypeOverride(null);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    activeChartIndex === idx
                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {c.title.split(" ")[0]} Dataset
                </button>
              ))}
            </div>
          )}

          {/* Chart Display Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setChartTypeOverride("bar")}
              title="Bar Chart"
              className={`p-1.5 rounded-lg transition-colors ${
                effectiveType === "bar"
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartTypeOverride("line")}
              title="Line Graph"
              className={`p-1.5 rounded-lg transition-colors ${
                effectiveType === "line"
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartTypeOverride("area")}
              title="Area Graph"
              className={`p-1.5 rounded-lg transition-colors ${
                effectiveType === "area"
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <AreaChartIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart Title and Context */}
      <div>
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {activeConfig.title}
        </h4>
        {activeConfig.description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {activeConfig.description}
          </p>
        )}
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-72 md:h-80 bg-white dark:bg-neutral-850 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <ResponsiveContainer width="100%" height="100%">
          {effectiveType === "bar" ? (
            <BarChart data={activeConfig.data} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey={activeConfig.xAxisKey}
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickLine={false}
                stroke="#888888"
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickLine={false}
                stroke="#888888"
                unit={activeConfig.unit ? ` ${activeConfig.unit.split("/")[0]}` : ""}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(23, 23, 23, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              {activeConfig.dataKeys.map((k, i) => (
                <Bar
                  key={k.key}
                  dataKey={k.key}
                  name={k.name}
                  fill={k.color || (i === 0 ? "#3b82f6" : "#10b981")}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={55}
                />
              ))}
            </BarChart>
          ) : effectiveType === "line" ? (
            <LineChart data={activeConfig.data} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey={activeConfig.xAxisKey}
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickLine={false}
                stroke="#888888"
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickLine={false}
                stroke="#888888"
                unit={activeConfig.unit ? ` ${activeConfig.unit.split("/")[0]}` : ""}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(23, 23, 23, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              {activeConfig.dataKeys.map((k, i) => (
                <Line
                  key={k.key}
                  type="monotone"
                  dataKey={k.key}
                  name={k.name}
                  stroke={k.color || (i === 0 ? "#8b5cf6" : "#f59e0b")}
                  strokeWidth={2.5}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : (
            <AreaChart data={activeConfig.data} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey={activeConfig.xAxisKey}
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickLine={false}
                stroke="#888888"
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "currentColor" }}
                tickLine={false}
                stroke="#888888"
                unit={activeConfig.unit ? ` ${activeConfig.unit.split("/")[0]}` : ""}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(23, 23, 23, 0.95)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                }}
                itemStyle={{ color: "#ffffff" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              {activeConfig.dataKeys.map((k, i) => (
                <Area
                  key={k.key}
                  type="monotone"
                  dataKey={k.key}
                  name={k.name}
                  stroke={k.color || (i === 0 ? "#06b6d4" : "#10b981")}
                  fill={k.color || (i === 0 ? "#06b6d4" : "#10b981")}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Statistical Highlight Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">Peak Metric</span>
          <span className="text-base font-bold text-neutral-900 dark:text-white mt-0.5 block">
            {peakVal.toLocaleString()} {activeConfig.unit || ""}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">Mean Baseline</span>
          <span className="text-base font-bold text-neutral-900 dark:text-white mt-0.5 block">
            {avgVal} {activeConfig.unit || ""}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">Min Bound</span>
          <span className="text-base font-bold text-neutral-900 dark:text-white mt-0.5 block">
            {minVal.toLocaleString()} {activeConfig.unit || ""}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block">Dimensions Sampled</span>
          <span className="text-base font-bold text-neutral-900 dark:text-white mt-0.5 block">
            {activeConfig.data.length} Data Points
          </span>
        </div>
      </div>
    </section>
  );
};
