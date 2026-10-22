import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Reelprint — content research desk",
    short_name: "Reelprint",
    description:
      "Send a Reel or Short. Get the transcript, the structure and six ideas you can film.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#eceef0",
    theme_color: "#eceef0",
    lang: "en",
    dir: "ltr",
    categories: ["productivity", "utilities"],
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
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/home.png",
        sizes: "1170x2532",
        type: "image/png",
        form_factor: "narrow",
        label: "Send a reel and get the recipe",
      },
      {
        src: "/screenshots/library.png",
        sizes: "1170x2532",
        type: "image/png",
        form_factor: "narrow",
        label: "Search your archive by topic, hook or line",
      },
    ],
    shortcuts: [
      {
        name: "Send a reel",
        short_name: "Send",
        description: "Paste a Reel or Short link and start the analysis.",
        url: "/#send",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Search the archive",
        short_name: "Archive",
        description: "Search transcripts, hooks and content DNA.",
        url: "/library",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Discover outliers",
        short_name: "Discover",
        description: "Find live YouTube Shorts outliers in your niche.",
        url: "/discover",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
    share_target: {
      action: "/share",
      method: "GET",
      enctype: "application/x-www-form-urlencoded",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
    prefer_related_applications: false,
  };
}
