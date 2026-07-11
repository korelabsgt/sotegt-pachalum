"use client";

import { signOutAction } from "@/app/actions/usuarios";
import Link from "next/link";
import { Button } from "./ui/button";
import useUserData from "@/hooks/sesion/useUserData";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import ConfiguracionModal from "./ConfiguracionModal";
import NotificationBell from "./NotificationBell";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const headerIconBtn =
  "group h-10 w-10 p-0 rounded-full shrink-0 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800/50 transition-colors";

export default function AuthButton() {
  const { email, nombres, apellidos, rol, cargando } = useUserData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleSignOut = async () => {
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");

    const confirmacion = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Se cerrará tu sesión actual en el sistema.",
      icon: "question",
      background: isDark ? "#0a0a0a" : "#ffffff",
      color: isDark ? "#f5f5f5" : "#171717",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: isDark ? "swal-dark-popup" : "swal-light-popup",
        title: isDark ? "swal-dark-title" : "swal-light-title",
        htmlContainer: isDark ? "swal-dark-html" : "swal-light-html",
        confirmButton: isDark ? "swal-btn-outline-red" : "swal-btn-outline-red-light",
        cancelButton: isDark ? "swal-btn-outline-blue" : "swal-btn-outline-blue-light",
        actions: "swal-actions-spaced",
      },
    });

    if (!confirmacion.isConfirmed) return;

    setCerrandoSesion(true);
    try {
      await signOutAction();
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : String(err);
      if (!mensaje.includes("NEXT_REDIRECT")) {
        setCerrandoSesion(false);
      }
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-5 w-28 bg-gray-200 rounded animate-pulse mt-1" />
      </div>
    );
  }

  return email ? (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-col items-end text-right leading-tight">
        <span className="text-xs md:text-xl font-bold">
          {nombres} {apellidos}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 mt-1">
        <div className="flex items-center gap-2">
          {(rol === "ADMIN" || rol === "SUPER" || rol === "ADMINISTRADOR") && (
            <ConfiguracionModal />
          )}
          <Button
            type="button"
            variant="ghost"
            className={headerIconBtn}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-5 w-5 transition-transform duration-500 ${
                isRefreshing
                  ? "animate-spin"
                  : "group-hover:rotate-180"
              }`}
            />
          </Button>
          <NotificationBell className={headerIconBtn} />
          <AnimatedThemeToggler duration={600} className={headerIconBtn} />
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={cerrandoSesion}
          className="text-sm md:text-lg font-semibold text-red-600 hover:text-red-700 underline underline-offset-[6px] decoration-red-600/90 hover:decoration-red-700 bg-transparent border-0 cursor-pointer px-1 py-0.5 transition-colors disabled:opacity-50"
        >
          {cerrandoSesion ? "Cerrando..." : "Cerrar Sesión"}
        </button>
      </div>
    </div>
  ) : (
    <div className="flex gap-2 items-center">
      <Button
        asChild
        variant="ghost"
        className="h-10 px-5 rounded-full text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors text-xs md:text-sm font-semibold"
      >
        <Link href="/sign-in">Iniciar Sesión</Link>
      </Button>
      <AnimatedThemeToggler
        variant="hexagon"
        duration={600}
        fromCenter
        className={headerIconBtn}
      />
    </div>
  );
}
