import { Header } from "@/components/Header";
import { SidebarSteps } from "@/components/SidebarSteps";
import { SummaryPanel } from "@/components/SummaryPanel";
import { ClassSelection } from "@/components/ClassSelection";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SidebarSteps />
        <ClassSelection />
        <SummaryPanel />
      </div>
    </div>
  );
};

export default Index;
