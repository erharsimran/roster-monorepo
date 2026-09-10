// --- Auth & User ---
export type UserRoleName = 'Owner' | 'Admin' | 'Manager' | 'Employee';

export interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role?: UserRoleName;
    orgId?: string;
}

export interface LoginResponse {
    accessToken: string;
    user: AuthUser;
}

// --- Shifts & Scheduling ---
export type ShiftStatus = 'scheduled' | 'published' | 'cancelled';

export interface PositionSummary {
    id: string;
    name: string;
    hourlyRate?: number | null;
    isLeadership?: boolean;
}

export interface ShiftSummary {
    id: string;
    locationId: string;
    startTime: string;
    endTime: string;
    status: ShiftStatus;
    position: PositionSummary | null;
    assignedUser: {
        id: string;
        fullName: string;
        email: string;
    } | null;
}

// --- Time Tracking & Punches ---
export type TimeEntryStatus = 'active' | 'completed' | 'flagged' | 'approved';

export interface TimeEntrySummary {
    id: string;
    locationId: string;
    userId: string;
    shiftId: string | null;
    clockIn: string;
    clockOut: string | null;
    status: TimeEntryStatus;
    varianceMinutes: number;
    notes: string | null;
}

export interface LoginResponse {
    accessToken: string;
    user: AuthUser;
}

// --- Organization & Location ---
export interface LocationSummary {
    id: string;
    name: string;
    timezone: string;
    address?: string | null;
    geofenceRadiusMeters?: number;
}