"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  BookmarkIcon,
  BookOpenIcon,
  ChartColumnIcon,
  IndianRupeeIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  PlusIcon,
  ScrollTextIcon,
  SettingsIcon,
  TagsIcon,
  Undo2Icon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { navFor, type NavItem } from "@/lib/nav";
import type { Role } from "@/types";

const icons: Record<string, React.ComponentType> = {
  layout: LayoutDashboardIcon,
  book: BookOpenIcon,
  tags: TagsIcon,
  users: UsersIcon,
  plus: PlusIcon,
  undo: Undo2Icon,
  library: LibraryIcon,
  rupee: IndianRupeeIcon,
  bookmark: BookmarkIcon,
  chart: ChartColumnIcon,
  settings: SettingsIcon,
  scroll: ScrollTextIcon,
  bell: BellIcon,
  user: UserIcon,
};

function Item({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = icons[item.icon] ?? BookOpenIcon;
  const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/librarian" && item.href !== "/member" && pathname.startsWith(item.href));
  return (
    <SidebarMenuItem>
      <SidebarMenuButton render={<Link href={item.href} />} isActive={active} tooltip={item.label}>
        <Icon />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ role, libraryName }: { role: Role; libraryName: string }) {
  const pathname = usePathname();
  const groups = navFor(role);
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link href={role === "admin" ? "/admin" : role === "librarian" ? "/librarian" : "/member"} className="truncate text-sm font-semibold">
          {libraryName}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <Item key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="text-xs text-muted-foreground">College library</SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
