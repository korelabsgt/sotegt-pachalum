"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserDataAction } from "./actions";

export default function useUserData() {
  const { data, isPending } = useQuery({
    queryKey: ["user-session"],
    queryFn: getUserDataAction,
    staleTime: 5 * 60 * 1000,
  });

  return {
    userId: data?.id || "",
    email: data?.email?.replace(/@.*$/, "") || "",
    nombres: data?.nombres || "",
    apellidos: data?.apellidos || "",
    rol: data?.rol || "",
    rol_id: data?.rol_id ?? null,
    cargando: isPending,
  };
}
