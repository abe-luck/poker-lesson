import { pageMetadata } from "@/components/RootDocument";
import { SettingsScreen } from "@/components/screens/SettingsScreen";

export const metadata = pageMetadata("en", "settings", "/settings");

export default function Page() {
  return <SettingsScreen />;
}
