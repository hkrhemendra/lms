import { PageHeader } from "@/components/layout/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireRole } from "@/lib/auth/get-current-user";
import { settingsRepo } from "@/lib/data/repositories/settings.repo";

export const instant = false;

export const metadata = { title: "Library settings" };

export default async function SettingsPage() {
  await requireRole(["admin"]);
  const settings = await settingsRepo.get();
  return (
    <>
      <PageHeader title="Library rules" description="Changes apply to new loans. Existing due dates stay as they are." />
      <SettingsForm settings={settings} />
    </>
  );
}
