import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'customer' | 'farmer' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      _id: string;
      email: string;
      name: string;
      role: string;
    };
    token: string;
  };
}

interface JWTPayload {
  id: string;
  exp?: number;
  iat?: number;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response: any = await api.post('/auth/login', credentials);
    const authData = response?.data ?? response;
    const token = authData?.token;
    const user = authData?.user;
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response: any = await api.post('/auth/register', userData);
    const authData = response?.data ?? response;
    const token = authData?.token;
    const user = authData?.user;
    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  // Decode JWT token without verification (client-side check only)
  private decodeToken(token: string): JWTPayload | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  // Check if token is expired
  isTokenExpired(token?: string): boolean {
    const tokenToCheck = token || this.getToken();
    if (!tokenToCheck) return true;

    const decoded = this.decodeToken(tokenToCheck);
    if (!decoded || !decoded.exp) return true;

    // Check if token is expired (exp is in seconds)
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  }

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired
    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }
    
    return true;
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const response: any = await api.post('/auth/forgot-password', { email });
    return response;
  }

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    const response: any = await api.post(`/auth/reset-password?token=${token}`, { password });
    return response;
  }
}

export default new AuthService();
