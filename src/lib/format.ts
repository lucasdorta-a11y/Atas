/** Formatação pt-BR centralizada (datas, números, moeda, prazos relativos). */

const fBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fInt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const fNum = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const fDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fDateLong = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const fDateTime = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function fmtCurrency(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return fBRL.format(v);
}

export function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return fInt.format(v);
}

export function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return fNum.format(v);
}

/** Recebe 'aaaa-mm-dd' (string) e devolve dd/mm/aaaa. */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return fDate.format(new Date(y, m - 1, d));
}

export function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return fDateLong.format(new Date(y, m - 1, d));
}

export function fmtDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return fDateTime.format(d);
}

export function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function prazoRelativo(dias: number | null): string {
  if (dias === null) return "";
  if (dias < 0) {
    const a = Math.abs(dias);
    return a === 1 ? "há 1 dia" : `há ${a} dias`;
  }
  if (dias === 0) return "vence hoje";
  return dias === 1 ? "em 1 dia" : `em ${dias} dias`;
}
