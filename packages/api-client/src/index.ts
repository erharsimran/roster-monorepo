import axios, { AxiosInstance } from 'axios';
import { LoginResponse, LocationSummary } from '@roster/types';

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
}