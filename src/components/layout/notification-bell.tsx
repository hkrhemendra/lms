"use client";

import Link from "next/link";
import { BellIcon } from "lucide-react";
import { markNotificationReadAction } from "@/lib/actions/library";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Notification } from "@/types";

export function NotificationBell({
  items,
  unread,
  href,
}: {
  items: Notification[];
  unread: number;
  href: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={unread ? `${unread} unread notifications` : "Notifications"}
        className="relative inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
      >
        <BellIcon className="size-4" />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">
            {unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {items.length === 0 ? (
            <DropdownMenuItem disabled>You are all caught up.</DropdownMenuItem>
          ) : (
            items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => {
                  if (!item.read) void markNotificationReadAction(item.id);
                }}
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.message}</span>
                </span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuItem nativeButton={false} render={<Link href={href} />}>View all</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
