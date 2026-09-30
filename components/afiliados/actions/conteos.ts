import type { SupabaseClient } from "@supabase/supabase-js";

export type ConteoAfiliadosLider = {
  total: number;
  titulares: number;
  familiares: number;
};

type FilaConteoRpc = {
  lider_id: string;
  total: number;
  titulares: number;
  familiares: number;
};

type FilaAfiliadoConteo = {
  lider_id: string | null;
  familiar_de: string | null;
};

const PAGE_SIZE = 1000;

function incrementar(
  map: Map<string, ConteoAfiliadosLider>,
  liderId: string,
  esFamiliar: boolean,
) {
  const current = map.get(liderId) || {
    total: 0,
    titulares: 0,
    familiares: 0,
  };
  current.total += 1;
  if (esFamiliar) {
    current.familiares += 1;
  } else {
    current.titulares += 1;
  }
  map.set(liderId, current);
}

async function conteosPorPaginacion(
  supabase: SupabaseClient,
): Promise<Map<string, ConteoAfiliadosLider>> {
  const map = new Map<string, ConteoAfiliadosLider>();
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("afiliados")
      .select("lider_id, familiar_de")
      .not("lider_id", "is", null)
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data?.length) break;

    for (const row of data as FilaAfiliadoConteo[]) {
      if (!row.lider_id) continue;
      incrementar(map, row.lider_id, Boolean(row.familiar_de));
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return map;
}

export async function obtenerMapaConteosAfiliados(
  supabase: SupabaseClient,
): Promise<Map<string, ConteoAfiliadosLider>> {
  const { data, error } = await supabase.rpc("conteos_afiliados_por_lider");

  if (!error && data) {
    const map = new Map<string, ConteoAfiliadosLider>();
    for (const row of data as FilaConteoRpc[]) {
      if (!row.lider_id) continue;
      map.set(row.lider_id, {
        total: row.total,
        titulares: row.titulares,
        familiares: row.familiares,
      });
    }
    return map;
  }

  return conteosPorPaginacion(supabase);
}
