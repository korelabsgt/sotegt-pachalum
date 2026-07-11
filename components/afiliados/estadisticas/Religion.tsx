"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Afiliado } from "../esquemas";
import { CHART_PALETTE, ChartHeader, ChartFooter } from "./chartTheme";
import { useChartTheme } from "./useChartTheme";

interface Props {
  afiliados: Afiliado[];
}

export default function Religiones({ afiliados }: Props) {
  const theme = useChartTheme();
  const [activo, setActivo] = useState<string | null>(null);

  const conteo: Record<string, number> = {};

  afiliados.forEach((afiliado) => {
    const rel = afiliado.religion || "Sin especificar";
    conteo[rel] = (conteo[rel] || 0) + 1;
  });

  const datosPadron = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], index) => ({
      name,
      value,
      color: CHART_PALETTE[index % CHART_PALETTE.length],
    }));

  const tieneDatos = afiliados.length > 0;
  const datosGrafica = tieneDatos
    ? datosPadron.filter((d) => d.value > 0)
    : [{ name: "Sin registros", value: 1, color: theme.empty }];

  const total = afiliados.length;
  const datosDonut = datosGrafica.filter((d) => d.name !== "Sin registros");
  const itemActivo = datosDonut.find((d) => d.name === activo) ?? null;

  return (
    <div className="w-full h-full flex flex-col min-h-[400px]">
      <ChartHeader
        title="Estadística de Religión"
        subtitle="Distribución porcentual del grupo"
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 w-full items-stretch min-h-[280px]"
      >
        <div className="relative w-full md:w-[260px] h-[260px] shrink-0 mx-auto md:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datosGrafica}
                cx="50%"
                cy="50%"
                innerRadius="56%"
                outerRadius="88%"
                paddingAngle={datosDonut.length > 1 ? 5 : 0}
                cornerRadius={10}
                dataKey="value"
                stroke={theme.stroke}
                strokeWidth={4}
                onMouseEnter={(_, i) => {
                  const item = datosGrafica[i];
                  if (item?.name !== "Sin registros") setActivo(item?.name ?? null);
                }}
                onMouseLeave={() => setActivo(null)}
              >
                {datosGrafica.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={
                      entry.name === "Sin registros" || activo === null || activo === entry.name
                        ? 1
                        : 0.3
                    }
                    style={{ transition: "opacity 0.3s ease" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {tieneDatos && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
              <span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                {total}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-neutral-500 mt-1">
                Total
              </span>
              <AnimatePresence>
                {itemActivo && (
                  <motion.div
                    key={itemActivo.name}
                    initial={{ opacity: 0, y: 8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: 8, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="flex flex-col items-center gap-0.5 mt-2 overflow-hidden text-center max-w-[130px]"
                  >
                    <span className="text-[9px] font-semibold text-gray-500 dark:text-neutral-400 leading-tight line-clamp-2">
                      {itemActivo.name}
                    </span>
                    <span
                      className="text-sm font-black tabular-nums"
                      style={{ color: itemActivo.color }}
                    >
                      {total > 0 ? ((itemActivo.value / total) * 100).toFixed(0) : 0}% ·{" "}
                      {itemActivo.value}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {datosDonut.length > 0 ? (
          <div className="flex-1 rounded-2xl bg-violet-50/80 dark:bg-neutral-800/50 border border-violet-100 dark:border-neutral-700/60 p-4 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 text-center mb-2">
              Desglose
            </p>
            {datosDonut.map((d, i) => {
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : "0";
              const esActivo = activo === d.name;
              return (
                <motion.div
                  key={d.name}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                  onMouseEnter={() => setActivo(d.name)}
                  onMouseLeave={() => setActivo(null)}
                  className={`flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-300 cursor-default ${
                    esActivo
                      ? "bg-white dark:bg-neutral-900 shadow-sm scale-[1.01]"
                      : "bg-white/40 dark:bg-neutral-900/30"
                  }`}
                >
                  <span
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-black tabular-nums shadow-sm"
                    style={{ backgroundColor: d.color }}
                  >
                    {d.value}
                  </span>
                  <span className="flex-1 text-xs font-semibold text-gray-700 dark:text-neutral-300 leading-tight">
                    {d.name}
                  </span>
                  <span
                    className="text-sm font-black tabular-nums shrink-0"
                    style={{ color: d.color }}
                  >
                    {pct}%
                  </span>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-neutral-500 italic">
            Sin registros de religión
          </div>
        )}
      </motion.div>

      <ChartFooter>
        <p className="text-gray-500 dark:text-neutral-400">
          Total de registros: {afiliados.length}
        </p>
      </ChartFooter>
    </div>
  );
}
