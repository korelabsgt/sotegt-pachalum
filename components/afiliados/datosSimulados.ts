import type { Afiliado, Lider } from "./esquemas";
import { POLITICAS } from "./esquemas";

export const LIDER_SIMULADO: Lider = {
  id: "simulado-demo",
  email: "clopez",
  nombres: "Carlos Eduardo",
  apellidos: "López Aguilar",
  rol: "LIDER",
  conteoAfiliados: 13,
  simulado: true,
};

export const NUEVO_LIDER_SIMULADO = {
  nombres: "Juan Carlos",
  apellidos: "Lemus Martínez",
  email: "jlemus",
  password: "Simulacion2025*",
};

const LUGARES = [
  "El Limón",
  "San José",
  "La Esperanza",
  "El Rodeo",
  "Las Flores",
  "El Naranjo",
  "Santa Cruz",
  "El Chaguite",
];

const RELIGIONES = ["Católica", "Evangélica", "Ninguna"];

type SemillaAfiliado = {
  nombres: string;
  apellidos: string;
  sexo: "M" | "F";
  nacimiento: string;
};

const SEMILLAS: SemillaAfiliado[] = [
  { nombres: "Carlos Eduardo", apellidos: "López Aguilar", sexo: "M", nacimiento: "1985-03-12" },
  { nombres: "María Elena", apellidos: "Lemus Martínez", sexo: "F", nacimiento: "1990-07-25" },
  { nombres: "José Antonio", apellidos: "Pérez García", sexo: "M", nacimiento: "1978-11-03" },
  { nombres: "Ana Lucía", apellidos: "Morales Recinos", sexo: "F", nacimiento: "1995-01-18" },
  { nombres: "Luis Fernando", apellidos: "Hernández Cruz", sexo: "M", nacimiento: "1982-09-30" },
  { nombres: "Sandra Patricia", apellidos: "Ramírez Solís", sexo: "F", nacimiento: "1988-05-14" },
  { nombres: "Mario Roberto", apellidos: "González Funes", sexo: "M", nacimiento: "1975-12-22" },
  { nombres: "Claudia Verónica", apellidos: "Castro Rivera", sexo: "F", nacimiento: "1993-08-09" },
  { nombres: "Edgar Geovany", apellidos: "Méndez Orellana", sexo: "M", nacimiento: "1986-04-27" },
  { nombres: "Wendy Yamileth", apellidos: "Portillo Lemus", sexo: "F", nacimiento: "1997-02-11" },
  { nombres: "Byron Estuardo", apellidos: "Aguilar Súchite", sexo: "M", nacimiento: "1980-06-05" },
  { nombres: "Karla Andrea", apellidos: "Figueroa Rodríguez", sexo: "F", nacimiento: "1992-10-19" },
  { nombres: "Walter Alexander", apellidos: "Sandoval Marroquín", sexo: "M", nacimiento: "1984-01-07" },
];

const SUBS_POR_INTERES: Record<string, string[]> = {
  "Obras de Infraestructura": ["Pavimentación", "Drenajes", "Alcantarillado"],
  "Red Vial": ["Calles principales", "Calles secundarias", "Puentes"],
  Educación: ["Primaria", "Secundaria", "Universitaria"],
  "Medio Ambiente": ["Reforestación", "Reciclaje", "Áreas verdes"],
  "Desarrollo Económico Local": ["Emprendimiento", "Mercados", "Turismo"],
  "Servicios Públicos": ["Agua potable", "Energía", "Recolección"],
  "de Seguridad": ["Patrullaje", "Iluminación", "Prevención"],
  Salud: ["Centros de salud", "Medicamentos", "Prevención"],
};

const SECTORES_ESTADISTICAS = [
  { id: 1, nombre: "Sector 1: Parte Baja", lugares: ["San Jorge", "Barranco Colorado", "La Jarretada", "Las Quebraditas", "Mal País"] },
  { id: 2, nombre: "Sector 2: Zona Alta", lugares: ["El Mirador", "Centro Histórico", "La Cumbre", "El Bosque"] },
  { id: 3, nombre: "Sector 3: Periferia", lugares: ["El Limón", "San José", "La Esperanza", "El Rodeo"] },
] as const;

const CONDICIONES = ["Ninguna", "Discapacidad motriz", "Adulto mayor", "Embarazo", "Enfermedad crónica", "Sin Especificar"];

const ANIOS_NACIMIENTO = [2005, 1998, 1992, 1988, 1982, 1976, 1970, 1965, 1960, 1958];

export const INTERESES_CATALOGO_DEMO: { politica: string; subs: string[] }[] = POLITICAS.map(
  (politica) => ({
    politica,
    subs: SUBS_POR_INTERES[politica] ?? [],
  }),
);

export const AFILIADOS_SIMULADOS: Afiliado[] = SEMILLAS.map((s, i) => {
  const empadronado = i % 4 !== 0;
  return {
    id: `simulado-afiliado-${i + 1}`,
    nombres: s.nombres,
    apellidos: s.apellidos,
    sexo: s.sexo,
    nacimiento: s.nacimiento,
    telefono: `5${(5000000 + i * 13579).toString().padStart(7, "0")}`,
    dpi: `${(2500000000000 + i * 1234567).toString().slice(0, 13)}`,
    lugar_id: (i % LUGARES.length) + 1,
    lider_id: LIDER_SIMULADO.id,
    politica_id: (i % 8) + 1,
    sub_politica_id: null,
    empadronado,
    no_padron: empadronado ? `${1000 + i * 37}` : "0",
    religion: RELIGIONES[i % RELIGIONES.length],
    created_at: new Date().toISOString(),
    lider_nombre: `${LIDER_SIMULADO.nombres} ${LIDER_SIMULADO.apellidos}`,
    lider_email: LIDER_SIMULADO.email,
    lugar_nombre: LUGARES[i % LUGARES.length],
  };
});

export const AFILIADOS_ESTADISTICAS_DEMO: Afiliado[] = (() => {
  const out: Afiliado[] = [];
  let idx = 0;
  SECTORES_ESTADISTICAS.forEach((sector, sIdx) => {
    sector.lugares.forEach((lugar, lIdx) => {
      const cantidad = 3 + ((sIdx + lIdx) % 5) + (lIdx % 3);
      for (let j = 0; j < cantidad; j += 1) {
        const semilla = SEMILLAS[idx % SEMILLAS.length];
        const anio = ANIOS_NACIMIENTO[(idx + j) % ANIOS_NACIMIENTO.length];
        const mes = ((idx + j) % 12) + 1;
        const dia = ((idx + j) % 28) + 1;
        const politicaNombre = POLITICAS[idx % POLITICAS.length];
        const subsInteres = SUBS_POR_INTERES[politicaNombre] ?? ["Sin sub-programa"];
        const subPolitica = subsInteres[(idx + j) % subsInteres.length];
        out.push({
          id: `demo-estadistica-${idx + 1}`,
          nombres: semilla.nombres,
          apellidos: semilla.apellidos,
          sexo: (idx + j) % 2 === 0 ? "M" : "F",
          nacimiento: `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
          telefono: `5${(5100000 + idx * 9871).toString().padStart(7, "0")}`,
          dpi: `${(2600000000000 + idx * 7654321).toString().slice(0, 13)}`,
          lugar_id: lIdx + 1,
          lider_id: `demo-lider-${(sIdx % 4) + 1}`,
          politica_id: (idx % POLITICAS.length) + 1,
          sub_politica_id: (idx % subsInteres.length) + 1,
          empadronado: idx % 5 !== 0,
          no_padron: idx % 5 !== 0 ? `${2000 + idx}` : "0",
          religion: RELIGIONES[(idx + j) % RELIGIONES.length],
          condicion_especial: CONDICIONES[(idx + j) % CONDICIONES.length],
          politica: politicaNombre,
          sub_politica: subPolitica,
          created_at: new Date().toISOString(),
          lider_nombre: `Líder Demo ${(sIdx % 4) + 1}`,
          lider_email: `lider${(sIdx % 4) + 1}`,
          lugar_nombre: lugar,
          sector_nombre: sector.nombre,
          sector_id: sector.id,
        });
        idx += 1;
      }
    });
  });
  return out;
})();
