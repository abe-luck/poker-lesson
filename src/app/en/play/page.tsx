import { pageMetadata } from "@/components/RootDocument";
import { ModeSelect } from "@/components/screens/ModeSelect";

export const metadata = pageMetadata("en", "play", "/play");

export default function Page() {
  return <ModeSelect />;
}
