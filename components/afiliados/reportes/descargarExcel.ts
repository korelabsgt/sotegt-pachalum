import * as XLSX from "xlsx";

function archivoTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function sanitizarNombreArchivo(nombre: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return base || "export";
}

export function sanitizarNombreHoja(nombre: string): string {
  const sinInvalidos = nombre.replace(/[:\\/?*[\]]/g, " ");
  const trimmed = sinInvalidos.trim().slice(0, 31);
  return trimmed || "Hoja";
}

export type FilaAoAExcel = readonly (string | number)[];

export function descargarExcelAoA(params: {
  nombreArchivoBase: string;
  nombreHoja: string;
  filas: readonly FilaAoAExcel[];
}): void {
  descargarExcelMultiplesHojas({
    nombreArchivoBase: params.nombreArchivoBase,
    hojas: [{ nombre: params.nombreHoja, filas: params.filas }],
  });
}

export function descargarExcelMultiplesHojas(params: {
  nombreArchivoBase: string;
  hojas: readonly { nombre: string; filas: readonly FilaAoAExcel[] }[];
}): void {
  const wb = XLSX.utils.book_new();
  const nombresUsados = new Set<string>();

  params.hojas.forEach((hoja) => {
    let nombreHoja = sanitizarNombreHoja(hoja.nombre);
    let sufijo = 2;
    while (nombresUsados.has(nombreHoja)) {
      const base = sanitizarNombreHoja(hoja.nombre).slice(0, 28);
      nombreHoja = sanitizarNombreHoja(`${base} ${sufijo}`);
      sufijo++;
    }
    nombresUsados.add(nombreHoja);

    const ws = XLSX.utils.aoa_to_sheet(hoja.filas.map((r) => [...r]));
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
  });

  const nombre = `${sanitizarNombreArchivo(params.nombreArchivoBase)}-${archivoTimestamp()}.xlsx`;
  XLSX.writeFile(wb, nombre);
}
