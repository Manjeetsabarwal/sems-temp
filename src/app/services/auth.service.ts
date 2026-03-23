import { API_ENDPOINTS, apiCall } from '../config/api.config';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  phone?: string;
  studentId?: string;
  teacherId?: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;
    studentId?: string | null;
    teacherId?: string | null;
  };
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  role: string;
  studentId?: string | null;
  teacherId?: string | null;
  isActive: boolean;
}

class AuthService {
  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiCall<AuthResponse>(API_ENDPOINTS.authLogin, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store token
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (error: any) {
      console.error('❌ Error logging in:', error);
      throw new Error(error.message || 'Failed to login');
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    try {
      const response = await apiCall<AuthResponse>(API_ENDPOINTS.authRegister, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      // Store token
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (error: any) {
      console.error('❌ Error registering:', error);
      throw new Error(error.message || 'Failed to register');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await apiCall<UserProfile>(API_ENDPOINTS.authMe, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update stored user
      localStorage.setItem('user', JSON.stringify(response));

      return response;
    } catch (error: any) {
      console.error('❌ Error fetching current user:', error);
      // Don't auto-logout on error - let the calling code decide
      // Only logout if it's a 401 (unauthorized)
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        this.logout();
      }
      throw new Error(error.message || 'Failed to fetch user profile');
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Get stored user
   */
  getStoredUser(): any | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
