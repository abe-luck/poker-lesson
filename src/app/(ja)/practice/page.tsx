import { pageMetadata } from "@/components/RootDocument";
import { PracticeScreen } from "@/components/screens/PracticeScreen";

export const metadata = pageMetadata("ja", "practice", "/practice");

export default function Page() {
  return <PracticeScreen />;
}
