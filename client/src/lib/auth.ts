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

type AuthListener = (user: AuthUser | null) => void;

class AuthService {
  private token: string | null = null;
  private user: AuthUser | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    // Load from localStorage on initialization
    this.token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        this.clearAuth();
      }
    }
  }

  subscribe(listener: AuthListener) {
    this.listeners.add(listener);
    // chama imediatamente com o usuário atual
    listener(this.user);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) l(this.user);
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
    if (!this.token) return null;
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!response.ok) {
        this.clearAuth();
        return null;
      }
      const userData = await response.json();
      this.user = userData;
      localStorage.setItem("auth_user", JSON.stringify(userData));
      this.notify();
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
    return this.user?.role === "admin";
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
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));
    this.notify();
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    this.notify();
  }
}

export const authService = new AuthService();

// Custom fetch com token automático
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = authService.getToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(url, { ...options, headers });
};

