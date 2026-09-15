import { pageMetadata } from "@/components/RootDocument";
import { GameSetup } from "@/components/screens/GameSetup";

export const metadata = pageMetadata("en", "setup", "/play/setup");

export default function Page() {
  return <GameSetup />;
}
