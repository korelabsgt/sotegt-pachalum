import type { Afiliado, Lider } from "@/components/afiliados/esquemas";

const STORAGE_KEY = "sote_celula_vista";

export type CelulaSession = {
  lider: Lider;
  afiliadosSimulados?: Afiliado[];
};

export function persistCelulaSession(lider: Lider, afiliadosSimulados?: Afiliado[]) {
  if (typeof window === "undefined") return;
  const payload: CelulaSession = { lider, afiliadosSimulados };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function readCelulaSession(): CelulaSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CelulaSession;
  } catch {
    return null;
  }
}

export function clearCelulaSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
