import { PageHeader } from "@/components/layout/page-header";
import { NotificationList } from "@/components/member/notification-list";
import { requireRole } from "@/lib/auth/get-current-user";
import { notificationsRepo } from "@/lib/data/repositories/notifications.repo";

export const instant = false;

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireRole(["member"]);
  const notes = await notificationsRepo.getByUser(user.id);
  return (
    <>
      <PageHeader title="Notifications" description="Due dates, fines, and books ready for pickup." />
      <NotificationList notes={notes} />
    </>
  );
}
