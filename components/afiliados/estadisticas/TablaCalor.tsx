"use client";

import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { descargarExcelAoA, descargarExcelMultiplesHojas } from "../reportes/descargarExcel";
import type { FilaTablaCalor, TablaCalorData } from "./datosTablaCalor";
import { useIsDarkMode } from "./useChartTheme";

function colorCelda(valor: number, max: number, oscuro: boolean): string {
  if (valor <= 0 || max <= 0) {
    return oscuro ? "rgba(38, 38, 38, 0.5)" : "rgba(243, 244, 246, 0.9)";
  }
  const t = Math.min(valor / max, 1);
  if (oscuro) {
    const r = Math.round(30 + t * 40);
    const g = Math.round(58 + t * 120);
    const b = Math.round(138 + t * 80);
    return `rgba(${r}, ${g}, ${b}, ${0.35 + t * 0.55})`;
  }
  const r = Math.round(219 - t * 120);
  const g = Math.round(234 - t * 60);
  const b = Math.round(254 - t * 20);
  return `rgba(${r}, ${g}, ${b}, ${0.55 + t * 0.45})`;
}

function agruparFilas(filas: FilaTablaCalor[]): FilaTablaCalor[][] {
  const grupos: FilaTablaCalor[][] = [];
  let actual: FilaTablaCalor[] = [];

  filas.forEach((fila) => {
    actual.push(fila);
    if (fila.esTotal) {
      grupos.push(actual);
      actual = [];
    }
  });

  if (actual.length > 0) grupos.push(actual);
  return grupos;
}

function dividirFilasEnColumnas(filas: FilaTablaCalor[]): FilaTablaCalor[][] {
  const grupos = agruparFilas(filas);
  const mitad = Math.ceil(grupos.length / 2);
  return [
    grupos.slice(0, mitad).flat(),
    grupos.slice(mitad).flat(),
  ].filter((columna) => columna.length > 0);
}

function TablaCalorCuerpo({
  filas,
  columnas,
  max,
  oscuro,
}: {
  filas: FilaTablaCalor[];
  columnas: string[];
  max: number;
  oscuro: boolean;
}) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-gray-100 dark:bg-neutral-800">
          <th className="text-left px-3 py-2.5 font-black uppercase text-[10px] text-gray-600 dark:text-neutral-400 border-b border-gray-200 dark:border-neutral-700 sticky left-0 bg-gray-100 dark:bg-neutral-800 z-10 min-w-[120px]">
            Categoría
          </th>
          {columnas.map((col) => (
            <th
              key={col}
              className="text-center px-3 py-2.5 font-black uppercase text-[10px] text-gray-600 dark:text-neutral-400 border-b border-l border-gray-200 dark:border-neutral-700 whitespace-nowrap min-w-[72px]"
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, idx) => (
          <tr
            key={`${fila.etiqueta}-${idx}`}
            className={`border-b border-gray-100 dark:border-neutral-800 last:border-b-0 ${
              fila.esTotal ? "bg-blue-50/80 dark:bg-blue-950/25" : ""
            }`}
          >
            <td
              className={`px-3 py-2 font-semibold sticky left-0 z-[1] border-r border-gray-100 dark:border-neutral-800 max-w-[220px] ${
                fila.esTotal
                  ? "text-blue-600 dark:text-blue-400 font-black bg-blue-50/80 dark:bg-blue-950/25"
                  : "text-gray-800 dark:text-neutral-200 bg-white dark:bg-neutral-900/80"
              }`}
            >
              <span className="line-clamp-2">{fila.etiqueta}</span>
            </td>
            {fila.celdas.map((valor, i) => (
              <td
                key={`${fila.etiqueta}-${idx}-${i}`}
                className={`px-3 py-2 text-center font-black tabular-nums border-l border-gray-100 dark:border-neutral-800 transition-colors duration-300 ${
                  fila.esTotal
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/25"
                    : "text-gray-900 dark:text-neutral-100"
                }`}
                style={
                  fila.esTotal
                    ? undefined
                    : { backgroundColor: colorCelda(valor, max, oscuro) }
                }
              >
                {valor > 0 ? valor : "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface Props {
  data: TablaCalorData;
}

export default function TablaCalor({ data }: Props) {
  const oscuro = useIsDarkMode();

  const max = useMemo(
    () =>
      Math.max(
        ...data.filas.filter((f) => !f.esTotal).flatMap((f) => f.celdas),
        1,
      ),
    [data],
  );

  const columnasFilas = useMemo(
    () =>
      data.dividirGruposEnColumnas ? dividirFilasEnColumnas(data.filas) : null,
    [data.dividirGruposEnColumnas, data.filas],
  );

  const descargar = () => {
    if (data.hojasExcel?.length) {
      descargarExcelMultiplesHojas({
        nombreArchivoBase: data.nombreArchivo,
        hojas: data.hojasExcel,
      });
      return;
    }

    const filasExcel: (string | number)[][] = [
      ["Categoría", ...data.columnas],
      ...data.filas.map((f) => [f.etiqueta, ...f.celdas]),
    ];
    descargarExcelAoA({
      nombreArchivoBase: data.nombreArchivo,
      nombreHoja: data.nombreHoja,
      filas: filasExcel,
    });
  };

  if (data.filas.length === 0) return null;

  const tablaProps = {
    columnas: data.columnas,
    max,
    oscuro,
  };

  const renderTabla = (filas: FilaTablaCalor[]) => (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-neutral-700 w-full">
      <TablaCalorCuerpo filas={filas} {...tablaProps} />
    </div>
  );

  return (
    <div className="pt-5 border-t border-gray-200 dark:border-neutral-800">
      <div
        className={`w-full mx-auto flex flex-col gap-3 ${
          data.dividirGruposEnColumnas
            ? "lg:max-w-full"
            : "lg:w-fit lg:min-w-[50%] lg:max-w-full"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
          <h6 className="text-xs font-black uppercase tracking-wide text-gray-700 dark:text-neutral-300">
            {data.titulo}
          </h6>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={descargar}
            className="gap-2 text-xs font-bold uppercase shrink-0 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400 bg-green-50/90 dark:bg-green-950/45 hover:bg-green-100 dark:hover:bg-green-950/65 shadow-none"
          >
            <Download className="w-4 h-4" />
            Descargar Excel
          </Button>
        </div>

        {columnasFilas && columnasFilas.length > 1 ? (
          <>
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4 w-full">
              {columnasFilas.map((filasCol, i) => (
                <div key={i}>{renderTabla(filasCol)}</div>
              ))}
            </div>
            <div className="lg:hidden w-full">{renderTabla(data.filas)}</div>
          </>
        ) : (
          renderTabla(data.filas)
        )}
      </div>
    </div>
  );
}
