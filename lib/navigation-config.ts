import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  BarChart4, 
  Settings,
  Calendar,
  BookOpen,
  Home,
  Building,
  Boxes
} from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  children?: NavItem[];
};

export type SidebarConfig = {
  [key: string]: NavItem[];
};

export const navigationConfig: SidebarConfig = {
  admin: [
    {
      title: "Dashboard",
      href: "/admin/conference/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "User Management",
      href: "/admin/conference/users",
      icon: Users,
    },
    {
      title: "Facilities",
      href: "/admin/conference/facilities",
      icon: Building,
    },
    {
      title: "Reports & Analytics",
      href: "/admin/conference/reports",
      icon: BarChart4,
    },
  ],
  facility_manager: [
    {
      title: "Dashboard",
      href: "/facility-manager",
      icon: LayoutDashboard,
    },
    {
      title: "Bookings",
      href: "/facility-manager/bookings",
      icon: Calendar,
    },
    {
      title: "Rooms",
      href: "/facility-manager/rooms",
      icon: Building2,
    },
    {
      title: "Resources",
      href: "/facility-manager/resources",
      icon: Boxes,
    },
    {
      title: "Reports",
      href: "/facility-manager/reports",
      icon: BarChart4,
    },
    {
      title: "Facility",
      href: "/facility-manager/facilities",
      icon: Building,
    },
  ],
  user: [
    {
      title: "Home",
      href: "/conference-room-booking",
      icon: Home,
    },
    {
      title: "Rooms",
      href: "/conference-room-booking/rooms",
      icon: Building2,
    },
    {
      title: "My Bookings",
      href: "/conference-room-booking/bookings",
      icon: Calendar,
    },
    {
      title: "Profile",
      href: "/conference-room-booking/profile",
      icon: Users,
    },
  ],
};

export const getRoleFromPathname = (pathname: string): string => {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/facility-manager')) return 'facility_manager';
  return 'user';
}; 