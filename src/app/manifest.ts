import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reelprint",
    short_name: "Reelprint",
    description: "Send a Reel or Short. Get the transcript, the structure and six ideas you can film.",
    start_url: "/",
    display: "standalone",
    background_color: "#eceef0",
    theme_color: "#eceef0",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    share_target: {
      action: "/share",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
