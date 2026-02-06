import SubjectProgressCards from "./SubjectProgressCards";
import FloatingConsultButton from "./FloatingConsultButton";
import StreakBanner from "@/components/mentee/streak/StreakBanner";
import HeatmapCalendar from "@/components/mentee/heatmap/HeatmapCalendar";

export default function MyPageScreen() {
  return (
    <div className="p-4 pb-20 space-y-4">
      <div className="border rounded p-3">
        <div className="text-sm font-semibold">프로필</div>
        <div className="text-sm text-neutral-500">데이터 연결 예정</div>
      </div>

      <SubjectProgressCards />

      <StreakBanner />
      <HeatmapCalendar />
      
      <FloatingConsultButton />
    </div>
  );
}
