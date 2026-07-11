"use server";

import { createClient } from "@/utils/supabase/server";
import supabaseAdmin from "@/utils/supabase/admin";
import { getUserDataAction } from "@/hooks/sesion/actions";

export type Politica = { id: number; nombre: string };
export type SubPolitica = { id: number; politica_id: number; nombre: string };
export type Lugar = { id: number; nombre: string; sector_id: number | null; sector_nombre: string | null };

export type CrearCatalogoResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function esAdminCatalogo(): Promise<boolean> {
  const user = await getUserDataAction();
  if (!user?.rol) return false;
  const rol = user.rol.toUpperCase();
  return rol === "SUPER" || rol === "ADMIN" || rol === "ADMINISTRADOR";
}

export async function obtenerPoliticasAction(): Promise<Politica[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sis_politicas")
    .select("id, nombre")
    .order("nombre");
  if (error) return [];
  return data ?? [];
}

export async function obtenerSubPoliticasAction(politica_id: number): Promise<SubPolitica[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sis_politicas_sub")
    .select("id, politica_id, nombre")
    .eq("politica_id", politica_id)
    .order("nombre");
  if (error) return [];
  return data ?? [];
}

export async function crearSubPoliticaAction(
  politica_id: number,
  nombre: string,
): Promise<CrearCatalogoResult<SubPolitica>> {
  if (!(await esAdminCatalogo())) {
    return { ok: false, error: "No tienes permiso para crear sub-programas de interés" };
  }

  const trimmed = nombre.trim();
  if (!trimmed) {
    return { ok: false, error: "El nombre es requerido" };
  }

  const { data: existing } = await supabaseAdmin
    .from("sis_politicas_sub")
    .select("id, politica_id, nombre")
    .eq("politica_id", politica_id)
    .ilike("nombre", trimmed)
    .maybeSingle();
  if (existing) return { ok: true, data: existing };

  const { data, error } = await supabaseAdmin
    .from("sis_politicas_sub")
    .insert({ politica_id, nombre: trimmed })
    .select("id, politica_id, nombre")
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No se pudo crear el sub-programa de interés" };
  return { ok: true, data };
}

export async function crearPoliticaAction(
  nombre: string,
): Promise<CrearCatalogoResult<Politica>> {
  if (!(await esAdminCatalogo())) {
    return { ok: false, error: "No tienes permiso para crear programas de interés" };
  }

  const trimmed = nombre.trim();
  if (!trimmed) {
    return { ok: false, error: "El nombre es requerido" };
  }

  const { data: existing } = await supabaseAdmin
    .from("sis_politicas")
    .select("id, nombre")
    .ilike("nombre", trimmed)
    .maybeSingle();
  if (existing) return { ok: true, data: existing };

  const { data: maxRow } = await supabaseAdmin
    .from("sis_politicas")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextId = (maxRow?.id ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("sis_politicas")
    .insert({ id: nextId, nombre: trimmed })
    .select("id, nombre")
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "No se pudo crear el programa de interés" };
  return { ok: true, data };
}

export async function obtenerCondicionesEspecialesAction(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("afiliados")
    .select("condicion_especial");
  if (error) return [];
  return Array.from(
    new Set((data ?? []).map((d: any) => d.condicion_especial).filter(Boolean)),
  ) as string[];
}

export async function obtenerLugaresAction(): Promise<Lugar[]> {
  const supabase = await createClient();
  const [lugaresRes, sectoresRes] = await Promise.all([
    supabase.from("lugares").select("id, nombre, sector_id").order("nombre"),
    supabase.from("sectores").select("id, nombre").order("nombre"),
  ]);

  const lugares = lugaresRes.data ?? [];
  const sectores = sectoresRes.data ?? [];
  const sectorMap = new Map(sectores.map((s: any) => [s.id, s.nombre]));

  return lugares.map((l: any) => ({
    id: l.id,
    nombre: l.nombre,
    sector_id: l.sector_id,
    sector_nombre: l.sector_id ? sectorMap.get(l.sector_id) || null : null,
  }));
}

export type Sector = { id: number; nombre: string };

export async function crearLugarAction(nombre: string, sector_id: number): Promise<Lugar | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lugares")
    .insert({ nombre: nombre.trim(), sector_id })
    .select("id, nombre, sector_id")
    .single();
  if (error) return null;
  if (!data) return null;

  // Resolve sector name
  const { data: sector } = await supabase.from("sectores").select("nombre").eq("id", sector_id).single();
  return {
    id: data.id,
    nombre: data.nombre,
    sector_id: data.sector_id,
    sector_nombre: sector?.nombre || null,
  };
}

export async function obtenerSectoresAction(): Promise<Sector[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sectores")
    .select("id, nombre");
  if (error) return [];
  
  const sectores = data ?? [];
  return sectores.sort((a, b) => {
    if (a.id === 0) return 1;
    if (b.id === 0) return -1;
    return a.id - b.id;
  });
}

export type Beneficio = { id: number; nombre: string };

export async function obtenerBeneficiosAction(): Promise<Beneficio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("beneficios")
    .select("id, nombre")
    .order("nombre");
  if (error) return [];
  return data ?? [];
}

export async function crearBeneficioAction(nombre: string): Promise<Beneficio | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("beneficios")
    .insert({ nombre: nombre.trim() })
    .select("id, nombre")
    .single();
  if (error) return null;
  return data;
}

export async function crearSectorAction(nombre: string): Promise<Sector | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sectores")
    .insert({ nombre: nombre.trim() })
    .select("id, nombre")
    .single();
  if (error) return null;
  return data;
}

export async function actualizarSectorAction(id: number, nombre: string): Promise<Sector | null> {
  const supabase = await createClient();
  const trimmed = nombre.trim();
  if (!trimmed) return null;

  const { data: existing } = await supabase
    .from("sectores")
    .select("id")
    .ilike("nombre", trimmed)
    .neq("id", id)
    .maybeSingle();
  if (existing) return null;

  const { data, error } = await supabase
    .from("sectores")
    .update({ nombre: trimmed })
    .eq("id", id)
    .select("id, nombre")
    .single();
  if (error) return null;
  return data;
}

export async function eliminarSectorAction(id: number): Promise<{ ok: boolean; error?: string }> {
  if (id === 0) return { ok: false, error: "No se puede eliminar este sector" };

  const supabase = await createClient();
  const { count } = await supabase
    .from("lugares")
    .select("id", { count: "exact", head: true })
    .eq("sector_id", id);

  if (count && count > 0) {
    return { ok: false, error: `Este sector tiene ${count} lugar(es) asociado(s)` };
  }

  const { error } = await supabase.from("sectores").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function actualizarLugarAction(id: number, nombre: string): Promise<Lugar | null> {
  const supabase = await createClient();
  const trimmed = nombre.trim();
  if (!trimmed) return null;

  const { data: current } = await supabase
    .from("lugares")
    .select("sector_id")
    .eq("id", id)
    .single();
  if (!current?.sector_id) return null;

  const { data: existing } = await supabase
    .from("lugares")
    .select("id")
    .eq("sector_id", current.sector_id)
    .ilike("nombre", trimmed)
    .neq("id", id)
    .maybeSingle();
  if (existing) return null;

  const { data, error } = await supabase
    .from("lugares")
    .update({ nombre: trimmed })
    .eq("id", id)
    .select("id, nombre, sector_id")
    .single();
  if (error || !data) return null;

  const { data: sector } = await supabase
    .from("sectores")
    .select("nombre")
    .eq("id", data.sector_id)
    .single();

  return {
    id: data.id,
    nombre: data.nombre,
    sector_id: data.sector_id,
    sector_nombre: sector?.nombre || null,
  };
}

export async function eliminarLugarAction(id: number): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("afiliados")
    .select("id", { count: "exact", head: true })
    .eq("lugar_id", id);

  if (count && count > 0) {
    return { ok: false, error: `El lugar tiene ${count} afiliado(s) asociado(s)` };
  }

  const { error } = await supabase.from("lugares").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function obtenerPoliticasConSubsAction(): Promise<
  { politica: string; subs: string[] }[]
> {
  const supabase = await createClient();
  const [polRes, subRes] = await Promise.all([
    supabase.from("sis_politicas").select("id, nombre").order("nombre"),
    supabase.from("sis_politicas_sub").select("id, politica_id, nombre").order("nombre"),
  ]);

  const politicas = polRes.data ?? [];
  const subs = subRes.data ?? [];

  return politicas.map((p: any) => ({
    politica: p.nombre,
    subs: subs
      .filter((s: any) => s.politica_id === p.id)
      .map((s: any) => s.nombre),
  }));
}
