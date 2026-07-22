"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  ChevronDown,
  FileBarChart,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  PiBriefcaseDuotone,
  PiBuildingsDuotone,
  PiChatCircleDotsDuotone,
  PiClipboardTextDuotone,
  PiMedalDuotone,
  PiShieldCheckDuotone,
  PiUsersThreeDuotone,
} from "react-icons/pi";

import ConfiguracionSistema from "../dashboard/ConfiguracionSistema";
import EstadisticasTabs from "./estadisticas/EstadisticasTabs";

import { SignupForm } from "@/components/admin/sign-up/SignForm";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import AfiliadosGeneral from "./AfiliadosGeneral";
import Celula from "./Celula";
import Difusion from "./Difusion";
import Lideres from "./Lideres";
import MetaGeneral from "./MetaGeneral";
import ModalBienvenida from "./ModalBienvenida";
import Padron from "./Padron";
import type { Afiliado, Lider } from "./esquemas";
import { esRolEmpleado, esUsuarioSede } from "./esquemas";
import Form from "./forms/afiliados/Afiliados";
import ReporteLideresClasificacion from "./reportes/ReporteLideresClasificacion";

import { obtenerAfiliadosAction } from "./actions/afiliados";
import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import { AFILIADOS_SIMULADOS, LIDER_SIMULADO } from "./datosSimulados";

type Lugar = {
  id: number;
  nombre: string;
  sector_id: number | null;
  sector_nombre: string | null;
};

type Tab =
  | "Sede"
  | "Lideres"
  | "Afiliados"
  | "Trabajadores"
  | "Padron"
  | "Administrativos"
  | "Mensajes";

import { useQuery, useQueryClient } from "@tanstack/react-query";

const TAB_THEMES: Record<
  Tab,
  {
    activeText: string;
    activeBorder: string;
    activeIconBg: string;
    activeIconText: string;
    lineBg: string;
  }
> = {
  Sede: {
    activeText: "text-blue-700 dark:text-blue-400",
    activeBorder: "border-blue-300 dark:border-blue-700",
    activeIconBg: "bg-blue-100 dark:bg-blue-950/60",
    activeIconText: "text-blue-700 dark:text-blue-400",
    lineBg: "bg-blue-300 dark:bg-blue-700",
  },
  Lideres: {
    activeText: "text-orange-600 dark:text-orange-400",
    activeBorder: "border-orange-300 dark:border-orange-700",
    activeIconBg: "bg-orange-100 dark:bg-orange-950/60",
    activeIconText: "text-orange-600 dark:text-orange-400",
    lineBg: "bg-orange-300 dark:bg-orange-700",
  },
  Afiliados: {
    activeText: "text-sky-600 dark:text-sky-400",
    activeBorder: "border-sky-300 dark:border-sky-700",
    activeIconBg: "bg-sky-100 dark:bg-sky-950/60",
    activeIconText: "text-sky-600 dark:text-sky-400",
    lineBg: "bg-sky-300 dark:bg-sky-700",
  },
  Trabajadores: {
    activeText: "text-violet-600 dark:text-violet-400",
    activeBorder: "border-violet-300 dark:border-violet-700",
    activeIconBg: "bg-violet-100 dark:bg-violet-950/60",
    activeIconText: "text-violet-600 dark:text-violet-400",
    lineBg: "bg-violet-300 dark:bg-violet-700",
  },
  Padron: {
    activeText: "text-teal-700 dark:text-teal-400",
    activeBorder: "border-teal-300 dark:border-teal-700",
    activeIconBg: "bg-teal-100 dark:bg-teal-950/60",
    activeIconText: "text-teal-700 dark:text-teal-400",
    lineBg: "bg-teal-300 dark:bg-teal-700",
  },
  Administrativos: {
    activeText: "text-indigo-600 dark:text-indigo-400",
    activeBorder: "border-indigo-300 dark:border-indigo-700",
    activeIconBg: "bg-indigo-100 dark:bg-indigo-950/60",
    activeIconText: "text-indigo-600 dark:text-indigo-400",
    lineBg: "bg-indigo-300 dark:bg-indigo-700",
  },
  Mensajes: {
    activeText: "text-green-600 dark:text-green-400",
    activeBorder: "border-green-300 dark:border-green-700",
    activeIconBg: "bg-green-100 dark:bg-green-950/60",
    activeIconText: "text-green-600 dark:text-green-400",
    lineBg: "bg-green-300 dark:bg-green-700",
  },
};

const tabEase = [0.25, 0.46, 0.45, 0.94] as const;

const TAB_ORDER: Tab[] = [
  "Sede",
  "Lideres",
  "Trabajadores",
  "Afiliados",
  "Padron",
  "Administrativos",
  "Mensajes",
];

const tabBtnClass = (active: boolean, tab: Tab) => {
  const theme = TAB_THEMES[tab];
  return `relative flex w-full md:w-52 md:shrink-0 flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 px-1 md:px-3 py-2.5 md:py-2.5 text-[11px] leading-tight md:text-sm font-semibold rounded-t-md md:rounded-t-lg -mb-px border-[3px] md:border-4 border-transparent border-b-0 bg-white dark:bg-neutral-950 transition-colors duration-500 ${
    active
      ? `z-10 ${theme.activeText}`
      : `z-0 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-900`
  }`;
};

const tabIconClass = (active: boolean, tab: Tab) => {
  const theme = TAB_THEMES[tab];
  return `p-1 md:p-1.5 rounded-md transition-colors duration-300 shrink-0 ${
    active
      ? `${theme.activeIconBg} ${theme.activeIconText}`
      : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400"
  }`;
};

export default function Ver() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("Sede");
  const [tabLineOrigin, setTabLineOrigin] = useState("0%");
  const [tabSlideDir, setTabSlideDir] = useState(1);
  const tabsRowRef = useRef<HTMLDivElement>(null);
  const tabBtnRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const prevTabRef = useRef<Tab>("Sede");

  const medirOrigenLinea = useCallback((tab: Tab) => {
    const row = tabsRowRef.current;
    const btn = tabBtnRefs.current[tab];
    if (!row || !btn) return;
    const rowRect = row.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (rowRect.width <= 0) return;
    const centro =
      ((btnRect.left + btnRect.width / 2 - rowRect.left) / rowRect.width) * 100;
    setTabLineOrigin(`${Math.min(100, Math.max(0, centro))}%`);
  }, []);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEstadisticasOpen, setIsEstadisticasOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isReportesLideresOpen, setIsReportesLideresOpen] = useState(false);
  const [signupFormKey, setSignupFormKey] = useState(0);
  const [modoCrearSede, setModoCrearSede] = useState(false);
  const [rolCreacionInicial, setRolCreacionInicial] = useState<
    "LIDER" | "EMPLEADO" | "ADMIN" | "SUPER" | null
  >(null);

  const [afiliadoParaEditar, setAfiliadoParaEditar] = useState<Afiliado | null>(
    null,
  );
  const [liderAEditar, setLiderAEditar] = useState<Lider | null>(null);
  const [liderParaCelula, setLiderParaCelula] = useState<Lider | null>(null);
  const [liderParaNuevoAfiliado, setLiderParaNuevoAfiliado] = useState<
    string | null
  >(null);
  const [familiarDeIdParaNuevo, setFamiliarDeIdParaNuevo] = useState<
    string | null
  >(null);

  const [isFirstMemberAddition, setIsFirstMemberAddition] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [liderSimulado, setLiderSimulado] = useState<Lider | null>(null);

  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Error al cargar datos");
        return null;
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const session = dashboardData?.session;
  const rol = session?.rol || "";
  const userId = session?.id || "";
  const rolUpper = (rol || "").toUpperCase();

  const puedeVerBotonNuevo =
    rolUpper === "ADMIN" ||
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "SUPER";
  const puedeCrearRolSuper = rolUpper === "SUPER";
  const puedeSimular =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "ADMIN" ||
    rolUpper === "SUPER" ||
    rolUpper === "DOCUMENTADOR";
  const esAdminOSuper =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "ADMIN" ||
    rolUpper === "SUPER";
  const puedeVerReportesLideres = rolUpper === "ADMIN" || rolUpper === "SUPER";
  const esSedeSesion =
    rolUpper === "SEDE" ||
    (!!session &&
      esUsuarioSede({
        nombres: session.nombres,
        apellidos: session.apellidos,
        email: session.email,
        rol: session.rol,
      }));
  const vistaConPestanas = esAdminOSuper || esSedeSesion;
  const soloLecturaSede = esSedeSesion;
  const esLider = rolUpper === "LIDER";

  const handleSimular = () => {
    setLiderSimulado((prev) => (prev ? null : LIDER_SIMULADO));
  };

  const { data: configSis } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
  });

  const padronHabilitado = configSis?.padron === true;

  const { data: afiliados = [], isPending: isLoadingAfiliados } = useQuery({
    queryKey: ["afiliados-gl"],
    queryFn: () => obtenerAfiliadosAction(),
    enabled:
      isEstadisticasOpen ||
      (vistaConPestanas &&
        (activeTab === "Afiliados" ||
          activeTab === "Sede" ||
          !!liderParaCelula)) ||
      !vistaConPestanas ||
      (isReportesLideresOpen && puedeVerReportesLideres),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
  });

  const allUsers = (dashboardData?.usuarios || []) as Lider[];
  const allLideres = allUsers.filter(
    (u) =>
      (u.rol || "").toUpperCase() === "LIDER" ||
      (u.rol || "").toUpperCase() === "SEDE" ||
      esUsuarioSede(u),
  );
  const miPerfilDesdeLista = allUsers.find((l) => l.id === userId);
  const miPerfilGlobal: Lider | null =
    miPerfilDesdeLista ||
    (userId && session
      ? {
          id: userId,
          email: session.email || "",
          nombres: session.nombres || "",
          apellidos: session.apellidos || "",
          rol: session.rol || (esSedeSesion ? "SEDE" : ""),
          conteoAfiliados: 0,
        }
      : null);

  const rolesAdmin =
    rolUpper === "SUPER"
      ? ["ADMINISTRADOR", "SUPER", "ADMIN"]
      : ["ADMIN", "ADMINISTRADOR"];
  const administrativos = allUsers.filter((u) =>
    rolesAdmin.includes((u.rol || "").toUpperCase()),
  );
  const trabajadores = allUsers.filter((u) => esRolEmpleado(u.rol));
  const totalAfiliadosTrabajadores = trabajadores.reduce(
    (acc, u) => acc + (u.conteoAfiliados || 0),
    0,
  );
  const sedeUsuario =
    allUsers.find((u) => esUsuarioSede(u)) ||
    (esSedeSesion && miPerfilGlobal ? miPerfilGlobal : null);
  const totalAfiliadosSede = sedeUsuario?.conteoAfiliados || 0;
  const totalAfiliadosLideres = allUsers
    .filter((u) => (u.rol || "").toUpperCase() === "LIDER")
    .reduce((acc, u) => acc + (u.conteoAfiliados || 0), 0);
  const lugares = (dashboardData?.lugares || []) as Lugar[];

  const lideres = (() => {
    if (rolUpper === "LIDER" && userId) {
      const myLider = allLideres.find((l) => l.id === userId);
      const otherLideres = allLideres.filter((l) => l.id !== userId);
      return myLider ? [myLider, ...otherLideres] : allLideres;
    }
    return allLideres;
  })();

  const lideresBase = allUsers.filter(
    (u) => (u.rol || "").toUpperCase() === "LIDER",
  );

  const lideresVisibles = (() => {
    const base = liderSimulado ? [liderSimulado, ...lideres] : lideres;
    return base.filter(
      (l) => (l.rol || "").toUpperCase() !== "DOCUMENTADOR" && !esUsuarioSede(l),
    );
  })();

  const lideresParaFormulario = esAdminOSuper
    ? lideresVisibles
    : lideresVisibles.filter((l) => l.id === userId);

  const totalLideresRegistrados = lideresBase.length;
  const totalEmpleadosRegistrados = trabajadores.length;
  const totalAdministrativosRegistrados = administrativos.length;
  const totalMiembrosGeneral =
    totalAfiliadosSede + totalAfiliadosLideres + totalAfiliadosTrabajadores;

  useLayoutEffect(() => {
    medirOrigenLinea(activeTab);
    const onResize = () => medirOrigenLinea(activeTab);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [
    activeTab,
    medirOrigenLinea,
    esAdminOSuper,
    padronHabilitado,
    totalLideresRegistrados,
    totalEmpleadosRegistrados,
    totalAdministrativosRegistrados,
    totalMiembrosGeneral,
    totalAfiliadosSede,
  ]);

  const cargandoLideres = isDashboardLoading;
  const cargandoMiembros = isLoadingAfiliados || cargandoLideres;

  const fetchData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    await queryClient.invalidateQueries({ queryKey: ["afiliados-lider"] });
    await queryClient.invalidateQueries({ queryKey: ["afiliados-gl"] });
    await queryClient.invalidateQueries({ queryKey: ["conteo_padron"] });
  };

  const refreshAfterDeletion = () => {
    void fetchData();
  };

  const handleOpenCreateUsuarioModal = (
    rol: "LIDER" | "EMPLEADO" | "ADMIN" | "SUPER",
  ) => {
    if (rol === "SUPER" && !puedeCrearRolSuper) return;
    setLiderAEditar(null);
    setModoCrearSede(false);
    setRolCreacionInicial(rol);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleOpenCrearSedeModal = () => {
    setLiderAEditar(null);
    setModoCrearSede(true);
    setRolCreacionInicial(null);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleOpenEditLiderModal = (lider: Lider) => {
    setLiderAEditar(lider);
    setModoCrearSede(false);
    setRolCreacionInicial(null);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleSignupSuccess = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
    setModoCrearSede(false);
    setRolCreacionInicial(null);
    void fetchData();
  };

  const handleCloseSignupModal = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
    setModoCrearSede(false);
    setRolCreacionInicial(null);
  };

  const handleOpenAnadirAfiliadoModal = (
    liderId: string,
    isFirstMember = false,
    familiarDeId: string | null = null,
  ) => {
    setAfiliadoParaEditar(null);
    setLiderParaNuevoAfiliado(liderId);
    setIsFirstMemberAddition(isFirstMember);
    setFamiliarDeIdParaNuevo(familiarDeId);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (afiliado: Afiliado) => {
    setAfiliadoParaEditar(afiliado);
    setLiderParaNuevoAfiliado(null);
    setFamiliarDeIdParaNuevo(null);
    setIsFirstMemberAddition(false);
    setIsFormOpen(true);
  };

  const handleOpenCelula = (lider: Lider) => {
    if (!lider) return;
    setLiderParaCelula(lider);
  };

  const handleVolverDeCelula = () => {
    setLiderParaCelula(null);
  };

  const cambiarTab = (tab: Tab) => {
    if (
      soloLecturaSede &&
      (tab === "Mensajes" || tab === "Administrativos" || tab === "Padron")
    ) {
      return;
    }
    const prev = prevTabRef.current;
    const prevIdx = TAB_ORDER.indexOf(prev);
    const nextIdx = TAB_ORDER.indexOf(tab);
    setTabSlideDir(nextIdx >= prevIdx ? 1 : -1);
    prevTabRef.current = tab;
    medirOrigenLinea(tab);
    setActiveTab(tab);
    setLiderParaCelula(null);
  };

  const handleCloseFormModal = () => {
    setIsFormOpen(false);
  };

  const handleSaveAndCloseForm = async () => {
    setIsFormOpen(false);
    await fetchData();

    if (esLider) return;

    if (liderParaCelula) {
      const updatedLider = allUsers.find((l) => l.id === liderParaCelula.id);
      if (updatedLider) setLiderParaCelula(updatedLider);
    }
  };

  const rolSesionCelula = esSedeSesion ? "SEDE" : rol;

  return (
    <>
      {!isDashboardLoading && userId && (
        <ModalBienvenida
          userId={userId}
          conteoAfiliados={miPerfilGlobal?.conteoAfiliados || 0}
          nombreLider={miPerfilGlobal?.nombres || "Usuario"}
        />
      )}
      <div className="px-2 md:px-6 max-w-full overflow-x-hidden min-w-0 w-full">
        <ConfiguracionSistema showMetas={false} allowEditing={false} />
        <div className="flex flex-col mb-4 gap-3 min-w-0 w-full">
          <div className="flex flex-row items-center gap-2 md:gap-3 w-full min-w-0">
            <div
              className={`relative shrink-0 min-w-0 ${puedeSimular ? "group" : ""}`}
            >
              <h1
                className={`text-base sm:text-2xl font-bold text-black dark:text-white md:text-3xl flex items-center gap-1.5 md:gap-2 ${
                  puedeSimular
                    ? "cursor-pointer underline decoration-transparent underline-offset-[6px] decoration-2 transition-[text-decoration-color] duration-300 ease-in-out group-hover:decoration-black dark:group-hover:decoration-white"
                    : ""
                }`}
                onClick={puedeSimular ? handleSimular : undefined}
              >
                <span className="whitespace-nowrap">Gestión de Datos</span>
                <BarChart3 className="w-5 h-5 md:w-8 md:h-8 text-blue-600 shrink-0" />
              </h1>
              {puedeSimular && (
                <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 scale-95 whitespace-nowrap rounded-md bg-gray-900/95 dark:bg-gray-100 dark:text-gray-900 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg translate-y-1 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-100">
                  Click para simular un registro
                </span>
              )}
            </div>
            {vistaConPestanas && (
              <div className="relative flex-1 min-w-0 w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre"
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-md w-full bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
          {vistaConPestanas && (
            <div className="flex flex-row items-stretch gap-2 w-full">
              <Button
                onClick={() => setIsEstadisticasOpen(true)}
                variant="outline"
                className="gap-1.5 flex-1 min-w-0 text-xs md:text-xl font-bold border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-950/45 hover:bg-blue-100 dark:hover:bg-blue-950/65 backdrop-blur-sm shadow-none transition-colors"
              >
                <BarChart3 className="w-4 h-4 md:w-6 md:h-6 shrink-0" />{" "}
                Estadísticas
              </Button>
              {puedeVerBotonNuevo && (
                <div className="flex-1 min-w-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-1.5 w-full text-xs md:text-xl font-bold border-green-500 dark:border-green-600 text-green-700 dark:text-green-400 bg-white/70 dark:bg-white/5 hover:bg-green-100 dark:hover:bg-green-950/55 backdrop-blur-sm shadow-none transition-colors"
                      >
                        <UserPlus className="w-4 h-4 md:w-6 md:h-6 shrink-0" />{" "}
                        Nuevo
                        <ChevronDown className="w-4 h-4 md:w-5 md:h-5 opacity-80 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[10rem]">
                      <DropdownMenuItem
                        className="cursor-pointer font-semibold"
                        onClick={() => handleOpenCreateUsuarioModal("LIDER")}
                      >
                        Líder
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer font-semibold"
                        onClick={() =>
                          handleOpenCreateUsuarioModal("EMPLEADO")
                        }
                      >
                        Empleado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer font-semibold"
                        onClick={() => handleOpenCreateUsuarioModal("ADMIN")}
                      >
                        Admin
                      </DropdownMenuItem>
                      {puedeCrearRolSuper && (
                        <DropdownMenuItem
                          className="cursor-pointer font-semibold"
                          onClick={() =>
                            handleOpenCreateUsuarioModal("SUPER")
                          }
                        >
                          Super
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          )}
        </div>

        {isDashboardLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-14 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
            <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-gray-100 dark:bg-neutral-800 rounded-lg"
                />
              ))}
            </div>
          </div>
        ) : !vistaConPestanas ? (
          <>
            <MetaGeneral
              totalSede={totalAfiliadosSede}
              totalLideres={totalAfiliadosLideres}
              totalTrabajadores={totalAfiliadosTrabajadores}
              objetivoTotal={configSis?.objetivo_total || 0}
            />
            {miPerfilGlobal ? (
              <Celula
                mode="embedded"
                lider={miPerfilGlobal}
                onEditar={handleOpenEditModal}
                onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
                onDataChange={fetchData}
                rolUsuarioSesion={rolSesionCelula}
                usuarios={allUsers}
              />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
                No se encontró tu perfil de usuario.
              </div>
            )}
          </>
        ) : (
          <>
            <MetaGeneral
              totalSede={totalAfiliadosSede}
              totalLideres={totalAfiliadosLideres}
              totalTrabajadores={totalAfiliadosTrabajadores}
              objetivoTotal={configSis?.objetivo_total || 0}
            />
            <div className="mb-6 w-full min-w-0 bg-white dark:bg-neutral-950">
              <div
                ref={tabsRowRef}
                className="w-full min-w-0 pb-0 gap-1 grid grid-cols-4 md:flex md:flex-nowrap md:items-end"
              >
                {(
                  [
                    {
                      id: "Sede" as Tab,
                      label: `Sede (${totalAfiliadosSede})`,
                      icon: PiBuildingsDuotone,
                      show: true,
                    },
                    {
                      id: "Lideres" as Tab,
                      label: `Líderes (${totalLideresRegistrados})`,
                      icon: PiMedalDuotone,
                      show: true,
                    },
                    {
                      id: "Trabajadores" as Tab,
                      label: `Empleados (${totalEmpleadosRegistrados})`,
                      icon: PiBriefcaseDuotone,
                      show: true,
                    },
                    {
                      id: "Afiliados" as Tab,
                      label: `Miembros (${totalMiembrosGeneral})`,
                      icon: PiUsersThreeDuotone,
                      show: true,
                    },
                    {
                      id: "Padron" as Tab,
                      label: "Padrón",
                      icon: PiClipboardTextDuotone,
                      show: esAdminOSuper && padronHabilitado,
                    },
                    {
                      id: "Administrativos" as Tab,
                      label: `Administrativos (${totalAdministrativosRegistrados})`,
                      icon: PiShieldCheckDuotone,
                      show: esAdminOSuper,
                    },
                    {
                      id: "Mensajes" as Tab,
                      label: "Mensajes",
                      icon: PiChatCircleDotsDuotone,
                      show: esAdminOSuper,
                    },
                  ] as const
                )
                  .filter((t) => t.show)
                  .map((tab) => {
                    const Icon = tab.icon;
                    const activo = activeTab === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        type="button"
                        ref={(el) => {
                          tabBtnRefs.current[tab.id] = el;
                        }}
                        onClick={() => cambiarTab(tab.id)}
                        className={tabBtnClass(activo, tab.id)}
                        whileHover={{ y: activo ? 0 : -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.45, ease: tabEase }}
                      >
                        {activo && (
                          <motion.span
                            layoutId="pestana-orilla"
                            className={`pointer-events-none absolute inset-0 z-0 rounded-t-md md:rounded-t-lg border-[3px] md:border-4 border-b-0 ${TAB_THEMES[tab.id].activeBorder}`}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 28,
                              mass: 0.85,
                            }}
                          />
                        )}
                        <motion.span
                          className={`relative z-10 ${tabIconClass(activo, tab.id)}`}
                          animate={activo ? { scale: 1.08 } : { scale: 1 }}
                          transition={{ duration: 0.45, ease: tabEase }}
                        >
                          <Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                        </motion.span>
                        <span className="relative z-10 max-w-full text-center break-words hyphens-auto px-0.5">
                          {tab.label}
                        </span>
                      </motion.button>
                    );
                  })}
              </div>
              <div className="relative h-[3px] md:h-1 w-full overflow-hidden bg-gray-200 dark:bg-neutral-700">
                <motion.div
                  key={activeTab}
                  className={`absolute inset-0 ${TAB_THEMES[activeTab].lineBg}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, ease: tabEase }}
                  style={{ transformOrigin: tabLineOrigin }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false} custom={tabSlideDir}>
              {liderParaCelula && activeTab !== "Sede" ? (
                <motion.div
                  key={`celula-${liderParaCelula.id}`}
                  custom={tabSlideDir}
                  initial={{ opacity: 0, x: tabSlideDir * 36 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tabSlideDir * -28 }}
                  transition={{ duration: 0.45, ease: tabEase }}
                >
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={handleVolverDeCelula}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 underline underline-offset-[6px] decoration-red-600/90 hover:decoration-red-700 uppercase tracking-wide bg-transparent border-0 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 shrink-0" />
                      Volver
                    </button>
                  </div>
                  <Celula
                    mode="embedded"
                    lider={liderParaCelula}
                    onEditar={handleOpenEditModal}
                    onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
                    onDataChange={fetchData}
                    rolUsuarioSesion={rolSesionCelula}
                    afiliadosSimulados={
                      liderParaCelula.simulado ? AFILIADOS_SIMULADOS : undefined
                    }
                    usuarios={allUsers}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  custom={tabSlideDir}
                  initial={{ opacity: 0, x: tabSlideDir * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: tabSlideDir * -32 }}
                  transition={{ duration: 0.45, ease: tabEase }}
                >
                  {activeTab === "Sede" &&
                    (sedeUsuario ? (
                      <Celula
                        mode="embedded"
                        lider={sedeUsuario}
                        onEditar={handleOpenEditModal}
                        onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
                        onDataChange={fetchData}
                        rolUsuarioSesion={rolSesionCelula}
                        usuarios={allUsers}
                      />
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-dashed border-blue-400/70 dark:border-blue-700 bg-blue-50/80 dark:bg-blue-950/20 px-4 py-6">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 shrink-0">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-blue-900 dark:text-blue-200">
                              Aún no existe el usuario Sede
                            </p>
                            <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                              Créalo para afiliar desde sede y diferenciarlo del
                              avance de los líderes.
                            </p>
                          </div>
                        </div>
                        {esAdminOSuper && (
                          <Button
                            type="button"
                            onClick={handleOpenCrearSedeModal}
                            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            Crear Sede
                          </Button>
                        )}
                      </div>
                    ))}

                  {activeTab === "Lideres" && (
                    <Lideres
                      lideres={lideresVisibles}
                      onVerCelula={handleOpenCelula}
                      onEditar={handleOpenEditLiderModal}
                      rolUsuarioSesion={rolSesionCelula}
                      onDataChange={refreshAfterDeletion}
                      searchTerm={searchTerm}
                      idUsuarioSesion={userId}
                      isLoading={cargandoLideres}
                    />
                  )}
                  {activeTab === "Afiliados" && (
                    <AfiliadosGeneral
                      afiliados={afiliados}
                      lideres={allUsers}
                      onEditar={handleOpenEditModal}
                      onDataChange={refreshAfterDeletion}
                      searchTerm={searchTerm}
                      isLoading={cargandoMiembros}
                    />
                  )}
                  {activeTab === "Trabajadores" && (
                    <Lideres
                      lideres={trabajadores}
                      onVerCelula={handleOpenCelula}
                      onEditar={handleOpenEditLiderModal}
                      rolUsuarioSesion={rolSesionCelula}
                      onDataChange={refreshAfterDeletion}
                      searchTerm={searchTerm}
                      idUsuarioSesion={userId}
                      isLoading={cargandoLideres}
                    />
                  )}
                  {activeTab === "Padron" &&
                    esAdminOSuper &&
                    padronHabilitado && <Padron />}
                  {activeTab === "Administrativos" && (
                    <>
                      {puedeVerReportesLideres && (
                        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2 font-bold text-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950/60 text-sm md:text-base"
                            onClick={() => setIsReportesLideresOpen(true)}
                          >
                            <FileBarChart className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                            Reportes
                          </Button>
                        </div>
                      )}
                      <Lideres
                        lideres={administrativos}
                        onVerCelula={handleOpenCelula}
                        onEditar={handleOpenEditLiderModal}
                        rolUsuarioSesion={rolSesionCelula}
                        onDataChange={refreshAfterDeletion}
                        searchTerm={searchTerm}
                        idUsuarioSesion={userId}
                        isLoading={cargandoLideres}
                      />
                    </>
                  )}
                  {activeTab === "Mensajes" && esAdminOSuper && (
                    <Difusion
                      usuarios={allUsers}
                      puedeEnviar={esAdminOSuper}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <Transition show={isEstadisticasOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsEstadisticasOpen(false)}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="fixed inset-0 flex flex-col">
            <DialogPanel className="w-full h-full bg-white dark:bg-neutral-950 flex flex-col">
              <div className="flex justify-between items-center gap-4 px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-neutral-800 shrink-0 bg-white dark:bg-neutral-900/95 backdrop-blur-md z-10">
                <div className="flex flex-col min-w-0">
                  <h3 className="text-base md:text-xl font-black uppercase flex items-center gap-2 text-gray-900 dark:text-neutral-100 tracking-tight">
                    Estadísticas Generales
                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-neutral-500 font-bold uppercase mt-1 tracking-wide">
                    Análisis global de {afiliados.length} registros
                  </p>
                </div>
                <Button
                  onClick={() => setIsEstadisticasOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full shrink-0 h-9 w-9 border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 dark:text-neutral-400"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-neutral-950 px-4 py-4 md:px-6 md:py-6 lg:px-8">
                <div className="w-full">
                  <EstadisticasTabs
                    afiliados={afiliados}
                    mostrarOpcionSimular={puedeSimular}
                  />
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>

      <Form
        isOpen={isFormOpen}
        onClose={handleCloseFormModal}
        onSave={handleSaveAndCloseForm}
        afiliadoAEditar={afiliadoParaEditar}
        liderPredefinidoId={liderParaNuevoAfiliado}
        lugares={lugares}
        lideres={lideresParaFormulario}
        afiliados={afiliados}
        isFirstMember={isFirstMemberAddition}
        familiarDeId={familiarDeIdParaNuevo}
        datosLider={lideresParaFormulario.find(
          (l) => l.id === liderParaNuevoAfiliado,
        )}
      />

      <ReporteLideresClasificacion
        open={isReportesLideresOpen && puedeVerReportesLideres}
        onClose={() => setIsReportesLideresOpen(false)}
        lideres={lideresBase}
        afiliados={afiliados}
        mostrarOpcionSimular={rolUpper === "SUPER"}
      />

      <Transition show={isSignupModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={handleCloseSignupModal}
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
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <DialogPanel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-gray-200 dark:border-neutral-800">
                  <div className="p-4 md:p-6">
                    <SignupForm
                      key={signupFormKey}
                      initialData={liderAEditar}
                      onSuccess={handleSignupSuccess}
                      onClose={handleCloseSignupModal}
                      isModal
                      rolSesion={rol}
                      modoCrearSede={modoCrearSede}
                      rolInicial={rolCreacionInicial}
                    />
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
