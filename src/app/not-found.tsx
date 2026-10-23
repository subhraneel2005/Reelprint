import { NotFoundGlitch } from "@/components/motion/not-found/glitch";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-3xl rounded-[32px] border border-border/70 bg-card/55 px-4 py-8 backdrop-blur-sm sm:px-8">
        <NotFoundGlitch
          title="That reel is not in the archive."
          description="It may have been removed, or the link is wrong. Send it again and the desk will read it from scratch."
          homeHref="/"
          homeLabel="Back to the desk"
          browseHref="/library"
          browseLabel="Open archive"
        />
      </div>
    </div>
  );
}
