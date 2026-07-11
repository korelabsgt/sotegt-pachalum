"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Users, Target, MapPin, HeartPulse, Church } from "lucide-react";
import type { Afiliado } from "../esquemas";
import { AFILIADOS_ESTADISTICAS_DEMO } from "../datosSimulados";
import { Switch } from "@/components/ui/Switch";
import EstadisticasEdades from "./Edades";
import EstadisticasLugares from "./Lugares";
import EstadisticasCondicionEspecial from "./CondicionEspecial";
import EstadisticasReligiones from "./Religion";
import EstadisticasIntereses from "./Politicas";
import TablaCalor from "./TablaCalor";
import {
  buildTablaCondicion,
  buildTablaEdades,
  buildTablaIntereses,
  buildTablaReligion,
  buildTablaUbicacion,
  buildTablaUbicacionMatriz,
} from "./datosTablaCalor";

const TABS = [
  { id: "edades", label: "Edades", icon: Users },
  { id: "intereses", label: "Intereses", icon: Target },
  { id: "ubicacion", label: "Ubicación", icon: MapPin },
  { id: "condicion", label: "Condición", icon: HeartPulse },
  { id: "religion", label: "Religión", icon: Church },
] as const satisfies ReadonlyArray<{ id: string; label: string; icon: LucideIcon }>;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  afiliados: Afiliado[];
  mostrarOpcionSimular?: boolean;
}

export default function EstadisticasTabs({
  afiliados,
  mostrarOpcionSimular = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("edades");
  const [simularRegistros, setSimularRegistros] = useState(false);

  useEffect(() => {
    if (!mostrarOpcionSimular) setSimularRegistros(false);
  }, [mostrarOpcionSimular]);

  const simulacionActiva = mostrarOpcionSimular && simularRegistros;

  const afiliadosEfectivos = useMemo(
    () => (simulacionActiva ? AFILIADOS_ESTADISTICAS_DEMO : afiliados),
    [simulacionActiva, afiliados],
  );

  const tablas = useMemo(() => {
    const lugaresUnicos = new Set(
      afiliadosEfectivos.map((a) => a.lugar_nombre || "Sin especificar"),
    ).size;

    return {
      edades: buildTablaEdades(afiliadosEfectivos),
      intereses: buildTablaIntereses(afiliadosEfectivos),
      ubicacion:
        lugaresUnicos <= 12
          ? buildTablaUbicacionMatriz(afiliadosEfectivos)
          : buildTablaUbicacion(afiliadosEfectivos),
      condicion: buildTablaCondicion(afiliadosEfectivos),
      religion: buildTablaReligion(afiliadosEfectivos),
    };
  }, [afiliadosEfectivos]);

  const panelClass =
    "bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 md:p-6 shadow-sm dark:shadow-lg dark:shadow-black/20 w-full";

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-3 w-full">
        <div className="w-full lg:w-auto overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600">
          <div className="flex bg-gray-200 dark:bg-neutral-800 p-1 rounded-lg gap-1 w-full lg:w-auto lg:inline-flex min-w-full lg:min-w-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 px-3 md:px-4 rounded-md text-[10px] md:text-xs font-bold transition-all shrink-0 whitespace-nowrap min-w-[4.75rem] ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-neutral-600"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {mostrarOpcionSimular && (
          <label className="flex cursor-pointer select-none items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 px-4 py-2.5 shrink-0 shadow-sm w-full sm:w-auto justify-center lg:justify-start mx-auto lg:mx-0">
            <Switch checked={simularRegistros} onCheckedChange={setSimularRegistros} />
            <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-gray-800 dark:text-neutral-200">
              Simular
            </span>
          </label>
        )}
      </div>

      {simulacionActiva && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400/90 text-center w-full">
          Vista simulada · {afiliadosEfectivos.length} registros de demostración
        </p>
      )}

      <div className="w-full">
        {activeTab === "edades" && (
          <div className={`${panelClass} min-h-[min(520px,70vh)] flex flex-col`}>
            <EstadisticasEdades afiliados={afiliadosEfectivos} />
            <TablaCalor data={tablas.edades} />
          </div>
        )}

        {activeTab === "intereses" && (
          <div className={panelClass}>
            <EstadisticasIntereses
              afiliados={afiliadosEfectivos}
              simulacionActiva={simulacionActiva}
            />
            <TablaCalor data={tablas.intereses} />
          </div>
        )}

        {activeTab === "ubicacion" && (
          <div className={panelClass}>
            <EstadisticasLugares afiliados={afiliadosEfectivos} />
            <TablaCalor data={tablas.ubicacion} />
          </div>
        )}

        {activeTab === "condicion" && (
          <div className={panelClass}>
            <EstadisticasCondicionEspecial afiliados={afiliadosEfectivos} />
            <TablaCalor data={tablas.condicion} />
          </div>
        )}

        {activeTab === "religion" && (
          <div className={`${panelClass} min-h-[min(520px,70vh)] flex flex-col`}>
            <EstadisticasReligiones afiliados={afiliadosEfectivos} />
            <TablaCalor data={tablas.religion} />
          </div>
        )}
      </div>
    </div>
  );
}
