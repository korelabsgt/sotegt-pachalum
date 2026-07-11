"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import {
  Search,
  X,
  BarChart3,
  UserPlus,
  Users,
  ClipboardList,
  Shield,
  Crown,
  FileBarChart,
  Megaphone,
} from "lucide-react";

import EstadisticasTabs from "./estadisticas/EstadisticasTabs";
import ConfiguracionSistema from "../dashboard/ConfiguracionSistema";

import Lideres from "./Lideres";
import AfiliadosGeneral from "./AfiliadosGeneral";
import Form from "./forms/afiliados/Afiliados";
import Celula from "./Celula";
import Padron from "./Padron";
import ModalBienvenida from "./ModalBienvenida";
import Difusion from "./Difusion";
import { SignupForm } from "@/components/admin/sign-up/SignForm";
import type { Afiliado, Lider } from "./esquemas";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
} from "@headlessui/react";

import { LIDER_SIMULADO, AFILIADOS_SIMULADOS } from "./datosSimulados";
import { obtenerAfiliadosAction } from "./actions/afiliados";
import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import ReporteLideresClasificacion from "./reportes/ReporteLideresClasificacion";
import { useCelula } from "@/contexts/celula-context";

type Lugar = {
  id: number;
  nombre: string;
  sector_id: number | null;
  sector_nombre: string | null;
};

type Tab = "Lideres" | "Afiliados" | "Padron" | "Administrativos" | "Mensajes";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Ver() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { abrirCelula } = useCelula();

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

  const puedeCrearLider =
    rol === "ADMINISTRADOR" || rol === "SUPER" || rol === "ADMIN" || rol === "DOCUMENTADOR";
  const puedeSimular =
    rol === "ADMINISTRADOR" || rol === "SUPER" || rol === "ADMIN" || rol === "DOCUMENTADOR";
  const esAdminOSuper =
    rol === "ADMINISTRADOR" || rol === "SUPER" || rol === "ADMIN";
  const esLider = rol === "LIDER";
  const puedeVerReportesLideres = rol === "ADMIN" || rol === "SUPER";

  const [activeTab, setActiveTab] = useState<Tab>("Lideres");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEstadisticasOpen, setIsEstadisticasOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isReportesLideresOpen, setIsReportesLideresOpen] = useState(false);
  const [signupFormKey, setSignupFormKey] = useState(0);
  const [liderSimulado, setLiderSimulado] = useState<Lider | null>(null);

  const [afiliadoParaEditar, setAfiliadoParaEditar] = useState<Afiliado | null>(null);
  const [liderAEditar, setLiderAEditar] = useState<Lider | null>(null);
  const [liderParaNuevoAfiliado, setLiderParaNuevoAfiliado] = useState<string | null>(null);
  const [familiarDeIdParaNuevo, setFamiliarDeIdParaNuevo] = useState<string | null>(null);
  const [isFirstMemberAddition, setIsFirstMemberAddition] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSimular = () => {
    setLiderSimulado((prev) => (prev ? null : LIDER_SIMULADO));
  };

  const allUsers = (dashboardData?.usuarios || []) as Lider[];
  const allLideres = allUsers.filter((u) => u.rol === "LIDER");
  const miPerfilGlobal = allUsers.find((l) => l.id === userId);
  const rolesAdmin =
    rol === "SUPER" ? ["ADMINISTRADOR", "SUPER", "ADMIN"] : ["ADMIN", "ADMINISTRADOR"];
  const administrativos = allUsers.filter((u) => rolesAdmin.includes(u.rol || ""));
  const lugares = (dashboardData?.lugares || []) as Lugar[];

  const lideresBase = allLideres.filter((l) => l.rol !== "DOCUMENTADOR");

  const lideresVisibles = (() => {
    if (!esAdminOSuper) {
      if (!userId) return [];
      return lideresBase.filter((l) => l.id === userId);
    }
    const base = liderSimulado ? [liderSimulado, ...lideresBase] : lideresBase;
    if (rol === "LIDER" && userId) {
      const myLider = base.find((l) => l.id === userId);
      const otherLideres = base.filter((l) => l.id !== userId);
      return myLider ? [myLider, ...otherLideres] : base;
    }
    return base;
  })();

  const lideresParaFormulario = esAdminOSuper
    ? lideresVisibles
    : lideresVisibles.filter((l) => l.id === userId);

  const { data: afiliados = [], isPending: isLoadingAfiliados } = useQuery({
    queryKey: ["afiliados-gl"],
    queryFn: () => obtenerAfiliadosAction(),
    enabled:
      isEstadisticasOpen ||
      activeTab === "Afiliados" ||
      esLider ||
      (isReportesLideresOpen && puedeVerReportesLideres),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnMount: false,
  });

  const { data: configSis } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
    staleTime: 5 * 60_000,
    refetchOnMount: false,
  });

  const padronHabilitado = configSis?.padron === true;

  const fetchData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
    await queryClient.invalidateQueries({ queryKey: ["afiliados-lider"] });
    await queryClient.invalidateQueries({ queryKey: ["afiliados-gl"] });
    await queryClient.invalidateQueries({ queryKey: ["conteo_padron"] });
  };

  const refreshAfterDeletion = () => {
    void fetchData();
  };

  const handleOpenCreateLiderModal = () => {
    setLiderAEditar(null);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleOpenEditLiderModal = (lider: Lider) => {
    setLiderAEditar(lider);
    setSignupFormKey((k) => k + 1);
    setIsSignupModalOpen(true);
  };

  const handleSignupSuccess = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
    void fetchData();
  };

  const handleCloseSignupModal = () => {
    setIsSignupModalOpen(false);
    setLiderAEditar(null);
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

  const handleOpenCelulaModal = (liderItem: Lider) => {
    if (!liderItem) return;
    if (!esAdminOSuper && liderItem.id !== userId) return;
    abrirCelula(
      liderItem,
      liderItem.simulado ? AFILIADOS_SIMULADOS : undefined,
    );
    router.push("/protected/celula");
  };

  const handleCloseFormModal = () => {
    setIsFormOpen(false);
  };

  const handleSaveAndCloseForm = async () => {
    setIsFormOpen(false);
    await fetchData();
  };

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 min-w-0">
          <div className="flex items-center gap-4 w-full md:w-auto min-w-0">
            <div className={`relative min-w-0 ${puedeSimular ? "group" : ""}`}>
              <h1
                className={`text-2xl font-bold text-black dark:text-white md:text-3xl whitespace-nowrap flex items-center gap-2 truncate ${
                  puedeSimular
                    ? "cursor-pointer underline decoration-transparent underline-offset-[6px] decoration-2 transition-[text-decoration-color] duration-300 ease-in-out group-hover:decoration-black dark:group-hover:decoration-white"
                    : ""
                }`}
                onClick={puedeSimular ? handleSimular : undefined}
              >
                Gestión de Datos{" "}
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-blue-600 shrink-0" />
              </h1>
              {puedeSimular && (
                <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 scale-95 whitespace-nowrap rounded-md bg-gray-900/95 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg translate-y-1 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0 group-hover:delay-100">
                  Click para simular un registro
                </span>
              )}
            </div>
          </div>
          {esAdminOSuper && (
            <div className="relative w-full md:w-96">
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
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-2 w-full md:w-auto">
            {!esLider && (
              <Button
                onClick={() => setIsEstadisticasOpen(true)}
                variant="outline"
                className="gap-2 w-full text-xs md:text-xl font-bold border-blue-500 dark:border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-950/45 hover:bg-blue-100 dark:hover:bg-blue-950/65 backdrop-blur-sm shadow-none transition-colors"
              >
                <BarChart3 className="w-4 h-4 md:w-6 md:h-6" /> Estadísticas
              </Button>
            )}
            {puedeCrearLider && (
              <Button
                onClick={handleOpenCreateLiderModal}
                variant="outline"
                className="gap-2 w-full text-xs md:text-xl font-bold border-green-500 dark:border-green-600 text-green-700 dark:text-green-400 bg-white/70 dark:bg-white/5 hover:bg-green-100 dark:hover:bg-green-950/55 backdrop-blur-sm shadow-none transition-colors"
              >
                <UserPlus className="w-4 h-4 md:w-6 md:h-6" /> Nuevo Líder
              </Button>
            )}
          </div>
        </div>

        {isDashboardLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-14 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
              ))}
            </div>
          </div>
        ) : esLider ? (
          miPerfilGlobal ? (
            <Celula
              mode="embedded"
              lider={miPerfilGlobal}
              onEditar={handleOpenEditModal}
              onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
              onDataChange={fetchData}
              rolUsuarioSesion={rol}
              usuarios={allUsers}
            />
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
              No se encontró tu perfil de líder.
            </div>
          )
        ) : (
          <>
            <div className="flex border-b border-gray-200 dark:border-neutral-800 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap w-full min-w-0">
              <button
                onClick={() => setActiveTab("Lideres")}
                className={`px-4 py-3 text-sm md:text-base font-black uppercase flex items-center gap-2 transition-all ${
                  activeTab === "Lideres"
                    ? "border-b-4 border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-100/90 dark:bg-orange-950/55"
                    : "text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50/80 dark:hover:bg-orange-950/30 border-b-4 border-transparent"
                }`}
              >
                <Crown className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === "Lideres" ? "text-orange-500" : ""}`} />
                Líderes
              </button>

              <button
                onClick={() => setActiveTab("Afiliados")}
                className={`px-4 py-3 text-sm md:text-base font-black uppercase flex items-center gap-2 transition-all ${
                  activeTab === "Afiliados"
                    ? "border-b-4 border-purple-600 text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/30"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-4 border-transparent"
                }`}
              >
                <Users className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === "Afiliados" ? "text-purple-600" : ""}`} />
                Miembros
              </button>

              {esAdminOSuper && padronHabilitado && (
                <button
                  onClick={() => setActiveTab("Padron")}
                  className={`px-4 py-3 text-sm md:text-base font-black uppercase flex items-center gap-2 transition-all ${
                    activeTab === "Padron"
                      ? "border-b-4 border-teal-600 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-4 border-transparent"
                  }`}
                >
                  <ClipboardList className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === "Padron" ? "text-teal-600" : ""}`} />
                  Padrón
                </button>
              )}

              {esAdminOSuper && (
                <button
                  onClick={() => setActiveTab("Administrativos")}
                  className={`px-4 py-3 text-sm md:text-base font-black uppercase flex items-center gap-2 transition-all ${
                    activeTab === "Administrativos"
                      ? "border-b-4 border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                      : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-4 border-transparent"
                  }`}
                >
                  <Shield className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === "Administrativos" ? "text-blue-600" : ""}`} />
                  Administrativos
                </button>
              )}

              <button
                onClick={() => setActiveTab("Mensajes")}
                className={`px-4 py-3 text-sm md:text-base font-black uppercase flex items-center gap-2 transition-all ${
                  activeTab === "Mensajes"
                    ? "border-b-4 border-green-500 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-950/30"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border-b-4 border-transparent"
                }`}
              >
                <Megaphone className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === "Mensajes" ? "text-green-600" : ""}`} />
                Mensajes
              </button>
            </div>

            {activeTab === "Lideres" && (
              <Lideres
                lideres={lideresVisibles}
                onVerCelula={handleOpenCelulaModal}
                onEditar={handleOpenEditLiderModal}
                rolUsuarioSesion={rol}
                onDataChange={refreshAfterDeletion}
                searchTerm={searchTerm}
                idUsuarioSesion={userId}
                isLoading={isDashboardLoading}
              />
            )}
            {activeTab === "Afiliados" && (
              <AfiliadosGeneral
                afiliados={afiliados}
                lideres={lideresVisibles}
                onEditar={handleOpenEditModal}
                onDataChange={refreshAfterDeletion}
                searchTerm={searchTerm}
                isLoading={isLoadingAfiliados}
                idUsuarioSesion={userId}
                rolUsuarioSesion={rol}
              />
            )}
            {activeTab === "Padron" && padronHabilitado && <Padron />}
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
                  onVerCelula={handleOpenCelulaModal}
                  onEditar={handleOpenEditLiderModal}
                  rolUsuarioSesion={rol}
                  onDataChange={refreshAfterDeletion}
                  searchTerm={searchTerm}
                  idUsuarioSesion={userId}
                  isLoading={isDashboardLoading}
                  hideMeta
                  showRole
                />
              </>
            )}
            {activeTab === "Mensajes" && (
              <Difusion usuarios={allUsers} puedeEnviar={esAdminOSuper} />
            )}
          </>
        )}
      </div>

      <Transition show={isEstadisticasOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsEstadisticasOpen(false)}>
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
        datosLider={lideresParaFormulario.find((l) => l.id === liderParaNuevoAfiliado)}
      />

      <ReporteLideresClasificacion
        open={isReportesLideresOpen && puedeVerReportesLideres}
        onClose={() => setIsReportesLideresOpen(false)}
        lideres={lideresBase}
        afiliados={afiliados}
        mostrarOpcionSimular={String(rol ?? "").toUpperCase() === "SUPER"}
      />

      <Transition show={isSignupModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseSignupModal}>
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
