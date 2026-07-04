import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  registerSuccess,
  updateProfile
} from '../features/auth/authSlice';
import { User, UserRole } from '../types/auth.types';
import { api } from '../services/api';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const loginUser = async (email: string, role: UserRole) => {
    dispatch(loginStart());
    try {
      const data = await api.post<{ _id: string; username: string; role: string; token: string }>('/auth/login', {
        username: email,
        password: 'admin123'
      });
      
      const user: User = {
        id: data._id,
        name: data.username,
        email: email.includes('@') ? email : `${data.username}@biztracker.com`,
        role: data.role as UserRole,
        shopName: 'Ayyappa Super Mart',
        createdAt: new Date().toISOString()
      };

      dispatch(loginSuccess({ user, token: data.token }));
      return { success: true };
    } catch (err: any) {
      dispatch(loginFailure(err.message || 'Login failed'));
      return { success: false, error: err.message };
    }
  };

  const registerUser = async (name: string, email: string, role: UserRole, shopName: string) => {
    dispatch(loginStart());
    try {
      const data = await api.post<{ _id: string; username: string; role: string; token: string }>('/auth/register', {
        username: email,
        password: 'admin123',
        role
      });

      const user: User = {
        id: data._id,
        name: data.username,
        email,
        role: data.role as UserRole,
        shopName,
        createdAt: new Date().toISOString()
      };

      dispatch(registerSuccess({ user, token: data.token }));
      return { success: true };
    } catch (err: any) {
      dispatch(loginFailure(err.message || 'Registration failed'));
      return { success: false, error: err.message };
    }
  };

  const logoutUser = () => {
    dispatch(logout());
  };

  const updateUserProfile = (profileData: Partial<User>) => {
    dispatch(updateProfile(profileData));
  };

  return {
    ...authState,
    loginUser,
    registerUser,
    logoutUser,
    updateUserProfile
  };
};
