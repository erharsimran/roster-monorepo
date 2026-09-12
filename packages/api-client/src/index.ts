import axios, { AxiosInstance } from 'axios';
import {
    LoginResponse,
    AuthUser,
    Organization,
    Position,
    CreatePositionDto,
    Employee,
    CreateEmployeeDto,
    LocationSummary,
    SetupOrgDto,
    CreatePositionPayload,
    UpdatePositionDto,
    PermissionItem,
    RoleWithPermissions,
    CreateRolePayload,
    UpdateRolePayload,
    UpdateEmployeeProfilePayload,
    AssignPositionsPayload,
} from '@roster/types';
export class RosterApiClient {
    public http: AxiosInstance;
    private token: string | null = null;

    constructor(baseURL: string) {
        this.http = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Automatically inject JWT Bearer token into outgoing requests
        this.http.interceptors.request.use((config) => {
            if (this.token) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }
            return config;
        });
    }

    setToken(token: string | null) {
        this.token = token;
    }

    // --- Auth Endpoints ---
    async login(email: string, password: string): Promise<LoginResponse> {
        const { data } = await this.http.post<LoginResponse>('/auth/login', {
            email,
            password,
        });
        this.setToken(data.accessToken);
        return data;
    }
    // --- Organization & Location Endpoints ---
    async getLocations(): Promise<LocationSummary[]> {
        const { data } = await this.http.get<LocationSummary[]>('/organizations/locations');
        return data;
    }
    async getMe(): Promise<AuthUser & { organization?: Organization }> {
        const { data } = await this.http.get('/auth/me');
        return data;
    }

    // --- Organizations ---
    async setupOrganization(dto: SetupOrgDto): Promise<Organization> {
        const { data } = await this.http.post<Organization>('/organizations/setup', dto);
        return data;
    }


    // --- Employees ---
    async getEmployees(orgId: string): Promise<Employee[]> {
        const { data } = await this.http.get<Employee[]>(`/organizations/${orgId}/employees`, {
            params: orgId ? { orgId } : undefined,
        });
        return data;
    }

    async createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
        const { data } = await this.http.post<Employee>(`/organizations/${dto.orgId}/employees`, dto);
        return data;
    }


    // Position calls
    async getPositions(orgId: string): Promise<any[]> {
        const { data } = await this.http.get('/positions', {
            params: orgId ? { orgId } : undefined,
        });
        return data;
    }

    async createPosition(payload: CreatePositionPayload): Promise<any> {
        const { data } = await this.http.post('/positions', payload);
        return data;
    }
    async updatePosition(id: string, dto: UpdatePositionDto): Promise<any> {
        const { data } = await this.http.patch(`/positions/${id}`, dto);
        return data;
    }
    async deletePosition(positionId: string): Promise<void> {
        await this.http.delete(`/positions/${positionId}`);
    }

    async getPermissions(orgId: string): Promise<PermissionItem[]> {
        const { data } = await this.http.get<PermissionItem[]>(
            `/organizations/${orgId}/roles/permissions`,
        );
        return data;
    }

    async getRoles(orgId: string): Promise<RoleWithPermissions[]> {
        const { data } = await this.http.get<RoleWithPermissions[]>(
            `/organizations/${orgId}/roles`,
        );
        return data;
    }

    async createRole(orgId: string, payload: CreateRolePayload): Promise<RoleWithPermissions> {
        const { data } = await this.http.post<RoleWithPermissions>(
            `/organizations/${orgId}/roles`,
            payload,
        );
        return data;
    }

    async updateRole(
        orgId: string,
        roleId: string,
        payload: UpdateRolePayload,
    ): Promise<RoleWithPermissions> {
        const { data } = await this.http.patch<RoleWithPermissions>(
            `/organizations/${orgId}/roles/${roleId}`,
            payload,
        );
        return data;
    }

    async deleteRole(orgId: string, roleId: string): Promise<{ success: boolean; message: string }> {
        const { data } = await this.http.delete<{ success: boolean; message: string }>(
            `/organizations/${orgId}/roles/${roleId}`,
        );
        return data;
    }
    // Inside RosterApiClient class:
    async updateEmployee(
        orgId: string,
        userId: string,
        payload: UpdateEmployeeProfilePayload,
    ): Promise<any> {
        const { data } = await this.http.patch(
            `/organizations/${orgId}/employees/${userId}`,
            payload,
        );
        return data;
    }

    async assignEmployeePositions(
        orgId: string,
        userId: string,
        positionIds: string[],
    ): Promise<any> {
        const { data } = await this.http.patch(
            `/organizations/${orgId}/employees/${userId}/positions`,
            { positionIds },
        );
        return data;
    }

    async deleteEmployee(orgId: string, userId: string): Promise<any> {
        const { data } = await this.http.delete(
            `/organizations/${orgId}/employees/${userId}`,
        );
        return data;
    }
}
