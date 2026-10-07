import type { Metadata } from "next";
import { Suspense } from "react";
import { ProcessosBrowser } from "@/components/processos-browser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Processos" };

export default function ProcessosPage() {
  return (
    <Suspense>
      <ProcessosBrowser />
    </Suspense>
  );
}
