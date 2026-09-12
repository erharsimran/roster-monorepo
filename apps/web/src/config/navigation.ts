import {
    LayoutDashboard,
    CalendarDays,
    Clock,
    Briefcase,
    Users,
    MapPin,
    Settings,
    LucideIcon,
} from 'lucide-react';

export interface NavItemConfig {
    title: string;
    href: string;
    icon: LucideIcon;
    /** Granular permission keys required (user must have at least one) */
    requiredPermissions?: string[];
    /** Allowed role names if explicit permission keys are not yet configured */
    allowedRoles?: string[];
    /** Flag to render on the mobile bottom quick-action bar */
    showInBottomNav?: boolean;
}

export const NAVIGATION_REGISTRY: NavItemConfig[] = [
    {
        title: 'Overview',
        href: '/dashboard',
        icon: LayoutDashboard,
        showInBottomNav: true,
    },
    {
        title: 'Schedule',
        href: '/dashboard/schedule',
        icon: CalendarDays,
        requiredPermissions: ['shifts:read', 'shifts:publish'],
        allowedRoles: ['Owner', 'Admin', 'Manager', 'Employee'],
        showInBottomNav: true,
    },
    {
        title: 'Time Clock',
        href: '/dashboard/timesheets',
        icon: Clock,
        requiredPermissions: ['time_entries:read', 'time_entries:manage'],
        allowedRoles: ['Owner', 'Admin', 'Manager', 'Employee'],
        showInBottomNav: true,
    },
    {
        title: 'Positions',
        href: '/dashboard/positions',
        icon: Briefcase,
        requiredPermissions: ['positions:manage'],
        allowedRoles: ['Owner', 'Admin'],
        showInBottomNav: false,
    },
    {
        title: 'Employees',
        href: '/dashboard/employees',
        icon: Users,
        requiredPermissions: ['employees:manage', 'employees:read'],
        allowedRoles: ['Owner', 'Admin', 'Manager'],
        showInBottomNav: true,
    },
    {
        title: 'Locations',
        href: '/dashboard/locations',
        icon: MapPin,
        requiredPermissions: ['locations:manage'],
        allowedRoles: ['Owner', 'Admin'],
        showInBottomNav: false,
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        allowedRoles: ['Owner', 'Admin'],
        showInBottomNav: true,
    },
];

export function isNavAccessible(
    item: NavItemConfig,
    userPermissions: string[] = [],
    userRole?: string,
): boolean {
    // 1. If no restrictions are defined, it's public to all authenticated users
    if (!item.requiredPermissions?.length && !item.allowedRoles?.length) {
        return true;
    }

    // 2. Organization Owners bypass all individual permission gates
    if (userRole?.toLowerCase() === 'owner') {
        return true;
    }

    // 3. Permission key match (RPA engine)
    if (
        item.requiredPermissions &&
        item.requiredPermissions.some((perm) => userPermissions.includes(perm))
    ) {
        return true;
    }

    // 4. Role fallback
    if (
        item.allowedRoles &&
        userRole &&
        item.allowedRoles.map((r) => r.toLowerCase()).includes(userRole.toLowerCase())
    ) {
        return true;
    }

    return false;
}