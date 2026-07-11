"use client";

import { Suspense } from "react";
import CelulaPage from "@/components/afiliados/CelulaPage";

export default function ProtectedCelulaPage() {
  return (
    <Suspense>
      <CelulaPage />
    </Suspense>
  );
}
