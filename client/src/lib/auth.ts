import { apiRequest } from "./queryClient";
import { LoginData, RegisterData } from "@shared/schema";

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  classroom?: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

class AuthService {
  private token: string | null = null;
  private user: AuthUser | null = null;

  constructor() {
    // Load from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        this.clearAuth();
      }
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", data);
    const authData = await response.json();
    
    this.setAuth(authData.token, authData.user);
    return authData;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/register", data);
    const authData = await response.json();
    
    this.setAuth(authData.token, authData.user);
    return authData;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.clearAuth();
        return null;
      }

      const userData = await response.json();
      this.user = userData;
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      this.clearAuth();
      return null;
    }
  }

  logout(): void {
    this.clearAuth();
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  private setAuth(token: string, user: AuthUser): void {
    this.token = token;
    this.user = user;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}

export const authService = new AuthService();

// Custom fetch function that includes auth headers
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = authService.getToken();
  const headers = {
    ...options.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
};
