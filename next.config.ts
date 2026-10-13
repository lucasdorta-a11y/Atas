import type { NextConfig } from "next";

// O site publicado no Pages vive em /Atas. Durante o desenvolvimento local,
// mantemos a raiz / para que a prévia e o servidor dev sejam acessíveis.
const isStaticProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isStaticProduction ? "/Atas" : "",
  assetPrefix: isStaticProduction ? "/Atas/" : "",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
