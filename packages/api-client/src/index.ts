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
        const { data } = await this.http.get<Employee[]>('/employees', {
            params: orgId ? { orgId } : undefined,
        });
        return data;
    }

    async createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
        const { data } = await this.http.post<Employee>('/employees', dto);
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

    async deletePosition(positionId: string): Promise<void> {
        await this.http.delete(`/positions/${positionId}`);
    }
}
