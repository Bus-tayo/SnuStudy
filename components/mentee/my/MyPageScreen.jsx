import SubjectProgressCards from "./SubjectProgressCards";
import FloatingConsultButton from "./FloatingConsultButton";
import StreakBanner from "@/components/mentee/streak/StreakBanner";
import HeatmapCalendar from "@/components/mentee/heatmap/HeatmapCalendar";
import ProfileCard from "./ProfileCard";

export default function MyPageScreen() {
  return (
    <div className="p-4 pb-20 space-y-4">
      <ProfileCard />

      <SubjectProgressCards />

      <StreakBanner />
      <HeatmapCalendar />
      
      <FloatingConsultButton />
    </div>
  );
}
