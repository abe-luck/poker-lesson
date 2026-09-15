import { pageMetadata } from "@/components/RootDocument";
import { StatsScreen } from "@/components/screens/StatsScreen";

export const metadata = pageMetadata("en", "stats", "/stats");

export default function Page() {
  return <StatsScreen />;
}
