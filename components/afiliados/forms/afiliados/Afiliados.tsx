"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2, Check, Save, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { toast } from "@/lib/toast";

import {
  guardarAfiliadoAction,
  buscarDpiEnPadronAction,
  buscarDpiEnAfiliadosAction,
} from "./actions";
import { obtenerReligionesUnicasAction } from "../../actions/afiliados";
import { type AfiliadoFormData, type Afiliado } from "./schemas";
import {
  useAfiliadosForm,
  useInicializarFormulario,
  useBuscadorLider,
} from "./hooks";
import useUserData from "@/hooks/sesion/useUserData";
import {
  obtenerPoliticasAction,
  obtenerSubPoliticasAction,
  crearSubPoliticaAction,
  crearPoliticaAction,
  obtenerLugaresAction,
  obtenerSectoresAction,
  obtenerBeneficiosAction,
  crearBeneficioAction,
  obtenerCondicionesEspecialesAction,
  type Politica,
  type SubPolitica,
  type Lugar,
  type Sector,
  type Beneficio,
} from "./catalogos";
import { useQuery } from "@tanstack/react-query";
import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";

type LiderType = {
  id: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  afiliadoAEditar?: Afiliado | null;
  liderPredefinidoId?: string | null;
  lugares: Lugar[];
  lideres: LiderType[];
  afiliados: Afiliado[];
  isFirstMember?: boolean;
  datosLider?: LiderType | null;
  familiarDeId?: string | null;
}

function ComboSearch({
  placeholder,
  items,
  value,
  onSelect,
  onCreateNew,
  disabled = false,
  loading = false,
  groupKey,
}: {
  placeholder: string;
  items: { id: number; nombre: string; [key: string]: any }[];
  value: number | null | undefined;
  onSelect: (id: number) => void;
  onCreateNew?: (nombre: string) => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  groupKey?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find((i) => i.id === value);

  useEffect(() => {
    if (selected) setQuery(selected.nombre);
    else setQuery("");
  }, [value, selected]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = items.filter((i: any) => {
    const queryLower = query.toLowerCase().trim();
    if (i.nombre.toLowerCase().includes(queryLower)) return true;

    if (groupKey) {
      const baseGroup = i[groupKey] ? String(i[groupKey]).toLowerCase() : "";
      if (baseGroup.includes(queryLower)) return true;

      const id = i.sector_id || 0;

      // Prevenir que "sector 1" coincida con "sector 11"
      const matchSector = queryLower.match(/^sector\s+(\d+)$/);
      if (matchSector) {
        if (id === parseInt(matchSector[1], 10)) return true;
      } else {
        const formattedGroup =
          id === 0 ? baseGroup : `sector ${id}: ${baseGroup}`.toLowerCase();
        if (formattedGroup.includes(queryLower)) return true;
      }
    }
    return false;
  });
  const exactMatch = items.find(
    (i) => i.nombre.toLowerCase() === query.trim().toLowerCase(),
  );
  const canCreate = onCreateNew && query.trim().length > 1 && !exactMatch;

  const handleCreate = async () => {
    if (!onCreateNew) return;
    setCreating(true);
    await onCreateNew(query.trim());
    setCreating(false);
    setOpen(false);
  };

  // Agrupar ítems por groupKey si se proporciona
  const grouped = useMemo(() => {
    if (!groupKey) return null;
    const map: Record<string, typeof filtered> = {};
    const sectorIdMap: Record<string, number> = {};
    filtered.forEach((item: any) => {
      const baseName = item[groupKey] || "Sin Clasificar";
      const id = item.sector_id || 0;
      const group = id === 0 ? baseName : `Sector ${id}: ${baseName}`;

      if (!map[group]) map[group] = [];
      map[group].push(item);
      sectorIdMap[group] = id;
    });

    // Ordenar los grupos por ID, dejando el ID 0 al final
    return Object.entries(map).sort(([nameA], [nameB]) => {
      const idA = sectorIdMap[nameA] || 0;
      const idB = sectorIdMap[nameB] || 0;
      if (idA === 0 && idB !== 0) return 1;
      if (idB === 0 && idA !== 0) return -1;
      return idA - idB;
    });
  }, [filtered, groupKey]);

  return (
    <div ref={ref} className="relative w-full">
      <div className="flex gap-1">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            placeholder={placeholder}
            disabled={disabled || loading}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (!e.target.value) onSelect(0);
            }}
            onFocus={() => setOpen(true)}
            className="w-full h-10 px-3 border border-gray-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
          />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>
      </div>
      <AnimatePresence>
        {open && (filtered.length > 0 || canCreate) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {grouped
              ? grouped.map(([group, groupItems]) => (
                  <div key={group}>
                    <div className="sticky top-0 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase border-b border-blue-100 dark:border-blue-900 z-10">
                      📍 {group}
                    </div>
                    {groupItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full text-left px-3 pl-5 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-between group"
                        onClick={() => {
                          onSelect(item.id);
                          setQuery(item.nombre);
                          setOpen(false);
                        }}
                      >
                        {item.nombre}
                        {value === item.id && (
                          <Check className="w-3 h-3 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              : filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center justify-between group"
                    onClick={() => {
                      onSelect(item.id);
                      setQuery(item.nombre);
                      setOpen(false);
                    }}
                  >
                    {item.nombre}
                    {value === item.id && (
                      <Check className="w-3 h-3 text-blue-600" />
                    )}
                  </button>
                ))}
            {canCreate && (
              <button
                type="button"
                disabled={creating}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 font-bold border-t flex items-center gap-2 hover:bg-blue-50"
                onClick={handleCreate}
              >
                {creating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                Crear "{query.trim()}"
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AfiliadosForm({
  isOpen,
  onClose,
  onSave,
  afiliadoAEditar,
  liderPredefinidoId,
  lideres,
  afiliados = [],
  isFirstMember = false,
  datosLider = null,
  familiarDeId = null,
}: Props) {
  const { rol_id } = useUserData();
  const esAdmin = rol_id === 1 || rol_id === 2;

  const { data: configSis } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });
  const padronHabilitado = configSis?.padron === true;

  const isEditMode = !!afiliadoAEditar;
  const [step, setStep] = useState(
    isEditMode || isFirstMember || !padronHabilitado ? 2 : 1,
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [mostrandoNuevaReligion, setMostrandoNuevaReligion] = useState(false);

  const [politicas, setPoliticas] = useState<Politica[]>([]);
  const [subPoliticas, setSubPoliticas] = useState<SubPolitica[]>([]);
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<number | null>(null);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [politicaSeleccionada, setPoliticaSeleccionada] = useState<
    number | null
  >(null);
  const [subPoliticaSeleccionada, setSubPoliticaSeleccionada] = useState<
    number | null
  >(null);
  const [lugarSeleccionado, setLugarSeleccionado] = useState<number>(0);
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [beneficioSeleccionado, setBeneficioSeleccionado] = useState<
    number | null
  >(null);
  const [mostrandoNuevoBeneficio, setMostrandoNuevoBeneficio] = useState(false);
  const [nuevoBeneficioNombre, setNuevoBeneficioNombre] = useState("");
  const [creandoBeneficio, setCreandoBeneficio] = useState(false);

  const [mostrandoNuevaPolitica, setMostrandoNuevaPolitica] = useState(false);
  const [nuevaPoliticaNombre, setNuevaPoliticaNombre] = useState("");
  const [creandoPolitica, setCreandoPolitica] = useState(false);
  const [mostrandoNuevoSub, setMostrandoNuevoSub] = useState(false);
  const [nuevoSubNombre, setNuevoSubNombre] = useState("");
  const [creandoSub, setCreandoSub] = useState(false);

  const [condiciones, setCondiciones] = useState<string[]>([]);
  const [mostrandoNuevaCondicion, setMostrandoNuevaCondicion] = useState(false);
  const [nuevaCondicionNombre, setNuevaCondicionNombre] = useState("");

  const form = useAfiliadosForm();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    setError,
  } = form;

  const sexoActual = watch("sexo");
  const religionActual = watch("religion");
  const condicionActual = watch("condicion_especial");
  const dpiActual = watch("dpi");

  const condicionesOrdenadas = [...condiciones].sort((a, b) =>
    a.localeCompare(b),
  );
  const buscador = useBuscadorLider(lideres, setValue);
  const [buscandoDpi, setBuscandoDpi] = useState(false);
  const [padronStatus, setPadronStatus] = useState<
    "none" | "found" | "not_found"
  >("none");
  const [yaRegistrado, setYaRegistrado] = useState<{
    afiliadoNombre: string;
    liderNombre: string;
  } | null>(null);

  const [religionesRemotas, setReligionesRemotas] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      obtenerReligionesUnicasAction().then((res) => setReligionesRemotas(res));
    }
  }, [isOpen]);

  // Extraer las religiones existentes (omitir Católico y Evangélico que ya son fijas)
  const religionesExistentes = Array.from(
    new Set(
      [
        ...(afiliados || []).map((a) => a.religion),
        ...religionesRemotas,
      ].filter(Boolean),
    ),
  ).filter((r) => r !== "Católico" && r !== "Evangélico");

  const esReligionCustom =
    religionActual &&
    !["Católico", "Evangélico", ...religionesExistentes].includes(
      religionActual,
    );

  const handleVerificarDpi = async () => {
    const dpiLimpio = dpiActual?.replace(/\s/g, "");
    if (dpiActual !== dpiLimpio) setValue("dpi", dpiLimpio || "");

    if (!dpiLimpio || dpiLimpio.length !== 13) {
      setError("dpi", { type: "manual", message: "Ingrese 13 dígitos válidos" });
      return;
    }

    setBuscandoDpi(true);
    setYaRegistrado(null);

    const enSistema = await buscarDpiEnAfiliadosAction(dpiLimpio);
    if (enSistema?.yaRegistrado) {
      setYaRegistrado({
        afiliadoNombre: enSistema.afiliadoNombre,
        liderNombre: enSistema.liderNombre,
      });
      setBuscandoDpi(false);
      return;
    }

    const res = await buscarDpiEnPadronAction(dpiLimpio);
    if (res && res.encontrado) {
      setValue("nombres", res.nombres);
      setValue("apellidos", res.apellidos);
      setValue("sexo", res.genero as "M" | "F");
      setValue("empadronado", true);
      setValue("no_padron", dpiLimpio);
      setPadronStatus("found");
      toast.success("¡Afiliado encontrado en TSE!");
    } else {
      setPadronStatus("not_found");
      setValue("empadronado", false);
      toast.warning("No encontrado en TSE, pero puedes continuar.");
    }
    setBuscandoDpi(false);
    setStep(2);
  };

  useEffect(() => {
    if (isEditMode || isFirstMember || !padronHabilitado) setStep(2);
    else setStep(1);
    setPadronStatus("none");
    setYaRegistrado(null);
  }, [isOpen, isEditMode, isFirstMember, padronHabilitado]);

  useInicializarFormulario(
    isOpen,
    afiliadoAEditar,
    liderPredefinidoId,
    lideres,
    form,
    buscador.setLiderSearch,
    buscador.setShowLiderSuggestions,
    isFirstMember,
    datosLider,
    familiarDeId,
  );

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) setIsLoadingData(true);
      Promise.all([
        obtenerPoliticasAction(),
        obtenerLugaresAction(),
        obtenerSectoresAction(),
        obtenerBeneficiosAction(),
        obtenerCondicionesEspecialesAction(),
      ]).then(async ([p, l, s, b, c]) => {
        setPoliticas(p);
        setLugares(l);
        setSectores(s);
        setBeneficios(b);
        setCondiciones(c.sort((a, b) => a.localeCompare(b)));
        if (afiliadoAEditar) {
          const pid = (afiliadoAEditar as any).politica_id || null;
          const spid = (afiliadoAEditar as any).sub_politica_id || null;
          const lid = afiliadoAEditar.lugar_id || 0;
          const bid = (afiliadoAEditar as any).beneficio_id || null;
          
          const lugarObj = l.find(lg => lg.id === lid);
          if (lugarObj) {
            setSectorSeleccionado(lugarObj.sector_id ?? 0);
          } else {
            setSectorSeleccionado(null);
          }

          setPoliticaSeleccionada(pid);
          setSubPoliticaSeleccionada(spid);
          setLugarSeleccionado(lid);
          setBeneficioSeleccionado(bid);
          if (pid) {
            const subs = await obtenerSubPoliticasAction(pid);
            setSubPoliticas(subs);
          }
        } else {
          setSectorSeleccionado(null);
          setPoliticaSeleccionada(null);
          setSubPoliticaSeleccionada(null);
          setSubPoliticas([]);
          setLugarSeleccionado(0);
          setBeneficioSeleccionado(null);
        }
        setIsLoadingData(false);
      });
    }
  }, [isOpen, afiliadoAEditar, isEditMode]);

  useEffect(() => {
    if (isOpen && afiliadoAEditar?.religion) {
      const valor = afiliadoAEditar.religion;
      const esEstandar = ["Católico", "Evangélico"].includes(valor);
      if (!esEstandar) setValue("religion", valor);
    }
  }, [isOpen, isEditMode, afiliadoAEditar, setValue]);

  const handlePoliticaChange = async (id: number | null) => {
    setPoliticaSeleccionada(id);
    setSubPoliticaSeleccionada(null);
    setValue("politica_id" as any, id);
    setValue("sub_politica_id" as any, null);
    setSubPoliticas([]);
    setMostrandoNuevoSub(false);
    setNuevoSubNombre("");
    if (id) {
      setLoadingSubs(true);
      const subs = await obtenerSubPoliticasAction(id);
      setSubPoliticas(subs);
      setLoadingSubs(false);
    }
  };

  const handleCrearSubPolitica = async () => {
    if (!politicaSeleccionada || !nuevoSubNombre.trim()) return;
    setCreandoSub(true);
    const result = await crearSubPoliticaAction(
      politicaSeleccionada,
      nuevoSubNombre.trim(),
    );
    if (result.ok) {
      setSubPoliticas((prev) =>
        [...prev, result.data].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setSubPoliticaSeleccionada(result.data.id);
      setValue("sub_politica_id" as any, result.data.id);
      setMostrandoNuevoSub(false);
      setNuevoSubNombre("");
      toast.success("Sub-programa de interés creado");
    } else {
      toast.error(result.error);
    }
    setCreandoSub(false);
  };

  const handleCrearBeneficio = async () => {
    if (!nuevoBeneficioNombre.trim()) return;
    setCreandoBeneficio(true);
    const nuevo = await crearBeneficioAction(nuevoBeneficioNombre.trim());
    if (nuevo) {
      setBeneficios((prev) =>
        [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setBeneficioSeleccionado(nuevo.id);
      setValue("beneficio_id" as any, nuevo.id);
      setMostrandoNuevoBeneficio(false);
      setNuevoBeneficioNombre("");
      toast.success("Beneficio creado");
    } else {
      toast.error("Error al crear el beneficio");
    }
    setCreandoBeneficio(false);
  };

  const handleCrearPolitica = async () => {
    if (!nuevaPoliticaNombre.trim()) return;
    setCreandoPolitica(true);
    const result = await crearPoliticaAction(nuevaPoliticaNombre.trim());
    if (result.ok) {
      setPoliticas((prev) => {
        const existe = prev.some((p) => p.id === result.data.id);
        const lista = existe ? prev : [...prev, result.data];
        return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
      });
      await handlePoliticaChange(result.data.id);
      setMostrandoNuevaPolitica(false);
      setNuevaPoliticaNombre("");
      toast.success("Programa de interés creado");
    } else {
      toast.error(result.error);
    }
    setCreandoPolitica(false);
  };

  const handleCrearCondicion = () => {
    const val = nuevaCondicionNombre.trim();
    if (!val) return;
    setCondiciones((prev) =>
      [...prev, val].sort((a, b) => a.localeCompare(b)),
    );
    setValue("condicion_especial", val);
    setMostrandoNuevaCondicion(false);
    setNuevaCondicionNombre("");
    toast.success("Condición especial agregada");
  };

  const onSubmit = async (formData: any) => {
    const datosProcesados = {
      ...formData,
      lugar_id: lugarSeleccionado,
      politica_id: politicaSeleccionada,
      sub_politica_id: subPoliticaSeleccionada || null,
      beneficio_id: beneficioSeleccionado,
      religion: mostrandoNuevaReligion
        ? formData.religion_otra
        : formData.religion,
      ...(isFirstMember && !afiliadoAEditar ? { es_lider: true } : {}),
    };
    delete (datosProcesados as any).religion_otra;

    const res = await guardarAfiliadoAction(
      datosProcesados as AfiliadoFormData,
      afiliadoAEditar?.id,
    );
    if (res?.error) {
      if (res.field) {
        setError(res.field as any, { type: "manual", message: res.error });
        if ((res as any).dpiDuplicado) {
          setYaRegistrado((res as any).dpiDuplicado);
        }
      } else {
        toast.error(`Error: ${res.error}`);
      }
      return;
    }

    toast.success(
      `Afiliado ${isEditMode ? "actualizado" : "creado"} correctamente.`,
    );
    setMostrandoNuevaReligion(false);
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  const avisoDpiRegistrado = yaRegistrado ? (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-center">
      <div className="flex items-center justify-center gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
        <p className="text-sm font-black uppercase leading-tight">
          ¡DPI ya registrado!{" "}
          <span className="font-bold normal-case text-red-900 dark:text-red-200">{yaRegistrado.afiliadoNombre}</span>
        </p>
      </div>
      <p className="text-sm leading-tight">
        Célula del líder:{" "}
        <span className="font-black text-blue-700 dark:text-blue-400">{yaRegistrado.liderNombre}</span>
      </p>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex justify-center items-center z-50 p-4 font-sans">
      <motion.div
        className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl w-full max-w-lg md:max-w-3xl p-6 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-neutral-800"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold uppercase text-gray-900 dark:text-gray-100">
            {isEditMode
              ? "Editar Afiliado"
              : step === 1
                ? "Verificar DPI"
                : "Completar Datos"}
          </h2>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && !isEditMode ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 flex flex-col py-4 md:py-6"
            >
              {avisoDpiRegistrado}

              <p className="text-sm font-bold text-gray-500 dark:text-neutral-400 uppercase text-center">
                Ingrese el DPI para buscar en el sistema de afiliación TSE
              </p>

              <div className="space-y-2">
                <Input
                  {...register("dpi")}
                  placeholder="DPI (13 dígitos sin espacios)"
                  disabled={buscandoDpi}
                  className="h-14 text-center text-xl font-bold tracking-widest placeholder:tracking-normal dark:bg-neutral-800 dark:border-neutral-600 dark:text-gray-100"
                  maxLength={13}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleVerificarDpi();
                    }
                  }}
                />
                {errors.dpi && (
                  <p className="text-xs text-red-500 dark:text-red-400 text-center font-bold">
                    {errors.dpi.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center">
                <div className="flex justify-center shrink-0 lg:order-1">
                  <Image
                    src="/gif/afiliados/gif0.gif"
                    alt="Animación"
                    width={128}
                    height={128}
                    unoptimized
                    className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 object-contain"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleVerificarDpi}
                  disabled={buscandoDpi || !dpiActual || dpiActual.length < 13}
                  className="w-full lg:flex-1 lg:order-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 h-12 font-bold uppercase"
                >
                  {buscandoDpi ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    "Continuar"
                  )}
                </Button>
              </div>
            </motion.div>
          ) : isLoadingData ? (
            <div className="space-y-4 animate-pulse pt-4">
              <div className="flex gap-4">
                <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md flex-1"></div>
                <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md flex-1"></div>
              </div>
              <div className="flex gap-4">
                <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md flex-1"></div>
                <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md flex-1"></div>
              </div>
              <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md w-full"></div>
              <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md w-full"></div>
              <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md w-full"></div>
              <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md w-full"></div>

              <div className="flex justify-between mt-6 border-t border-gray-200 dark:border-neutral-800 pt-4">
                <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md w-24"></div>
                <div className="flex gap-2">
                  <div className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-md w-24"></div>
                  <div className="h-10 bg-gray-200 dark:bg-neutral-700 rounded-md w-24"></div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {avisoDpiRegistrado}

              {padronHabilitado &&
                !isEditMode &&
                padronStatus !== "none" &&
                !yaRegistrado && (
                  <div
                    className={`p-3 rounded-lg flex items-center gap-2 border text-xs font-bold uppercase ${
                      padronStatus === "found"
                        ? "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                        : "bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300"
                    }`}
                  >
                    {padronStatus === "found" ? (
                      <>
                        <Check className="w-4 h-4" /> AFILIADO EN PADRÓN TSE
                        ENCONTRADO - Datos prellenados
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" /> NO ENCONTRADO EN PADRÓN - Por
                        favor llene todos los campos
                      </>
                    )}
                  </div>
                )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COLUMNA IZQUIERDA: DPI → Religión */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">DPI</label>
                    <div className="relative">
                      <Input {...register("dpi")} placeholder="DPI" readOnly={!isEditMode && !isFirstMember && padronHabilitado} className={!isEditMode && !isFirstMember && padronHabilitado ? "bg-gray-100 dark:bg-neutral-800" : ""} />
                      {padronHabilitado && padronStatus === "found" && !isEditMode && <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
                    </div>
                    {errors.dpi && !yaRegistrado && <p className="text-[10px] text-red-500 dark:text-red-400">{errors.dpi.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Nombres</label>
                      <Input {...register("nombres")} placeholder="Nombres" />
                      {errors.nombres && <p className="text-[10px] text-red-500">{errors.nombres.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">Apellidos</label>
                      <Input {...register("apellidos")} placeholder="Apellidos" />
                      {errors.apellidos && <p className="text-[10px] text-red-500">{errors.apellidos.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-green-600 uppercase">Teléfono (Whatsapp)</label>
                    <Input {...register("telefono")} placeholder="Teléfono" type="tel" inputMode="numeric" />
                    {errors.telefono && <p className="text-[10px] text-red-500">{errors.telefono.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono 2 (Opcional)</label>
                    <Input {...register("telefono2")} placeholder="Teléfono alternativo" type="tel" inputMode="numeric" />
                    {errors.telefono2 && <p className="text-[10px] text-red-500">{errors.telefono2.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Teléfono 3 (Opcional)</label>
                    <Input {...register("telefono3")} placeholder="Teléfono alternativo" type="tel" inputMode="numeric" />
                    {errors.telefono3 && <p className="text-[10px] text-red-500">{errors.telefono3.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase block leading-none">Nacimiento</label>
                      <Input type="date" {...register("nacimiento")} className="h-9 text-xs" />
                      {errors.nacimiento && <p className="text-[10px] text-red-500">{errors.nacimiento.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase block leading-none">Sexo</label>
                      <div className="flex rounded-md border border-gray-200 dark:border-neutral-600 p-1 bg-gray-50 dark:bg-neutral-800 h-9">
                        <button type="button" onClick={() => setValue("sexo", "M")} className={`flex-1 rounded text-[10px] font-black transition-all ${sexoActual === "M" ? "bg-blue-600 text-white shadow-sm" : "text-gray-400 dark:text-neutral-500 hover:bg-gray-200 dark:hover:bg-neutral-700"}`}>M</button>
                        <button type="button" onClick={() => setValue("sexo", "F")} className={`flex-1 rounded text-[10px] font-black transition-all ${sexoActual === "F" ? "bg-pink-600 text-white shadow-sm" : "text-gray-400 dark:text-neutral-500 hover:bg-gray-200 dark:hover:bg-neutral-700"}`}>F</button>
                      </div>
                      {errors.sexo && <p className="text-[10px] text-red-500">{errors.sexo.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-600 uppercase">Religión</label>
                    {!mostrandoNuevaReligion ? (
                      <select
                        value={religionActual || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "otros") {
                            setMostrandoNuevaReligion(true);
                            setValue("religion", "");
                          } else {
                            setValue("religion", val);
                          }
                        }}
                        className="w-full h-10 px-3 border border-gray-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-gray-100"
                      >
                        <option value="">Seleccione...</option>
                        <option value="Católico">Católico</option>
                        <option value="Evangélico">Evangélico</option>
                        {religionesExistentes.map((r) => (<option key={r as string} value={r as string}>{r as string}</option>))}
                        {esReligionCustom && (<option value={religionActual}>{religionActual}</option>)}
                        <option value="otros">+ Crear Nueva</option>
                      </select>
                    ) : (
                      <div className="flex gap-2 h-10">
                        <Input {...register("religion_otra")} placeholder="Religión..." className="flex-1 px-2" autoFocus onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = form.getValues("religion_otra"); if (v) { setValue("religion", v); setMostrandoNuevaReligion(false); } } }} />
                        <Button type="button" size="icon" variant="ghost" className="shrink-0 text-green-600 bg-green-50 hover:bg-green-100 h-10 w-10" onClick={() => { const v = form.getValues("religion_otra"); if (v) { setValue("religion", v); setMostrandoNuevaReligion(false); } }}><Check className="w-4 h-4" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="shrink-0 text-red-500 bg-red-50 hover:bg-red-100 h-10 w-10" onClick={() => { setMostrandoNuevaReligion(false); setValue("religion_otra", ""); }}><X className="w-4 h-4" /></Button>
                      </div>
                    )}
                    {errors.religion && !mostrandoNuevaReligion && <p className="text-[10px] text-red-500">{errors.religion.message}</p>}
                  </div>
                </div>

                {/* COLUMNA DERECHA: Lugar → Condición Especial */}
                <div className="space-y-3">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-600 uppercase block">
                        Sector
                      </label>
                      <select
                        value={sectorSeleccionado !== null ? sectorSeleccionado : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const id = val !== "" ? Number(val) : null;
                          setSectorSeleccionado(id);
                          setLugarSeleccionado(0);
                          setValue("lugar_id", 0);
                        }}
                        className="w-full h-10 px-3 border border-gray-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-gray-100"
                      >
                        <option value="">Seleccione un sector...</option>
                        {sectores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {sectorSeleccionado !== null && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-blue-600 uppercase block">
                          Lugar
                        </label>
                        <ComboSearch
                          placeholder="Buscar lugar..."
                          items={lugares.filter((l) => l.sector_id === sectorSeleccionado || (sectorSeleccionado === 0 && !l.sector_id))}
                          value={lugarSeleccionado}
                          onSelect={(id) => {
                            setLugarSeleccionado(id);
                            setValue("lugar_id", id);
                          }}
                        />
                        {errors.lugar_id && (
                          <p className="text-[10px] text-red-500">
                            {errors.lugar_id.message}
                          </p>
                        )}
                        <p className="text-[10px] font-semibold text-blue-500">
                          Si el lugar no aparece, comunícate con administración.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="space-y-1 w-3/4">
                      <label className="text-[10px] font-bold text-blue-600 uppercase">
                        No. Padrón
                      </label>
                      <Input
                        {...register("no_padron")}
                        placeholder="No. Padrón"
                      />
                      {errors.no_padron && (
                        <p className="text-[10px] text-red-500">
                          {errors.no_padron.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1 w-1/4">
                      <label className="text-[10px] font-bold text-blue-600 uppercase opacity-0 select-none">
                        TSE
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-1 text-[10px] font-bold uppercase h-10 shadow-none border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-950/45 hover:bg-blue-100 dark:hover:bg-blue-950/65 transition-colors"
                        onClick={() =>
                          window.open(
                            "https://tse.org.gt/reg-ciudadanos/sistema-de-estadisticas/consulta-de-afiliacion",
                            "_blank",
                          )
                        }
                      >
                        Ver. TSE
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-600 uppercase block">
                      Programa de Interés
                    </label>
                    {!mostrandoNuevaPolitica ? (
                      <select
                        value={politicaSeleccionada ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "otros") {
                            setMostrandoNuevaPolitica(true);
                            handlePoliticaChange(null);
                          } else {
                            handlePoliticaChange(val ? Number(val) : null);
                          }
                        }}
                        className="w-full h-10 px-3 border border-gray-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-gray-100"
                      >
                        <option value="">Seleccione programa...</option>
                        {politicas.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                        {esAdmin && (
                          <option value="otros">+ Crear Nueva</option>
                        )}
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={nuevaPoliticaNombre}
                          onChange={(e) =>
                            setNuevaPoliticaNombre(e.target.value)
                          }
                          placeholder="Nombre del programa de interés..."
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCrearPolitica();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          disabled={
                            creandoPolitica || !nuevaPoliticaNombre.trim()
                          }
                          onClick={handleCrearPolitica}
                          className="shrink-0 bg-indigo-600 hover:bg-indigo-700 h-10 w-10"
                        >
                          {creandoPolitica ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="shrink-0 text-red-500 bg-red-50 hover:bg-red-100 h-10 w-10"
                          onClick={() => {
                            setMostrandoNuevaPolitica(false);
                            setNuevaPoliticaNombre("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {errors.politica_id && (
                      <p className="text-[10px] text-red-500">
                        {errors.politica_id.message}
                      </p>
                    )}
                  </div>

                  {politicaSeleccionada && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-purple-600 uppercase block">
                        Sub-programa de Interés (Opcional)
                      </label>
                      {!mostrandoNuevoSub ? (
                        <select
                          value={subPoliticaSeleccionada ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "otros") {
                              setMostrandoNuevoSub(true);
                              setSubPoliticaSeleccionada(null);
                              setValue("sub_politica_id" as any, null);
                            } else {
                              const num = val ? Number(val) : null;
                              setSubPoliticaSeleccionada(num);
                              setValue("sub_politica_id" as any, num);
                            }
                          }}
                          disabled={loadingSubs}
                          className="w-full h-10 px-3 border border-gray-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-gray-100 disabled:opacity-50"
                        >
                          <option value="">
                            {loadingSubs
                              ? "Cargando sub-programas..."
                              : "Sin sub-programa..."}
                          </option>
                          {subPoliticas.map((sp) => (
                            <option key={sp.id} value={sp.id}>
                              {sp.nombre}
                            </option>
                          ))}
                          {esAdmin && (
                            <option value="otros">+ Crear Nueva</option>
                          )}
                        </select>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            value={nuevoSubNombre}
                            onChange={(e) => setNuevoSubNombre(e.target.value)}
                            placeholder="Nombre del sub-programa de interés..."
                            className="flex-1"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleCrearSubPolitica();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            size="icon"
                            disabled={creandoSub || !nuevoSubNombre.trim()}
                            onClick={handleCrearSubPolitica}
                            className="shrink-0 bg-purple-600 hover:bg-purple-700 h-10 w-10"
                          >
                            {creandoSub ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="shrink-0 text-red-500 bg-red-50 hover:bg-red-100 h-10 w-10"
                            onClick={() => {
                              setMostrandoNuevoSub(false);
                              setNuevoSubNombre("");
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-emerald-600 uppercase block">
                      Beneficios Recibidos (Opcional)
                    </label>
                    {!mostrandoNuevoBeneficio ? (
                      <select
                        value={beneficioSeleccionado ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "otros") {
                            setMostrandoNuevoBeneficio(true);
                            setBeneficioSeleccionado(null);
                            setValue("beneficio_id" as any, null);
                          } else {
                            const num = val ? Number(val) : null;
                            setBeneficioSeleccionado(num);
                            setValue("beneficio_id" as any, num);
                          }
                        }}
                        className="w-full h-10 px-3 border border-gray-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-gray-100"
                      >
                        <option value="">Sin beneficio...</option>
                        {beneficios.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.nombre}
                          </option>
                        ))}
                        <option value="otros">+ Crear Nueva</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={nuevoBeneficioNombre}
                          onChange={(e) =>
                            setNuevoBeneficioNombre(e.target.value)
                          }
                          placeholder="Nombre del nuevo beneficio..."
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCrearBeneficio();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          disabled={
                            creandoBeneficio || !nuevoBeneficioNombre.trim()
                          }
                          onClick={handleCrearBeneficio}
                          className="shrink-0 bg-emerald-600 hover:bg-emerald-700 h-10 w-10"
                        >
                          {creandoBeneficio ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="shrink-0 text-red-500 bg-red-50 hover:bg-red-100 h-10 w-10"
                          onClick={() => {
                            setMostrandoNuevoBeneficio(false);
                            setNuevoBeneficioNombre("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-teal-600 uppercase block">
                      Condición Especial (Opcional)
                    </label>
                    {!mostrandoNuevaCondicion ? (
                      <select
                        value={condicionActual || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "otros") {
                            setMostrandoNuevaCondicion(true);
                            setValue("condicion_especial", null);
                          } else {
                            setValue("condicion_especial", val || null);
                          }
                        }}
                        className="w-full h-10 px-3 border border-gray-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-800 dark:text-gray-100"
                      >
                        <option value="">Ninguna</option>
                        {condicionesOrdenadas.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        {condicionActual &&
                          !condicionesOrdenadas.includes(condicionActual) && (
                            <option value={condicionActual}>
                              {condicionActual}
                            </option>
                          )}
                        {esAdmin && (
                          <option value="otros">+ Crear Nueva</option>
                        )}
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={nuevaCondicionNombre}
                          onChange={(e) =>
                            setNuevaCondicionNombre(e.target.value)
                          }
                          placeholder="Nombre de la condición especial..."
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCrearCondicion();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="icon"
                          disabled={!nuevaCondicionNombre.trim()}
                          onClick={handleCrearCondicion}
                          className="shrink-0 bg-teal-600 hover:bg-teal-700 h-10 w-10"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="shrink-0 text-red-500 bg-red-50 hover:bg-red-100 h-10 w-10"
                          onClick={() => {
                            setMostrandoNuevaCondicion(false);
                            setNuevaCondicionNombre("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              <input
                type="hidden"
                {...register("lider_id")}
                value={liderPredefinidoId || ""}
              />

              <div className="flex justify-end items-center pt-4 border-t border-gray-200 dark:border-neutral-800 mt-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    className="text-xs font-bold uppercase"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 text-white hover:bg-green-700 text-xs font-bold uppercase px-8 h-10"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}
