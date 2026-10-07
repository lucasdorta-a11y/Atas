import { Suspense } from "react";
import { ProcessosBrowser } from "@/components/processos-browser";

export const metadata = { title: "Processos" };

export default function ProcessosPage() {
  return (
    <Suspense>
      <ProcessosBrowser />
    </Suspense>
  );
}
