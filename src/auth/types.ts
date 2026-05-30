export type UserRole = 'super_admin' | 'receptionist';

export interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
  createdAt: string;
  createdBy?: string;
  active: boolean;
}

export interface AuthSession {
  userId: string;
  username: string;
  role: UserRole;
  displayName: string;
  loggedInAt: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
}

export type LoginResult =
  | { success: true; session: AuthSession }
  | { success: false; error: string };

export type RegisterResult =
  | { success: true; user: StoredUser }
  | { success: false; error: string };
