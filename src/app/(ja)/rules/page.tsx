import { pageMetadata } from "@/components/RootDocument";
import { RulesScreen } from "@/components/screens/ReferenceScreens";

export const metadata = pageMetadata("ja", "rules", "/rules");

export default function Page() {
  return <RulesScreen />;
}
