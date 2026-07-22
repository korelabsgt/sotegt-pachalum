"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUpAction, updateUsuarioAction, obtenerEmailUsuarioAction } from "@/app/actions/usuarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { toast } from "@/lib/toast";
import PasswordSection from "@/components/admin/sign-up/PasswordSection";
import useUserData from "@/hooks/sesion/useUserData";
import { createClient } from "@/utils/supabase/client";
import { NUEVO_LIDER_SIMULADO } from "@/components/afiliados/datosSimulados";

interface RolDisponible {
  id: number;
  nombre: string;
}
interface SignupFormProps {
  onSuccess: () => void;
  onClose: () => void;
  isModal?: boolean;
  initialData?: any;
  rolSesion?: string;
  modoCrearSede?: boolean;
  rolInicial?: "LIDER" | "EMPLEADO" | "ADMIN" | "SUPER" | null;
}

export function SignupForm({
  onSuccess,
  onClose,
  isModal = false,
  initialData,
  rolSesion,
  modoCrearSede = false,
  rolInicial = null,
}: SignupFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { rol: rolHook } = useUserData();
  const rolUsuarioSesion = rolSesion ?? rolHook;

  const modoSimulacion =
    !isEdit &&
    !modoCrearSede &&
    rolUsuarioSesion?.toUpperCase() === "DOCUMENTADOR";

  const [simulacionLista, setSimulacionLista] = useState(false);
  const mostrarSkeleton = modoSimulacion && !simulacionLista;

  const [loading, setLoading] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);
  const [showPasswordAccordion, setShowPasswordAccordion] = useState(!isEdit);

  const [nombres, setNombres] = useState(
    modoCrearSede ? "Sede" : initialData?.nombres || "",
  );
  const [apellidos, setApellidos] = useState(
    modoCrearSede ? "Central" : initialData?.apellidos || "",
  );
  const [email, setEmail] = useState(
    modoCrearSede
      ? "sede"
      : initialData?.email?.replace(/@.*$/, "") || "",
  );
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [rol_id, setRolId] = useState<string>(
    initialData?.rol_id?.toString() || "",
  );

  const nombresValido = nombres.trim() !== "";
  const apellidosValido = apellidos.trim() !== "";
  const emailValido = email.trim() !== "";
  const rolValido = rol_id !== "";

  const passwordIngresada = password.length > 0;
  const cumpleRequisitos =
    isEdit && !passwordIngresada
      ? true
      : /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(
          password,
        );
  const contraseñasCoinciden =
    isEdit && !passwordIngresada
      ? true
      : password === confirmar && passwordIngresada;

  const formularioValido =
    nombresValido &&
    apellidosValido &&
    emailValido &&
    rolValido &&
    contraseñasCoinciden &&
    cumpleRequisitos;

  useEffect(() => {
    if (!initialData) return;
    setNombres(initialData.nombres || "");
    setApellidos(initialData.apellidos || "");
    setRolId(initialData.rol_id?.toString() || "");
    setPassword("");
    setConfirmar("");
    setShowPasswordAccordion(false);
  }, [initialData]);

  useEffect(() => {
    if (!isEdit || !initialData?.id) return;

    let cancelled = false;

    const cargarEmail = async () => {
      const correo =
        (initialData.email as string | undefined)?.replace(/@.*$/, "") ||
        (await obtenerEmailUsuarioAction(initialData.id as string));
      if (!cancelled) setEmail(correo);
    };

    void cargarEmail();

    return () => {
      cancelled = true;
    };
  }, [isEdit, initialData?.id, initialData?.email]);

  useEffect(() => {
    const fetchDatos = async () => {
      const supabase = createClient();
      const { data: r } = await supabase.from("roles").select("id, nombre");
      if (r) {
        setRolesDisponibles(r);
        if (!initialData?.rol_id) {
          if (modoCrearSede) {
            const rolSede = r.find(
              (role) =>
                role.id === 5 || role.nombre.toUpperCase() === "SEDE",
            );
            if (rolSede) setRolId(rolSede.id.toString());
          } else if (rolInicial === "EMPLEADO") {
            const rolEmpleado = r.find((role) => {
              const n = role.nombre.toUpperCase();
              return n === "EMPLEADO" || n === "TRABAJADOR";
            });
            if (rolEmpleado) setRolId(rolEmpleado.id.toString());
          } else if (rolInicial === "ADMIN") {
            const rolAdmin = r.find(
              (role) => role.nombre.toUpperCase() === "ADMIN",
            );
            if (rolAdmin) setRolId(rolAdmin.id.toString());
          } else if (
            rolInicial === "SUPER" &&
            rolUsuarioSesion?.toUpperCase() === "SUPER"
          ) {
            const rolSuper = r.find(
              (role) => role.nombre.toUpperCase() === "SUPER",
            );
            if (rolSuper) setRolId(rolSuper.id.toString());
          } else if (rolInicial === "LIDER" || !rolInicial) {
            const rolLider = r.find(
              (role) =>
                role.nombre.toUpperCase() === "LIDER" ||
                role.nombre.toUpperCase() === "LÍDER",
            );
            if (rolLider) setRolId(rolLider.id.toString());
          }
        }
      }
    };
    fetchDatos();
  }, [initialData, modoCrearSede, rolInicial, rolUsuarioSesion]);

  useEffect(() => {
    if (!modoSimulacion) return;

    const timer = setTimeout(() => {
      setNombres(NUEVO_LIDER_SIMULADO.nombres);
      setApellidos(NUEVO_LIDER_SIMULADO.apellidos);
      setEmail(NUEVO_LIDER_SIMULADO.email);
      setPassword(NUEVO_LIDER_SIMULADO.password);
      setConfirmar(NUEVO_LIDER_SIMULADO.password);
      setSimulacionLista(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [modoSimulacion]);

  const esSuperSesion = rolUsuarioSesion?.toUpperCase() === "SUPER";
  const rolFijoDesdeMenu =
    Boolean(rolInicial) &&
    !isEdit &&
    !(rolInicial === "SUPER" && !esSuperSesion);
  const editandoSede =
    isEdit &&
    ((initialData?.rol || "").toUpperCase() === "SEDE" ||
      Number(initialData?.rol_id) === 5);
  const rolesParaSelector = rolesDisponibles.filter((r) => {
    const nombre = r.nombre.toUpperCase();
    if (!esSuperSesion && nombre === "SUPER") return false;
    if (modoCrearSede) return nombre === "SEDE" || r.id === 5;
    if (rolFijoDesdeMenu) {
      if (rolInicial === "EMPLEADO") {
        return nombre === "EMPLEADO" || nombre === "TRABAJADOR";
      }
      if (rolInicial === "ADMIN") return nombre === "ADMIN";
      if (rolInicial === "SUPER") return nombre === "SUPER";
      return nombre === "LIDER" || nombre === "LÍDER";
    }
    if (editandoSede) return true;
    return nombre !== "SEDE";
  });

  const tituloCreacion =
    rolInicial === "EMPLEADO"
      ? "Nuevo Usuario Empleado"
      : rolInicial === "ADMIN"
        ? "Nuevo Usuario Admin"
        : rolInicial === "SUPER"
          ? "Nuevo Usuario Super"
          : "Nuevo Usuario Líder";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (modoSimulacion) {
      toast.info("Modo simulación: el usuario líder no se creó realmente.");
      onSuccess();
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const localPart = email.trim().replace(/@.*$/, "").replace(/\s/g, "");
    const finalEmail = `${localPart}@app.com`;
    formData.set("email", finalEmail);
    formData.set("nombres", nombres.trim());
    formData.set("apellidos", apellidos.trim());
    formData.set("rol_id", rol_id);
    if (isEdit) {
      formData.set("id", String(initialData.user_id || initialData.id || ""));
    }

    let result;
    if (isEdit) {
      result = await updateUsuarioAction(formData);
    } else {
      result = await signUpAction(formData);
    }

    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success(result.success);
      onSuccess();
      if (!isModal) router.refresh();
    }
  };

  return (
    <div className="flex flex-col w-full mx-auto md:max-w-xl gap-4 relative text-left">
      <div className="flex justify-between items-center border-b border-gray-200 dark:border-neutral-800 pb-3">
        <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">
          {isEdit
            ? "Editar Perfil de Acceso"
            : modoCrearSede
              ? "Crear Usuario Sede"
              : modoSimulacion
                ? `${tituloCreacion} (Simulación)`
                : tituloCreacion}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 bg-transparent border-0 p-0 cursor-pointer text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline underline-offset-2 decoration-red-600/90 dark:decoration-red-400/90 uppercase tracking-wide"
        >
          Cerrar
        </button>
      </div>

      {mostrarSkeleton ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          <p className="text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
            Cargando datos de simulación...
          </p>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-gray-900 dark:text-gray-100">
                Nombres
              </Label>
              <Input
                name="nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                readOnly={modoCrearSede}
                className="h-12 text-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-600"
              />
            </div>
            <div className="flex-1">
              <Label className="text-gray-900 dark:text-gray-100">
                Apellidos
              </Label>
              <Input
                name="apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                readOnly={modoCrearSede}
                className="h-12 text-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-600"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-900 dark:text-gray-100">
              Usuario de acceso
            </Label>
            <Input
              name="email"
              type="text"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value.replace(/@.*$/, "").replace(/\s/g, ""))
              }
              readOnly={modoCrearSede}
              placeholder="Ingrese su usuario"
              className="h-12 text-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-neutral-600"
            />
          </div>

          <div>
            <Label className="text-gray-900 dark:text-gray-100">
              Asignar Rol
            </Label>
            <select
              name="rol_id"
              value={rol_id}
              onChange={(e) => setRolId(e.target.value)}
              disabled={modoCrearSede || rolFijoDesdeMenu}
              className="w-full border border-gray-300 dark:border-neutral-600 rounded h-12 px-3 text-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <option value="">Seleccione un rol...</option>
              {rolesParaSelector.map((r) => (
                <option key={r.id} value={r.id.toString()}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="border border-gray-200 dark:border-neutral-700 rounded-md bg-gray-50 dark:bg-neutral-800/60 py-2 px-2">
            {isEdit ? (
              <button
                type="button"
                onClick={() => setShowPasswordAccordion(!showPasswordAccordion)}
                className="flex items-center justify-between w-full text-blue-700 dark:text-blue-400 font-semibold px-1 py-1 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                <span
                  className={
                    showPasswordAccordion ? "" : "underline underline-offset-2"
                  }
                >
                  {showPasswordAccordion
                    ? "Ingresa los datos de la contraseña"
                    : "Click aquí para cambiar contraseña"}
                </span>
                <ChevronUp
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    showPasswordAccordion ? "rotate-0" : "rotate-180"
                  }`}
                />
              </button>
            ) : (
              <h4 className="font-bold text-gray-700 dark:text-neutral-200 px-1">
                Configurar Seguridad
              </h4>
            )}

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                showPasswordAccordion ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`${isEdit ? "pt-3" : "pt-2"} ${!isEdit || showPasswordAccordion ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
                >
                  <PasswordSection
                    password={password}
                    confirmar={confirmar}
                    onPasswordChange={setPassword}
                    onConfirmarChange={setConfirmar}
                  />
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!formularioValido || loading}
            className="h-14 text-xl w-full bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
          >
            {loading
              ? "Procesando..."
              : isEdit
                ? "Actualizar Datos"
                : modoCrearSede
                  ? "Crear Sede"
                  : modoSimulacion
                    ? "Simular Creación"
                    : "Crear Acceso"}
          </Button>
        </form>
      )}
    </div>
  );
}
