import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: '/senseis/:path*',
        destination: '/entrenadores/:path*',
        permanent: true,
      },
      {
        source: '/judokas/:path*',
        destination: '/futbolistas/:path*',
        permanent: true,
      },
      {
        source: '/futbolista',
        destination: '/futbolistas',
        permanent: true,
      },
      {
        source: '/futbolista/:path*',
        destination: '/futbolistas/:path*',
        permanent: true,
      },
      {
        source: '/entrenador',
        destination: '/entrenadores',
        permanent: true,
      },
      {
        source: '/entrenador/:path*',
        destination: '/entrenadores/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
