import { pageMetadata } from "@/components/RootDocument";
import { ModeSelect } from "@/components/screens/ModeSelect";

export const metadata = pageMetadata("ja", "play", "/play");

export default function Page() {
  return <ModeSelect />;
}
