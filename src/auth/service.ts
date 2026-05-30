import { hashPassword, verifyPassword } from './password';
import { localStorageAuthStorage, type AuthStorage } from './storage';
import type {
  AuthSession,
  CreateUserInput,
  LoginResult,
  RegisterResult,
  StoredUser,
} from './types';

const storage: AuthStorage = localStorageAuthStorage;

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
}

function createSession(user: StoredUser): AuthSession {
  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    loggedInAt: new Date().toISOString(),
  };
}

export function getBootstrapConfigured(): boolean {
  const username = import.meta.env.VITE_INITIAL_SUPER_ADMIN_USERNAME;
  const password = import.meta.env.VITE_INITIAL_SUPER_ADMIN_PASSWORD;
  return Boolean(username?.trim() && password?.trim());
}

export function hasAnyUsers(): boolean {
  return storage.getUsers().length > 0;
}

export async function bootstrapFromEnv(): Promise<boolean> {
  const users = storage.getUsers();
  if (users.length > 0) return false;

  const username = import.meta.env.VITE_INITIAL_SUPER_ADMIN_USERNAME?.trim();
  const password = import.meta.env.VITE_INITIAL_SUPER_ADMIN_PASSWORD?.trim();
  const displayName =
    import.meta.env.VITE_INITIAL_SUPER_ADMIN_NAME?.trim() || 'Super Admin';

  if (!username || !password) return false;

  const passwordHash = await hashPassword(password);
  const superAdmin: StoredUser = {
    id: generateId(),
    username: username.toLowerCase(),
    passwordHash,
    role: 'super_admin',
    displayName,
    createdAt: new Date().toISOString(),
    active: true,
  };

  storage.saveUsers([superAdmin]);
  return true;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const normalized = username.trim().toLowerCase();
  const user = storage.getUsers().find(
    u => u.username === normalized && u.active
  );

  if (!user) {
    return { success: false as const, error: 'Invalid username or password.' };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { success: false as const, error: 'Invalid username or password.' };
  }

  const session = createSession(user);
  storage.setSession(session);
  return { success: true as const, session };
}

export function logout(): void {
  storage.setSession(null);
}

export function getStoredSession(): AuthSession | null {
  const session = storage.getSession();
  if (!session) return null;

  const user = storage.getUsers().find(u => u.id === session.userId && u.active);
  if (!user) {
    storage.setSession(null);
    return null;
  }

  return session;
}

export function listUsers(): StoredUser[] {
  return storage.getUsers();
}

export async function registerUser(
  input: CreateUserInput,
  createdByUserId?: string
): Promise<RegisterResult> {
  const username = input.username.trim().toLowerCase();
  const displayName = input.displayName.trim();

  if (!username || username.length < 3) {
    return { success: false as const, error: 'Username must be at least 3 characters.' };
  }
  if (!displayName) {
    return { success: false as const, error: 'Display name is required.' };
  }
  if (!input.password || input.password.length < 6) {
    return { success: false as const, error: 'Password must be at least 6 characters.' };
  }

  const users = storage.getUsers();
  if (users.some(u => u.username === username)) {
    return { success: false as const, error: 'Username already exists.' };
  }

  const passwordHash = await hashPassword(input.password);
  const user: StoredUser = {
    id: generateId(),
    username,
    passwordHash,
    role: input.role,
    displayName,
    createdAt: new Date().toISOString(),
    createdBy: createdByUserId,
    active: true,
  };

  storage.saveUsers([...users, user]);
  return { success: true as const, user };
}

export function deactivateUser(userId: string, currentUserId: string): RegisterResult {
  if (userId === currentUserId) {
    return { success: false as const, error: 'You cannot deactivate your own account.' };
  }

  const users = storage.getUsers();
  const target = users.find(u => u.id === userId);
  if (!target) {
    return { success: false as const, error: 'User not found.' };
  }
  if (!target.active) {
    return { success: false as const, error: 'User is already inactive.' };
  }

  storage.saveUsers(
    users.map(u => (u.id === userId ? { ...u, active: false } : u))
  );

  return { success: true as const, user: { ...target, active: false } };
}
