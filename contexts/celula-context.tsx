"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Afiliado, Lider } from "@/components/afiliados/esquemas";
import {
  clearCelulaSession,
  persistCelulaSession,
  readCelulaSession,
} from "@/lib/celula-session";

type CelulaContextValue = {
  lider: Lider | null;
  afiliadosSimulados: Afiliado[] | undefined;
  hydrated: boolean;
  abrirCelula: (lider: Lider, afiliadosSimulados?: Afiliado[]) => void;
  actualizarLider: (lider: Lider) => void;
  clearCelula: () => void;
};

const CelulaContext = createContext<CelulaContextValue | null>(null);

export function CelulaProvider({ children }: { children: React.ReactNode }) {
  const [lider, setLider] = useState<Lider | null>(null);
  const [afiliadosSimulados, setAfiliadosSimulados] = useState<Afiliado[] | undefined>(
    undefined,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = readCelulaSession();
    if (saved) {
      setLider(saved.lider);
      setAfiliadosSimulados(saved.afiliadosSimulados);
    }
    setHydrated(true);
  }, []);

  const abrirCelula = useCallback((next: Lider, simulados?: Afiliado[]) => {
    persistCelulaSession(next, simulados);
    setLider(next);
    setAfiliadosSimulados(simulados);
  }, []);

  const actualizarLider = useCallback((next: Lider) => {
    setAfiliadosSimulados((simulados) => {
      persistCelulaSession(next, simulados);
      return simulados;
    });
    setLider(next);
  }, []);

  const clearCelula = useCallback(() => {
    clearCelulaSession();
    setLider(null);
    setAfiliadosSimulados(undefined);
  }, []);

  const value = useMemo(
    () => ({
      lider,
      afiliadosSimulados,
      hydrated,
      abrirCelula,
      actualizarLider,
      clearCelula,
    }),
    [lider, afiliadosSimulados, hydrated, abrirCelula, actualizarLider, clearCelula],
  );

  return <CelulaContext.Provider value={value}>{children}</CelulaContext.Provider>;
}

export function useCelula() {
  const ctx = useContext(CelulaContext);
  if (!ctx) {
    throw new Error("useCelula debe usarse dentro de CelulaProvider");
  }
  return ctx;
}
