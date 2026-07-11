"use client";

import { useState, Fragment, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { obtenerConfiguracionAction } from "../dashboard/actions/configuracion";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  Lock,
  User,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { eliminar } from "./acciones";
import { obtenerConteoPadronAction } from "./actions/afiliados";
import { calcularNivelCompromiso } from "@/lib/nivelCompromiso";
import { swalNoEliminarCelula } from "@/lib/swalTheme";

export interface Lider {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: string;
  rol_id?: number;
  conteoAfiliados?: number;
  conteoTitulares?: number;
  conteoFamiliares?: number;
  simulado?: boolean;
}

interface Props {
  lideres: Lider[];
  onVerCelula: (lider: Lider) => void;
  onEditar: (lider: Lider) => void;
  rolUsuarioSesion: string;
  onDataChange: () => void;
  searchTerm: string;
  idUsuarioSesion: string;
  isLoading?: boolean;
  hideMeta?: boolean;
  showRole?: boolean;
}

function LideresSkeleton({ esAdminOSuper }: { esAdminOSuper: boolean }) {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-20 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg p-4 flex items-center gap-4"
        >
          <div className="h-10 w-10 bg-gray-100 dark:bg-neutral-800 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-gray-100 dark:bg-neutral-800 rounded"></div>
            <div className="h-3 w-1/4 bg-gray-50 dark:bg-neutral-800/50 rounded"></div>
          </div>
          <div className="h-10 w-24 bg-gray-100 dark:bg-neutral-800 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

export default function Lideres({
  lideres,
  onVerCelula,
  onEditar,
  rolUsuarioSesion,
  onDataChange,
  searchTerm,
  idUsuarioSesion,
  isLoading = false,
  hideMeta = false,
  showRole = false,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);
  const [liderAbiertoId, setLiderAbiertoId] = useState<string | null>(null);

  const isLider = rolUsuarioSesion === "LIDER";
  const esAdminOSuper =
    rolUsuarioSesion === "ADMINISTRADOR" ||
    rolUsuarioSesion === "SUPER" ||
    rolUsuarioSesion === "ADMIN";

  const { data: config } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const { data: conteoPadron = 0 } = useQuery({
    queryKey: ["conteo_padron"],
    queryFn: () => obtenerConteoPadronAction(),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const OBJETIVO_GENERAL = config?.objetivo_total || 0;
  const META_POR_LIDER = config?.meta_por_lider || 0;
  const META_CELULA = config?.meta_por_lider ?? config?.meta_celula ?? 15;
  const META_MINIMA = config?.meta_celula_minima ?? 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const totalAfiliadosGeneral = useMemo(
    () => lideres.reduce((acc, curr) => acc + (curr.conteoAfiliados || 0), 0),
    [lideres],
  );

  const progresoGeneral = useMemo(
    () =>
      OBJETIVO_GENERAL > 0
        ? Math.min((totalAfiliadosGeneral / OBJETIVO_GENERAL) * 100, 100)
        : 0,
    [totalAfiliadosGeneral, OBJETIVO_GENERAL],
  );

  const lideresRequeridos = useMemo(
    () =>
      OBJETIVO_GENERAL > 0 && META_POR_LIDER > 0
        ? Math.ceil(OBJETIVO_GENERAL / META_POR_LIDER)
        : 0,
    [OBJETIVO_GENERAL, META_POR_LIDER],
  );

  const progresoLideres = useMemo(
    () =>
      lideresRequeridos > 0
        ? Math.min((lideres.length / lideresRequeridos) * 100, 100)
        : 0,
    [lideres.length, lideresRequeridos],
  );

  const sortedLideres = useMemo(
    () =>
      [...lideres].sort((a, b) => {
        if (a.simulado) return -1;
        if (b.simulado) return 1;
        if (a.id === idUsuarioSesion) return -1;
        if (b.id === idUsuarioSesion) return 1;
        return (b.conteoAfiliados || 0) - (a.conteoAfiliados || 0);
      }),
    [lideres, idUsuarioSesion],
  );

  const filteredLideres = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sortedLideres.filter((lider) => {
      const fullName = `${lider.nombres} ${lider.apellidos}`.toLowerCase();
      const email = lider.email.toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }, [sortedLideres, searchTerm]);

  const effectiveItemsPerPage = useMemo(
    () => (itemsPerPage === "all" ? filteredLideres.length : itemsPerPage),
    [itemsPerPage, filteredLideres.length],
  );

  const totalPages = useMemo(
    () => Math.ceil(filteredLideres.length / (effectiveItemsPerPage || 1)),
    [filteredLideres.length, effectiveItemsPerPage],
  );

  const startIndex = (currentPage - 1) * (effectiveItemsPerPage as number);

  const lideresPaginados = useMemo(
    () =>
      itemsPerPage === "all"
        ? filteredLideres
        : filteredLideres.slice(
            startIndex,
            startIndex + (effectiveItemsPerPage as number),
          ),
    [filteredLideres, startIndex, effectiveItemsPerPage, itemsPerPage],
  );

  if (isLoading) return <LideresSkeleton esAdminOSuper={esAdminOSuper} />;

  const getFondoCard = (lider: Lider) =>
    lider.id === idUsuarioSesion
      ? "bg-blue-50/50 dark:bg-blue-950/40"
      : "bg-white dark:bg-neutral-900";

  return (
    <>
      {!hideMeta && (
        <div className="w-full mb-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs md:text-xl font-bold uppercase text-gray-600 dark:text-gray-400 font-sans">
              Meta General de Afiliación:
            </span>
            <span className="text-sm md:text-xl font-black text-blue-700 dark:text-blue-400">
              {totalAfiliadosGeneral.toLocaleString()} /{" "}
              {OBJETIVO_GENERAL.toLocaleString()}{" "}
              <span className="text-gray-500 dark:text-gray-400 font-bold ml-1">
                ({progresoGeneral.toFixed(1)}%)
              </span>
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-6 border-2 border-white dark:border-neutral-900 shadow-inner overflow-hidden flex items-center relative font-sans">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progresoGeneral}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-blue-600 h-full shadow-[inset_0px_0px_10px_rgba(0,0,0,0.2)]"
            />
          </div>
        </div>
      )}

      <div className="flex flex-row flex-wrap justify-between items-center gap-x-3 gap-y-1 mb-2 px-2">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight whitespace-nowrap">
          <span className="text-gray-500 dark:text-gray-400">Líderes registrados:</span>{" "}
          <span className="text-blue-600 dark:text-blue-400">
            {lideres.length} de {lideresRequeridos.toLocaleString()} (
            {progresoLideres.toFixed(1)}%)
          </span>
        </span>
        {!hideMeta && conteoPadron > 0 && esAdminOSuper && (
          <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right sm:ml-auto leading-tight">
            Empadronados TSE:{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {conteoPadron.toLocaleString()}
            </span>{" "}
            • Meta{" "}
            <span className="text-blue-600 dark:text-blue-400">
              {OBJETIVO_GENERAL.toLocaleString()}
            </span>{" "}
            ={" "}
            <span className="text-blue-600 dark:text-blue-400">
              {(OBJETIVO_GENERAL > 0
                ? (OBJETIVO_GENERAL / conteoPadron) * 100
                : 0
              ).toFixed(1)}
              %
            </span>{" "}
            del padrón
          </span>
        )}
      </div>

      {/* Lista de Tarjetas en una sola columna */}
      <div className="flex flex-col gap-3">
        {lideresPaginados.map((lider, index) => {
          const totalEnGrupo = lider.conteoAfiliados || 0;
          const progreso = Math.min((totalEnGrupo / META_CELULA) * 100, 100);
          const tieneAfiliados = totalEnGrupo > 0;
          const {
            nivel: nivelCompromiso,
            colorBarra,
            textoColor,
            bordeCard,
          } = calcularNivelCompromiso(
            totalEnGrupo,
            META_CELULA,
            META_MINIMA,
            lider.nombres,
          );

          return (
            <div
              key={lider.id}
              className={`flex flex-col md:flex-row items-stretch md:items-center border-2 rounded-lg overflow-hidden transition-colors duration-300 ${bordeCard} ${getFondoCard(lider)}`}
            >
              <div
                className={`flex-1 p-4 flex flex-col md:flex-row md:items-stretch min-w-0 ${isLider && lider.id !== idUsuarioSesion ? "cursor-default" : "cursor-pointer"}`}
                onClick={() => {
                  if (
                    rolUsuarioSesion === "LIDER" &&
                    lider.id !== idUsuarioSesion
                  )
                    return;
                  if (window.innerWidth < 768 && rolUsuarioSesion !== "LIDER") {
                    setLiderAbiertoId(
                      liderAbiertoId === lider.id ? null : lider.id,
                    );
                  } else {
                    onVerCelula(lider);
                  }
                }}
              >
                <div className="flex items-center gap-3 shrink-0 md:pr-4 md:border-r border-gray-100 dark:border-neutral-700 md:self-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-xs font-black text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 shrink-0">
                    {startIndex + index + 1}
                  </div>
                  <div className="min-w-0 max-w-[11rem] sm:max-w-[14rem]">
                    <h3
                      className={`font-black text-sm md:text-base leading-tight ${lider.id === idUsuarioSesion ? "text-blue-900 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}`}
                    >
                      <span className="block truncate">{lider.nombres}</span>
                      <span
                        className={`block truncate font-bold ${lider.id === idUsuarioSesion ? "text-blue-800/80 dark:text-blue-400/90" : "text-slate-600 dark:text-slate-300"}`}
                      >
                        {lider.apellidos}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 italic lowercase truncate">
                        {lider.email}
                      </p>
                      {showRole && (
                        <span className="text-[8px] bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0">
                          {lider.rol}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 w-full flex flex-col justify-center md:pl-4 pt-3 md:pt-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-2">
                    <span className="text-[10px] md:text-sm lg:text-base font-black text-gray-400 dark:text-gray-500 uppercase">
                      Nivel de compromiso:{" "}
                      <span className={textoColor}>{nivelCompromiso}</span>
                    </span>
                    <div className="flex items-center gap-2 flex-wrap justify-end pb-0.5">
                      <div
                        className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800"
                        title="Titulares"
                      >
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden md:inline text-[10px] font-black text-blue-600 uppercase">
                          Titulares
                        </span>
                        <span className="text-sm font-black text-blue-700 dark:text-blue-400">
                          {lider.conteoTitulares || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/50 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-800"
                        title="Familiares"
                      >
                        <Heart className="w-3.5 h-3.5 text-purple-600" />
                        <span className="hidden md:inline text-[10px] font-black text-purple-600 uppercase">
                          Familiares
                        </span>
                        <span className="text-sm font-black text-purple-700 dark:text-purple-400">
                          {lider.conteoFamiliares || 0}
                        </span>
                      </div>
                      <span
                        className={`text-sm md:text-base font-black ${textoColor}`}
                      >
                        {totalEnGrupo}/{META_CELULA}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-4 border border-gray-200 dark:border-neutral-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progreso}%` }}
                      className={`${colorBarra} h-full rounded-full`}
                    />
                  </div>
                </div>

                <div className="md:hidden flex justify-center pt-2">
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${liderAbiertoId === lider.id ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {rolUsuarioSesion !== "LIDER" && (
                <div className="hidden md:flex items-center gap-4 px-4 py-2 border-l border-gray-100 dark:border-neutral-700">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-[10px] font-bold uppercase transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditar(lider);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-red-500 dark:text-red-400 hover:underline text-[10px] font-bold uppercase transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tieneAfiliados) {
                        swalNoEliminarCelula();
                      } else {
                        eliminar(lider, onDataChange);
                      }
                    }}
                    title="Eliminar líder"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              )}

              {/* Acordeón Móvil */}
              <AnimatePresence>
                {liderAbiertoId === lider.id &&
                  rolUsuarioSesion !== "LIDER" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="md:hidden border-t border-gray-100 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 flex divide-x divide-gray-100 dark:divide-neutral-700"
                    >
                      <Button
                        variant="ghost"
                        className="flex-1 text-gray-700 py-4 font-bold uppercase text-[10px] rounded-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVerCelula(lider);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Ver
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 text-blue-600 py-4 font-bold uppercase text-[10px] rounded-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(lider);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" /> Editar Líder
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 py-4 font-bold uppercase text-[10px] rounded-none text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (tieneAfiliados) {
                            swalNoEliminarCelula();
                          } else {
                            eliminar(lider, onDataChange);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Borrar
                      </Button>
                    </motion.div>
                  )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Paginación */}
      <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 md:gap-6 mt-8 w-full px-1">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-gray-200 dark:border-neutral-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 transition-all shadow-sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || itemsPerPage === "all"}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="bg-white dark:bg-neutral-900 px-3 sm:px-4 py-2 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm min-w-[88px] sm:min-w-[120px] text-center">
            <span className="text-sm font-black text-gray-900 dark:text-gray-100">
              {currentPage} / {totalPages || 1}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border-gray-200 dark:border-neutral-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 transition-all shadow-sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || itemsPerPage === "all"}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 px-3 sm:px-4 py-2 rounded-lg border border-gray-100 dark:border-neutral-700 shadow-sm shrink-0">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const val = e.target.value;
              setItemsPerPage(val === "all" ? "all" : parseInt(val));
            }}
            className="text-sm font-black outline-none bg-transparent cursor-pointer uppercase text-blue-600 focus:ring-0"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>
    </>
  );
}
