import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dr. Ramon Nunes · Direito Bancário",
    short_name: "Dr. Ramon Nunes",
    description: "Atendimento on-line para vítimas de golpes e fraudes pelo PIX.",
    start_url: "/",
    display: "standalone",
    background_color: "#07111f",
    theme_color: "#07111f",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
