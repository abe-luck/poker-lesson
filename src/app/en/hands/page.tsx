import { pageMetadata } from "@/components/RootDocument";
import { HandsScreen } from "@/components/screens/ReferenceScreens";

export const metadata = pageMetadata("en", "hands", "/hands");

export default function Page() {
  return <HandsScreen />;
}
