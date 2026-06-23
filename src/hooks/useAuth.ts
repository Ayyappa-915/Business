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

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const dbUsers = useAppSelector((state) => state.db.users);

  const loginUser = (email: string, role: UserRole) => {
    dispatch(loginStart());
    
    // Mock user login database search
    const matchedUser = dbUsers.find(u => u.email === email && u.role === role);
    
    if (matchedUser) {
      dispatch(loginSuccess({ user: matchedUser, token: 'mock_token_' + Date.now() }));
      return { success: true };
    } else {
      // Auto-create user if not found for easy testing
      const newUser: User = {
        id: 'user_' + Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0],
        email,
        role,
        shopName: 'Ayyappa Super Mart',
        createdAt: new Date().toISOString()
      };
      // For testing convenience, we succeed with a new user
      dispatch(loginSuccess({ user: newUser, token: 'mock_token_' + Date.now() }));
      return { success: true };
    }
  };

  const registerUser = (name: string, email: string, role: UserRole, shopName: string) => {
    dispatch(loginStart());
    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      shopName,
      createdAt: new Date().toISOString()
    };
    dispatch(registerSuccess({ user: newUser, token: 'mock_token_' + Date.now() }));
    return { success: true };
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
