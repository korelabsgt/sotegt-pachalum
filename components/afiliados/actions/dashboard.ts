"use server";

import { createClient } from "@/utils/supabase/server";
import { getCachedAuthUsers } from "./cache";
import { obtenerMapaConteosAfiliados } from "./conteos";

export async function cargarDashboardAction() {
  console.time("🚀 TOTAL");
  const supabase = await createClient();

  console.time("🚀 getUser");
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  console.timeEnd("🚀 getUser");

  if (authError || !user) {
    console.timeEnd("🚀 TOTAL");
    return {
      error: "No hay sesión activa",
      session: null,
      usuarios: [],
      lugares: [],
    };
  }

  console.time("🚀 queries paralelas");
  const [profileRes, perfilesRes, conteoMap, lugaresRes, sectoresRes] =
    await Promise.all([
      supabase
        .from("info_perfil")
        .select("nombres, apellidos, rol_id, roles ( nombre )")
        .eq("user_id", user.id)
        .single(),

      supabase
        .from("info_perfil")
        .select(
          "user_id, nombres, apellidos, activo, rol_id, roles!inner ( id, nombre )",
        )
        .order("nombres", { ascending: true }),

      obtenerMapaConteosAfiliados(supabase),

      supabase
        .from("lugares")
        .select("id, nombre, sector_id")
        .order("nombre", { ascending: true }),

      supabase.from("sectores").select("id, nombre"),
    ]);
  console.timeEnd("🚀 queries paralelas");

  const profileAny = profileRes.data as {
    roles?: { nombre?: string };
  } | null;

  const sessionData = {
    id: user.id,
    email: user.email || "",
    nombres: profileRes.data?.nombres || "",
    apellidos: profileRes.data?.apellidos || "",
    rol: profileAny?.roles?.nombre || "",
    rol_id: profileRes.data?.rol_id || null,
  };

  const perfiles = perfilesRes.data || [];
  const sectores = sectoresRes.data || [];
  const sectorMap = new Map(sectores.map((s) => [s.id, s.nombre]));
  const authUsers = await getCachedAuthUsers();
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email || ""]));

  const usuarios = perfiles.map((p: any) => ({
    id: p.user_id,
    email: emailMap.get(p.user_id) || "",
    nombres: p.nombres,
    apellidos: p.apellidos,
    activo: p.activo,
    rol: p.roles?.nombre,
    rol_id: p.rol_id,
    conteoAfiliados: conteoMap.get(p.user_id)?.total || 0,
    conteoTitulares: conteoMap.get(p.user_id)?.titulares || 0,
    conteoFamiliares: conteoMap.get(p.user_id)?.familiares || 0,
  }));

  const lugares = (lugaresRes.data || []).map((l) => ({
    id: l.id,
    nombre: l.nombre,
    sector_id: l.sector_id ?? null,
    sector_nombre: l.sector_id ? sectorMap.get(l.sector_id) || null : null,
  }));

  console.timeEnd("🚀 TOTAL");

  return {
    error: null,
    session: sessionData,
    usuarios,
    lugares,
  };
}
