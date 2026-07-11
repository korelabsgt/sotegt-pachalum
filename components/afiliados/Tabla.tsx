"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Hash,
  XCircle,
  MessageCircle,
  Phone,
  Crown,
  Heart,
  IdCard,
  Download,
  UserPlus,
  Users,
} from "lucide-react";

import { eliminar } from "./acciones";
import type { Afiliado, Lider } from "./esquemas";
import GestionDpiModal from "./GestionDpiModal";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
} from "@headlessui/react";
import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  lider: Lider;
  afiliados: Afiliado[];
  onEditar: (afiliado: Afiliado) => void;
  onAnadirFamiliar?: (titularId: string) => void;
  onDataChange: () => void;
  rolUsuarioSesion: string;
  config?: any;
  totalEnCelula?: number;
  isFamilyView?: boolean;
}

export default function Tabla({
  lider,
  afiliados,
  onEditar,
  onAnadirFamiliar,
  onDataChange,
  rolUsuarioSesion,
  config,
  totalEnCelula,
  isFamilyView = false,
}: Props) {
  const puedeVerAcciones = true;
  const totalAfiliados = totalEnCelula ?? afiliados.length;

  const [gestionDpiAfiliado, setGestionDpiAfiliado] = useState<Afiliado | null>(
    null,
  );
  const [titularVerFamilia, setTitularVerFamilia] = useState<Afiliado | null>(
    null,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const descargarCarnet = (afiliado: Afiliado) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 1000;
    canvas.height = 630;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(30, 30, 100, 10);
    ctx.fillRect(30, 30, 10, 100);
    ctx.fillRect(canvas.width - 130, 30, 100, 10);
    ctx.fillRect(canvas.width - 40, 30, 10, 100);
    ctx.fillStyle = "#1e40af";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CONSTANCIA DE AFILIACIÓN", canvas.width / 2, 75);
    ctx.fillStyle = "#111827";
    ctx.font = "900 40px sans-serif";
    ctx.fillText(
      config?.nombre_candidato?.toUpperCase() || "AFILIACIÓN",
      canvas.width / 2,
      125,
    );
    ctx.beginPath();
    ctx.moveTo(100, 155);
    ctx.lineTo(900, 155);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("NOMBRE DEL AFILIADO:", 100, 210);
    ctx.fillStyle = "#1e40af";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(
      `${afiliado.nombres} ${afiliado.apellidos}`.toUpperCase(),
      100,
      265,
    );
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("DOCUMENTO PERSONAL DE IDENTIFICACIÓN (DPI):", 100, 340);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 38px monospace";
    ctx.fillText(afiliado.dpi || "0000 00000 0000", 100, 390);
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("NO. DE PADRÓN:", 100, 460);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(afiliado.no_padron || "N/A", 100, 505);
    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("MUNICIPIO / LUGAR:", 550, 460);
    ctx.fillStyle = "#111827";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(afiliado.lugar_nombre || config?.lugar || "—", 550, 505);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "italic 18px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(
      `Afiliado el: ${new Date(afiliado.created_at).toLocaleDateString("es-GT")}`,
      900,
      580,
    );
    const link = document.createElement("a");
    link.download = `carnet_${afiliado.nombres.replace(/\s/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const obtenerDpiInfo = (afiliado: Afiliado) => {
    const hasDpi = !!afiliado.dpi_frontal_url || !!afiliado.dpi_reverso_url;
    return {
      color: hasDpi
        ? "text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 hover:text-green-900 dark:hover:text-green-300"
        : "text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 hover:text-blue-900 dark:hover:text-blue-300",
      label: hasDpi ? "Ver DPI" : "Cargar DPI",
    };
  };

  if (afiliados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-neutral-400 bg-gray-50 dark:bg-neutral-900/50 rounded border border-dashed border-gray-300 dark:border-neutral-700">
        <p className="text-sm">No hay afiliados en esta célula aún.</p>
      </div>
    );
  }

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return "—";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  const generarLinkWhatsapp = (telefono: string) => {
    if (!telefono) return "#";
    const numeroLimpio = telefono.replace(/\D/g, "");
    const numeroFinal =
      numeroLimpio.length === 8 ? `502${numeroLimpio}` : numeroLimpio;
    return `https://wa.me/${numeroFinal}`;
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "—";
    const d = new Date(fecha);
    const dias = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    const diaSemana = dias[d.getDay()];
    const dia = d.getDate().toString().padStart(2, "0");
    const mes = (d.getMonth() + 1).toString().padStart(2, "0");
    const anio = d.getFullYear().toString().slice(-2);
    let horas = d.getHours();
    const minutos = d.getMinutes().toString().padStart(2, "0");
    const ampm = horas >= 12 ? "PM" : "AM";
    horas = horas % 12;
    horas = horas ? horas : 12;
    const horasStr = horas.toString().padStart(2, "0");

    return `${diaSemana} ${dia}/${mes}/${anio}, ${horasStr}:${minutos} ${ampm}`;
  };

  const titulares = isFamilyView
    ? afiliados
    : afiliados.filter((a) => !a.familiar_de);
  const familiaresPorTitular = new Map<string, Afiliado[]>();

  if (!isFamilyView) {
    afiliados.forEach((a) => {
      if (a.familiar_de) {
        if (!familiaresPorTitular.has(a.familiar_de))
          familiaresPorTitular.set(a.familiar_de, []);
        familiaresPorTitular.get(a.familiar_de)!.push(a);
      }
    });
  }

  const todosOrdenados: Array<{ afiliado: Afiliado; depth: number }> =
    titulares.map((a) => ({ afiliado: a, depth: 0 }));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {todosOrdenados.map(({ afiliado, depth }, index) => {
          const esLider = !!afiliado.es_lider;
          const esFamiliar = !!afiliado.familiar_de && !esLider;
          const puedeEliminar = !(esLider && totalAfiliados > 1);

          return (
            <div
              key={afiliado.id}
              className={`group relative border rounded-2xl flex flex-col overflow-visible ${
                esLider
                  ? "border-orange-300 dark:border-orange-700 bg-gradient-to-br from-white to-orange-50/40 dark:from-neutral-900 dark:to-orange-950/40 ring-1 ring-orange-200/50 dark:ring-orange-900/50"
                  : esFamiliar
                    ? "border-purple-200 dark:border-purple-800 bg-gradient-to-br from-white to-purple-50/40 dark:from-neutral-900 dark:to-purple-950/40"
                    : "border-slate-200 dark:border-neutral-700 bg-gradient-to-br from-white to-slate-50/40 dark:from-neutral-900 dark:to-neutral-800/60 hover:border-blue-300 dark:hover:border-blue-600"
              } ${depth > 0 ? "ml-8 md:ml-12 border-l-4 border-l-purple-500 rounded-l-none" : ""}`}
            >
              {/* Lider Badge */}
              {esLider && (
                <div className="absolute -top-2.5 left-3 z-10">
                  <span className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-sm border border-orange-400">
                    <Crown className="w-2.5 h-2.5" /> Líder
                  </span>
                </div>
              )}

              <div className={`p-2 flex-1 space-y-2 ${esLider ? "pt-4" : ""}`}>
                {!esLider && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-700 rounded-xl px-3 py-2 min-h-[48px] shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex items-center justify-center font-black text-xs h-8 w-8 rounded-full shrink-0 shadow-sm border ${
                        esLider
                          ? "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-950/80 dark:to-orange-900/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700"
                          : esFamiliar
                            ? "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950/80 dark:to-purple-900/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                            : "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/80 dark:to-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase leading-tight tracking-tight truncate">
                      {afiliado.nombres}{" "}
                      <span className="text-slate-600 dark:text-slate-300 font-bold">
                        {afiliado.apellidos}
                      </span>
                    </h3>
                  </div>

                  {/* Right Side: Age & Gender */}
                  <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 dark:border-neutral-700 pl-3 ml-2">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-neutral-700 border border-slate-200 dark:border-neutral-700 px-2 py-1 rounded-lg text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                      <span className="font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {calcularEdad(afiliado.nacimiento)}
                      </span>
                    </div>
                    <div className="shrink-0">
                      {afiliado.sexo === "M" ? (
                        <span className="flex items-center justify-center bg-blue-100 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-bold text-xs h-7 w-7 rounded-md shadow-sm">
                          M
                        </span>
                      ) : (
                        <span className="flex items-center justify-center bg-pink-100 dark:bg-pink-950/70 border border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-300 font-bold text-xs h-7 w-7 rounded-md shadow-sm">
                          F
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                )}

                <div
                  className={`flex items-center gap-2 border rounded-lg px-2.5 py-1.5 w-full ${
                    !afiliado.empadronado
                      ? "bg-red-50/50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
                      : esFamiliar
                        ? "bg-purple-50/50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200"
                        : "bg-blue-50/50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200"
                  }`}
                >
                  {!afiliado.empadronado ? (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                  ) : (
                    <Hash
                      className={`w-5 h-5 shrink-0 ${esFamiliar ? "text-purple-700 dark:text-purple-400" : "text-blue-700 dark:text-blue-400"}`}
                    />
                  )}

                  <div className="flex flex-col justify-center min-w-0 w-full">
                    {afiliado.empadronado ? (
                      afiliado.dpi === afiliado.no_padron && afiliado.dpi ? (
                        <div className="flex items-center gap-2 leading-none truncate py-0.5">
                          <span className="font-bold uppercase text-slate-500 dark:text-neutral-400 text-sm">
                            DPI y Padrón:
                          </span>
                          <span className="font-mono font-black tracking-wider text-slate-700 dark:text-neutral-100">
                            {afiliado.dpi}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 leading-none py-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-500 dark:text-neutral-400 uppercase text-sm">
                              DPI:
                            </span>
                            <span className="font-mono font-black tracking-wider text-slate-700 dark:text-neutral-100">
                              {afiliado.dpi || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 border-l border-slate-300/50 dark:border-neutral-600 pl-3">
                            <span className="font-bold text-slate-500 dark:text-neutral-400 uppercase text-sm">
                              Padrón:
                            </span>
                            <span className="font-mono font-black tracking-wider text-slate-700 dark:text-neutral-100">
                              {afiliado.no_padron || "—"}
                            </span>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex items-center justify-between w-full leading-none py-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-red-500/70 dark:text-red-400 uppercase text-sm">
                            DPI:
                          </span>
                          <span className="font-mono font-black tracking-wider text-red-900 dark:text-red-200">
                            {afiliado.dpi || "—"}
                          </span>
                        </div>
                        <span className="font-black uppercase tracking-wide text-red-700 dark:text-red-400 border-l border-red-200 dark:border-red-800 pl-3 text-sm">
                          NO EMPADRONADO
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-700 rounded-lg pl-2.5 pr-0 py-0 overflow-hidden">
                  <span className="font-black font-mono text-sm text-slate-700 dark:text-slate-200 tracking-wider px-1">
                    {afiliado.telefono || "Sin teléfono"}
                  </span>

                  {afiliado.telefono && (
                    <div className="flex items-stretch h-11 shrink-0">
                      <a
                        href={`tel:+502${afiliado.telefono.replace(/\D/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center w-11 bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/80 transition-colors border-l border-slate-200 dark:border-neutral-700"
                        title="Llamar"
                      >
                        <Phone className="w-4 h-4 fill-current" />
                      </a>
                      <a
                        href={generarLinkWhatsapp(afiliado.telefono)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center w-11 bg-green-100 dark:bg-green-950/70 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/80 transition-colors"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between bg-slate-50 dark:bg-neutral-800/90 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-slate-500 dark:text-neutral-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span
                        className="truncate font-bold text-xs text-slate-700 dark:text-slate-200 leading-tight"
                        title={afiliado.lugar_nombre || "Ubicación no definida"}
                      >
                        {afiliado.lugar_nombre || "Ubicación no definida"}
                      </span>
                      <span
                        className="truncate text-[10px] font-medium text-slate-500 dark:text-neutral-400 leading-tight"
                        title={afiliado.sector_nombre || "Sector no definido"}
                      >
                        Sector: {afiliado.sector_nombre || "No asignado"}
                      </span>
                    </div>
                  </div>

                  {!esLider && (
                    <div className="flex flex-col items-end shrink-0 border-l border-slate-200 dark:border-neutral-700 pl-2 ml-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 leading-tight">
                        Registro
                      </span>
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 leading-tight">
                        {new Date(afiliado.created_at).toLocaleDateString(
                          "es-GT",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              {puedeVerAcciones && (
                <div
                  className="bg-slate-50/80 dark:bg-neutral-800/80 border-t border-slate-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-b-2xl overflow-hidden sm:px-4 sm:py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Primera Línea (Móvil) / Grupo Izquierdo (Desktop) */}
                  <div className="flex items-center justify-center gap-4 sm:gap-2 px-2 py-2.5 sm:p-0 w-full sm:w-auto">
                    {/* Ver Familia Button */}
                    {!esFamiliar && !isFamilyView && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 gap-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/50 hover:text-purple-900 dark:hover:text-purple-300 text-xs font-black uppercase transition-colors"
                        onClick={() => setTitularVerFamilia(afiliado)}
                      >
                        <Users className="w-4 h-4" />
                        Familia (
                        {familiaresPorTitular.get(afiliado.id)?.length || 0})
                      </button>
                    )}

                    {/* Ver/Cargar DPI */}
                    <button
                      type="button"
                      onClick={() => setGestionDpiAfiliado(afiliado)}
                      className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 gap-1.5 text-xs font-black uppercase transition-colors ${obtenerDpiInfo(afiliado).color}`}
                    >
                      <IdCard className="w-4 h-4" />
                      {obtenerDpiInfo(afiliado).label}
                    </button>
                  </div>

                  {/* División (Solo Móvil) */}
                  <div className="w-full h-px bg-slate-200 dark:bg-neutral-700 sm:hidden"></div>

                  {/* Segunda Línea (Móvil) / Grupo Derecho (Desktop) */}
                  <div className="flex items-center justify-center gap-4 sm:gap-2 px-2 py-2.5 sm:p-0 w-full sm:w-auto">
                    {/* Editar Button */}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700 hover:text-slate-900 dark:hover:text-white text-xs font-black uppercase transition-colors"
                      onClick={() => onEditar(afiliado)}
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>

                    {/* Eliminar Button */}
                    <button
                      type="button"
                      disabled={!puedeEliminar}
                      title={
                        !puedeEliminar
                          ? "No se puede eliminar al líder mientras tenga integrantes"
                          : undefined
                      }
                      className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 gap-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-900 dark:hover:text-red-300 text-xs font-black uppercase transition-colors disabled:opacity-40"
                      onClick={() =>
                        puedeEliminar && eliminar(afiliado, onDataChange)
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                      Borrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <GestionDpiModal
        isOpen={!!gestionDpiAfiliado}
        onClose={() => setGestionDpiAfiliado(null)}
        afiliado={gestionDpiAfiliado}
        onSaved={() => {
          onDataChange();
        }}
      />

      <Transition show={!!titularVerFamilia} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setTitularVerFamilia(null)}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 z-10">
            <div className="flex min-h-full items-center justify-center p-0">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <DialogPanel className="w-screen h-screen bg-white dark:bg-neutral-950 flex flex-col overflow-hidden">
                  <div className="flex justify-between items-center p-4 md:p-6 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 dark:bg-purple-950/60 p-2 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <Dialog.Title
                          as="h3"
                          className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight"
                        >
                          Familia de {titularVerFamilia?.nombres}
                        </Dialog.Title>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mt-0.5">
                          Gestión de grupo familiar
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTitularVerFamilia(null)}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline text-sm uppercase px-4 py-2"
                    >
                      Cerrar
                    </button>
                  </div>

                  <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-neutral-950">
                    {titularVerFamilia && (
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          {onAnadirFamiliar && (
                            <Button
                              onClick={() =>
                                onAnadirFamiliar(titularVerFamilia.id)
                              }
                              className="bg-purple-600 hover:bg-purple-700 text-white gap-2 font-bold"
                            >
                              <UserPlus className="w-4 h-4" />
                              Añadir Familiar
                            </Button>
                          )}
                        </div>
                        <Tabla
                          lider={lider}
                          afiliados={[
                            titularVerFamilia,
                            ...(familiaresPorTitular.get(
                              titularVerFamilia.id,
                            ) || []),
                          ]}
                          onEditar={onEditar}
                          onAnadirFamiliar={onAnadirFamiliar}
                          onDataChange={onDataChange}
                          rolUsuarioSesion={rolUsuarioSesion}
                          config={config}
                          totalEnCelula={totalEnCelula}
                          isFamilyView={true}
                        />
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
