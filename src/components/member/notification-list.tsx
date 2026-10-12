"use client";

import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/actions/library";
import { ActionButton } from "@/components/shared/action-button";
import { formatDate } from "@/lib/format";
import type { Notification } from "@/types";

export function NotificationList({ notes }: { notes: Notification[] }) {
  return (
    <div className="flex flex-col gap-3">
      <ActionButton label="Mark all read" action={markAllNotificationsReadAction} />
      <ul className="flex flex-col gap-2">
        {notes.length === 0 ? <li className="text-sm text-muted-foreground">No notifications yet.</li> : null}
        {notes.map((note) => (
          <li key={note.id} className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{note.title}</p>
              <p className="text-sm text-muted-foreground">{note.message}</p>
              <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)} · {note.read ? "Read" : "Unread"}</p>
            </div>
            {note.read ? null : <ActionButton label="Mark read" variant="outline" action={() => markNotificationReadAction(note.id)} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
