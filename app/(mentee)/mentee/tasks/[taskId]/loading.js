export default function Loading() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-white/80 p-6 shadow-sm">
        <div className="text-base font-bold text-foreground">할 일 불러오는 중...</div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-1/2 animate-pulse bg-primary" />
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          잠시만 기다려주세요.
        </div>
      </div>
    </div>
  );
}
