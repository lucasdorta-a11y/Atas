import { getDashboardData } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

/** Visão consolidada do panorama — calculada SEMPRE sobre as bases ativas. */
export async function GET() {
  try {
    const data = await getDashboardData();
    return Response.json(data);
  } catch (err) {
    console.error("dashboard", err);
    return Response.json({ erro: "Não foi possível carregar o panorama." }, { status: 500 });
  }
}
