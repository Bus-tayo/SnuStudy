export default function MobileViewportShell({ children }) {
  return (
    <div className="min-h-dvh w-full bg-slate-100 flex justify-center">
      {/* 데스크탑에서는 가운데 폰 프레임처럼 보이도록 */}
      <div className="relative w-full max-w-[430px] min-h-dvh bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
}
