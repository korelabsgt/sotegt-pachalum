"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
  PieChart,
  Pie,
  Rectangle,
} from "recharts";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import type { Afiliado } from "../esquemas";
import { obtenerPoliticasConSubsAction } from "../forms/afiliados/catalogos";
import { INTERESES_CATALOGO_DEMO } from "../datosSimulados";
import {
  CHART_PALETTE,
  ChartTooltip,
  ChartHeader,
  ChartFooter,
} from "./chartTheme";
import { useChartTheme } from "./useChartTheme";

interface Props {
  afiliados: Afiliado[];
  simulacionActiva?: boolean;
}

type DatoSub = { name: string; value: number; color: string };
type CatalogoPolitica = { politica: string; subs: string[] };

function ResumenTotales({
  datos,
  maxTotal,
}: {
  datos: { name: string; value: number; color: string }[];
  maxTotal: number;
}) {
  const theme = useChartTheme();
  const total = datos.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-gray-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-700/80 rounded-xl p-4 md:p-5 shadow-sm w-full">
      <h5 className="text-sm font-black text-gray-800 dark:text-neutral-100 uppercase mb-3 tracking-tight">
        Totales por interés
      </h5>
      <div className="w-full" style={{ height: Math.max(datos.length * 58 + 36, 140) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={datos}
            margin={{ top: 12, right: 24, left: 0, bottom: 12 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke={theme.grid}
              opacity={0.5}
            />
            <XAxis type="number" hide domain={[0, maxTotal || "auto"]} />
            <YAxis type="category" dataKey="name" width={10} tick={false} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: theme.cursor, radius: 8 }} />
            <Bar
              dataKey="value"
              barSize={22}
              shape={(rawProps: unknown) => {
                const { x = 0, y = 0, width = 0, height = 0, index = 0 } = rawProps as {
                  x?: number;
                  y?: number;
                  width?: number;
                  height?: number;
                  index?: number;
                };
                const entry = datos[index];
                return (
                  <Rectangle
                    x={x}
                    y={y - 12}
                    width={width}
                    height={height}
                    fill={entry?.color ?? CHART_PALETTE[0]}
                    radius={[0, 10, 10, 0]}
                  />
                );
              }}
            >
              {datos.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
              <LabelList
                dataKey="name"
                content={(props: { x?: string | number; y?: string | number; index?: number }) => {
                  const x = Number(props.x ?? 0);
                  const y = Number(props.y ?? 0);
                  const index = props.index ?? 0;
                  const item = datos[index];
                  if (!item) return null;

                  const percent = total > 0 ? (item.value / total) * 100 : 0;

                  return (
                    <text
                      x={x}
                      y={y + 24}
                      fill={theme.tick}
                      fontSize={9}
                      className="uppercase"
                      textAnchor="start"
                    >
                      <tspan fontWeight="600" fill={theme.tick}>
                        {item.name}
                      </tspan>
                      <tspan dx={6} fontSize={13} fontWeight="900" fill={item.color}>
                        {item.value}
                      </tspan>
                      <tspan fontWeight="500" fontSize={10} fill={theme.labelMuted}>
                        {" "}
                        · {percent.toFixed(0)}%
                      </tspan>
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniInteres({
  titulo,
  datos,
  total,
  maxTotal,
  colorAccent,
  index,
}: {
  titulo: string;
  datos: DatoSub[];
  total: number;
  maxTotal: number;
  colorAccent: string;
  index: number;
}) {
  const theme = useChartTheme();
  const [activo, setActivo] = useState<string | null>(null);
  const datosDonut = datos.filter((d) => d.value > 0);
  const porcentajeTotal = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  const itemActivo = datosDonut.find((d) => d.name === activo) ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className="bg-gray-50 dark:bg-neutral-800/40 border border-gray-200 dark:border-neutral-700/80 rounded-xl p-4 md:p-5 shadow-sm flex flex-col w-full gap-4"
    >
      <h5
        className="text-sm font-black uppercase tracking-tight"
        style={{ color: colorAccent }}
      >
        {titulo}
      </h5>

      <div className="w-full">
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-xs font-bold text-gray-700 dark:text-neutral-300 tabular-nums">
            Total del programa:{" "}
            <span className="font-black" style={{ color: colorAccent }}>
              {total}
            </span>
          </span>
          <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-500 tabular-nums uppercase tracking-wide shrink-0">
            {porcentajeTotal.toFixed(0)}% del máximo
          </span>
        </div>
        <div className="relative w-full h-3 bg-gray-200/80 dark:bg-neutral-700/50 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(porcentajeTotal, total > 0 ? 4 : 0)}%` }}
            transition={{ duration: 0.7, delay: index * 0.06 + 0.15, ease: "easeOut" }}
            style={{
              background: `linear-gradient(90deg, ${colorAccent}, ${colorAccent}cc)`,
            }}
          />
        </div>
      </div>

      {datosDonut.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: index * 0.06 + 0.2, ease: "easeOut" }}
          className="flex flex-col xl:flex-row gap-4 xl:gap-6 w-full items-stretch"
        >
          <div className="relative w-full max-w-[220px] h-[220px] shrink-0 mx-auto xl:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius="56%"
                  outerRadius="88%"
                  paddingAngle={5}
                  cornerRadius={10}
                  dataKey="value"
                  stroke={theme.stroke}
                  strokeWidth={4}
                  onMouseEnter={(_, i) => setActivo(datosDonut[i]?.name ?? null)}
                  onMouseLeave={() => setActivo(null)}
                >
                  {datosDonut.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      opacity={activo === null || activo === entry.name ? 1 : 0.3}
                      style={{ transition: "opacity 0.3s ease" }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

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
          </div>

          <div className="flex-1 rounded-2xl bg-violet-50/80 dark:bg-neutral-800/50 border border-violet-100 dark:border-neutral-700/60 p-4 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 text-center mb-2">
              Desglose
            </p>
            {datos.map((d, i) => {
              const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : "0";
              const esActivo = activo === d.name;
              return (
                <motion.div
                  key={d.name}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.06 + 0.28 + i * 0.05 }}
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
        </motion.div>
      ) : (
        <div className="py-6 text-center text-xs text-gray-400 dark:text-neutral-500 italic">
          Sin sub-programas
        </div>
      )}
    </motion.div>
  );
}

function construirCatalogo(
  base: CatalogoPolitica[],
  conteo: Record<string, Record<string, number>>,
): CatalogoPolitica[] {
  const mapa = new Map(base.map((p) => [p.politica, [...p.subs]]));

  Object.entries(conteo).forEach(([politica, subsConteo]) => {
    const existente = mapa.get(politica) ?? [];
    const subs = new Set(existente);
    Object.keys(subsConteo).forEach((s) => subs.add(s));
    mapa.set(politica, [...subs]);
  });

  return [...mapa.entries()].map(([politica, subs]) => ({
    politica,
    subs: subs.filter((s) => s !== "Sin sub-programa"),
  }));
}

export default function Politicas({ afiliados, simulacionActiva = false }: Props) {
  const { data: catalogoApi = [], isPending } = useQuery({
    queryKey: ["politicas-con-subs"],
    queryFn: () => obtenerPoliticasConSubsAction(),
    enabled: !simulacionActiva,
    staleTime: 5 * 60_000,
  });

  const { chartDataMap, sinDefinir, catalogoVisible, resumenTotales, maxTotal } = useMemo(() => {
    const conteo: Record<string, Record<string, number>> = {};
    let sinDefinir = 0;

    afiliados.forEach((af) => {
      const politica = af.politica || null;
      if (!politica) {
        sinDefinir++;
        return;
      }
      const sub = af.sub_politica || "Sin sub-programa";
      if (!conteo[politica]) conteo[politica] = {};
      conteo[politica][sub] = (conteo[politica][sub] || 0) + 1;
    });

    const baseCatalogo = simulacionActiva ? INTERESES_CATALOGO_DEMO : catalogoApi;
    const catalogo = construirCatalogo(baseCatalogo, conteo);

    const chartDataMap: Record<
      string,
      { datos: DatoSub[]; total: number; color: string }
    > = {};

    catalogo.forEach((pol: CatalogoPolitica, polIdx: number) => {
      const subsFromDB = pol.subs.length > 0 ? pol.subs : ["Sin sub-programa"];
      const conteoForPol = conteo[pol.politica] || {};

      const extraSubs = Object.keys(conteoForPol).filter((s) => !subsFromDB.includes(s));
      const allSubs = [...subsFromDB, ...extraSubs];

      let total = 0;
      const datos = allSubs.map((sub, i) => {
        const value = conteoForPol[sub] || 0;
        total += value;
        return { name: sub, value, color: CHART_PALETTE[i % CHART_PALETTE.length] };
      });

      chartDataMap[pol.politica] = {
        datos,
        total,
        color: CHART_PALETTE[polIdx % CHART_PALETTE.length],
      };
    });

    const catalogoVisible = simulacionActiva
      ? catalogo
      : catalogo.filter((pol) => (chartDataMap[pol.politica]?.total ?? 0) > 0);

    const resumenTotales = catalogoVisible
      .map((pol) => {
        const entry = chartDataMap[pol.politica];
        return {
          name: pol.politica,
          value: entry?.total ?? 0,
          color: entry?.color ?? CHART_PALETTE[0],
        };
      })
      .sort((a, b) => b.value - a.value);

    const maxTotal = Math.max(...resumenTotales.map((d) => d.value), 1);

    return { chartDataMap, sinDefinir, catalogoVisible, resumenTotales, maxTotal };
  }, [afiliados, catalogoApi, simulacionActiva]);

  const cargando = !simulacionActiva && isPending;

  return (
    <div className="w-full flex flex-col gap-5">
      <ChartHeader
        title="Intereses del Grupo"
        subtitle="Distribución por programa e interés específico"
      />

      {cargando ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400 dark:text-neutral-500 font-bold uppercase animate-pulse">
            Cargando catálogos...
          </p>
        </div>
      ) : catalogoVisible.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-gray-400 dark:text-neutral-500 font-bold uppercase">
            Sin intereses registrados
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5 w-full">
          {resumenTotales.length > 1 && (
            <ResumenTotales datos={resumenTotales} maxTotal={maxTotal} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
            {catalogoVisible.map((pol, idx) => {
              const data = chartDataMap[pol.politica] || {
                datos: [],
                total: 0,
                color: CHART_PALETTE[0],
              };
              return (
                <MiniInteres
                  key={pol.politica}
                  index={idx}
                  titulo={pol.politica}
                  datos={data.datos}
                  total={data.total}
                  maxTotal={maxTotal}
                  colorAccent={data.color}
                />
              );
            })}
          </div>
        </div>
      )}

      <ChartFooter>
        <p className="text-gray-500 dark:text-neutral-400 mb-1">
          Total de registros evaluados: {afiliados.length}
          {simulacionActiva && " · vista simulada"}
        </p>
        {sinDefinir > 0 && (
          <span className="text-gray-400 dark:text-neutral-500">
            Sin interés seleccionado: {sinDefinir}
          </span>
        )}
      </ChartFooter>
    </div>
  );
}
