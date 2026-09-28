export function VideoFeedSkeleton() {
  return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="animate-pulse space-y-4">
        <div className="w-12 h-12 rounded-full bg-white/20 mx-auto" />
        <div className="w-48 h-4 bg-white/20 rounded mx-auto" />
      </div>
    </div>
  );
}
