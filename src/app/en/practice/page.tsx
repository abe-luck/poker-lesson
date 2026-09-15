import { pageMetadata } from "@/components/RootDocument";
import { PracticeScreen } from "@/components/screens/PracticeScreen";

export const metadata = pageMetadata("en", "practice", "/practice");

export default function Page() {
  return <PracticeScreen />;
}
