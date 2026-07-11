"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  CartesianGrid,
  Rectangle,
} from "recharts";
import type { Afiliado } from "../esquemas";
import {
  ChartTooltip,
  ChartHeader,
  ChartFooter,
} from "./chartTheme";
import { useChartTheme } from "./useChartTheme";
import { useId } from "react";

interface Props {
  afiliados: Afiliado[];
}

export default function CondicionEspecial({ afiliados }: Props) {
  const theme = useChartTheme();
  const uid = useId().replace(/:/g, "");
  const gradCondicion = `gradCondicion-${uid}`;

  const conteo: Record<string, number> = {};

  afiliados.forEach((afiliado) => {
    const condicion = afiliado.condicion_especial || "Sin Especificar";
    conteo[condicion] = (conteo[condicion] || 0) + 1;
  });

  const datosRaw = Object.entries(conteo)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const datos =
    datosRaw.length > 0 ? datosRaw : [{ name: "Sin registros", value: 1 }];

  const hasData = datosRaw.length > 0;

  return (
    <div className="w-full h-full flex flex-col">
      <ChartHeader
        title="Condición Especial"
        subtitle="Distribución de condiciones especiales"
      />

      <div className="flex-1 w-full overflow-x-auto overflow-y-hidden pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        <div
          className="w-full md:min-w-[520px]"
          style={{ height: Math.max(datos.length * 58 + 36, 140) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={datos}
              margin={{ top: 12, right: 24, left: 0, bottom: 12 }}
            >
              <defs>
                <linearGradient id={gradCondicion} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity={1} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0.85} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke={theme.grid}
                opacity={0.5}
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={10}
                tick={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip accent="#14b8a6" />}
                cursor={{ fill: theme.cursor, radius: 8 }}
              />
              <Bar
                dataKey="value"
                barSize={22}
                fill={hasData ? `url(#${gradCondicion})` : theme.empty}
                shape={(props: { x?: number; y?: number; width?: number; height?: number }) => {
                  const { x = 0, y = 0, width = 0, height = 0 } = props;
                  return (
                    <Rectangle
                      x={x}
                      y={y - 12}
                      width={width}
                      height={height}
                      fill={hasData ? `url(#${gradCondicion})` : theme.empty}
                      radius={[0, 10, 10, 0]}
                    />
                  );
                }}
              >
                <LabelList
                  dataKey="name"
                  content={(props: { x?: string | number; y?: string | number; index?: number }) => {
                    const x = Number(props.x ?? 0);
                    const y = Number(props.y ?? 0);
                    const index = props.index ?? 0;
                    const item = datos[index];
                    if (!item) return null;

                    const total = afiliados.length;
                    const percent = total > 0 ? (item.value / total) * 100 : 0;

                    return (
                      <text
                        x={x}
                        y={y + 24}
                        fill={hasData ? theme.tick : theme.labelMuted}
                        fontSize={9}
                        className="uppercase"
                        textAnchor="start"
                      >
                        {hasData && (
                          <>
                            <tspan fontSize={13} fontWeight="900" fill={theme.labelTeal}>
                              {item.value}
                            </tspan>
                            <tspan fontWeight="500" fontSize={10} fill={theme.labelMuted}>
                              {" "}
                              · {percent.toFixed(0)}%
                            </tspan>
                          </>
                        )}
                        <tspan dx={hasData ? 6 : 0} fontWeight="600" fill={theme.tick}>
                          {item.name}
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

      <ChartFooter>
        <p className="text-gray-500 dark:text-neutral-400">
          Total de registros: {afiliados.length}
        </p>
      </ChartFooter>
    </div>
  );
}
