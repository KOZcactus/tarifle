import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Make Eat`,
    short_name: SITE_NAME,
    description:
      "Yemek, içecek ve kokteyl tariflerini sade, hızlı okunur ve topluluk katkısına açık şekilde sunan modern tarif platformu.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f6f2",
    theme_color: "#e85d2c",
    lang: "tr",
    dir: "ltr",
    categories: ["food", "lifestyle", "cooking"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Tarifler",
        short_name: "Tarifler",
        description: "Tüm tariflere göz at",
        url: "/tarifler",
      },
      {
        name: "Keşfet",
        short_name: "Keşfet",
        description: "Öne çıkan ve popüler tarifler",
        url: "/kesfet",
      },
      {
        name: "Alışveriş Listem",
        short_name: "Liste",
        description: "Alışveriş listene git",
        url: "/alisveris-listesi",
      },
    ],
  };
}
