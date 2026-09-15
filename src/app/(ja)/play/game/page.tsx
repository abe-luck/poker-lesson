import { pageMetadata } from "@/components/RootDocument";
import { GameScreen } from "@/components/game/GameScreen";

export const metadata = pageMetadata("ja", "game", "/play/game");

export default function Page() {
  return <GameScreen />;
}
