// --- Auth & User ---
export type UserRoleName = 'Owner' | 'Admin' | 'Manager' | 'Employee';

export interface OrganizationSummary {
    id: string;
    name: string;
}

export interface OrganizationSummary {
    id: string;
    name: string;
    createdAt: string;
}

export interface PositionSummary {
    id: string;
    name: string;
    hourlyRate?: number | null;
    isLeadership?: boolean;
}
export interface AuthUser {
    id: string;
    email: string;
    fullName: string;
    role: 'Owner' | 'Admin' | 'Manager' | 'Employee';
    orgId: string | null;
    organization: OrganizationSummary | null;
    positions: PositionSummary[];
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

export interface Organization {
    id: string;
    name: string;
    createdAt: string;
}

export interface Position {
    id: string;
    name: string;
    hourlyRate: number | null;
    isLeadership?: boolean;
    orgId: string;
}

export interface CreatePositionDto {
    name: string;
    hourlyRate?: number;
    isLeadership?: boolean;
}

export interface Employee {
    id: string;
    fullName: string;
    email: string;
    role: string;
    positions?: Position[];
    createdAt: string;
}

export interface CreateEmployeeDto {
    fullName: string;
    email: string;
    password?: string;
    role?: string;
    positionIds?: string[];
}

export interface SetupOrgDto {
    organizationName: string;
    primaryLocationName: string;
    timezone?: string;
    address?: string;
}

export interface CreatePositionPayload {
    orgId: string;
    name: string;
    hourlyRate?: number;
    isLeadership?: boolean;
}