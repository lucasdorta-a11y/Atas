import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/Atas",
  assetPrefix: "/Atas/",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
