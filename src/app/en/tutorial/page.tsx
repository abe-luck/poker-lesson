import { pageMetadata } from "@/components/RootDocument";
import { TutorialScreen } from "@/components/screens/TutorialScreen";

export const metadata = pageMetadata("en", "tutorial", "/tutorial");

export default function Page() {
  return <TutorialScreen />;
}
