import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/area-do-advogado", destination: "/admin", permanent: false }];
  },
};

export default nextConfig;
