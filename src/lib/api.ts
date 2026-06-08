import type {
  AmenityItem,
  Bill,
  Customer,
  CustomerSnapshot,
  DiscountSettings,
  FoodItem,
  Room,
  RoomBookingItem,
  SalesReceipt,
  TerminalSettings,
} from '@/types';
import type { AuthSession, CreateUserInput, StoredUser } from '@/auth/types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    getSession: () =>
      request<{
        session: AuthSession | null;
        hasUsers: boolean;
        bootstrapConfigured: boolean;
      }>('/api/auth/session'),
    login: (username: string, password: string) =>
      request<{ session: AuthSession }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () =>
      request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  },

  users: {
    list: () => request<StoredUser[]>('/api/users'),
    create: (input: CreateUserInput) =>
      request<StoredUser>('/api/users', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    deactivate: (id: string) =>
      request<StoredUser>(`/api/users/${id}`, { method: 'PATCH' }),
  },

  rooms: {
    list: () => request<Room[]>('/api/rooms'),
    create: (room: Omit<Room, 'id'>) =>
      request<Room>('/api/rooms', {
        method: 'POST',
        body: JSON.stringify(room),
      }),
    update: (id: string, updates: Partial<Room>) =>
      request<Room>(`/api/rooms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/rooms/${id}`, { method: 'DELETE' }),
  },

  food: {
    list: () => request<FoodItem[]>('/api/food'),
    create: (item: Omit<FoodItem, 'id'>) =>
      request<FoodItem>('/api/food', {
        method: 'POST',
        body: JSON.stringify(item),
      }),
    update: (id: string, updates: Partial<FoodItem>) =>
      request<FoodItem>('/api/food', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...updates }),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/food?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  amenities: {
    list: () => request<AmenityItem[]>('/api/amenities'),
    create: (item: Omit<AmenityItem, 'id'>) =>
      request<AmenityItem>('/api/amenities', {
        method: 'POST',
        body: JSON.stringify(item),
      }),
    update: (id: string, updates: Partial<AmenityItem>) =>
      request<AmenityItem>('/api/amenities', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...updates }),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(
        `/api/amenities?id=${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      ),
  },

  customers: {
    list: () => request<Customer[]>('/api/customers'),
    create: (customer: CustomerSnapshot) =>
      request<Customer>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(customer),
      }),
  },

  bills: {
    list: () => request<Bill[]>('/api/bills'),
    create: (payload: {
      customer: CustomerSnapshot;
      roomBookings: RoomBookingItem[];
      existingCustomerId?: string;
    }) =>
      request<Bill>('/api/bills', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string, updates: Partial<Bill>) =>
      request<Bill>(`/api/bills/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    close: (id: string, cashReceived: number) =>
      request<{ bill: Bill; receipt: SalesReceipt }>(`/api/bills/${id}/close`, {
        method: 'POST',
        body: JSON.stringify({ cashReceived }),
      }),
    delete: (id: string) =>
      request<{ success: boolean; roomIds: string[] }>(`/api/bills/${id}`, {
        method: 'DELETE',
      }),
  },

  receipts: {
    list: () => request<SalesReceipt[]>('/api/receipts'),
    delete: (id: string) =>
      request<{ success: boolean; receiptId: string }>(`/api/receipts/${id}`, {
        method: 'DELETE',
      }),
    clear: () =>
      request<{ success: boolean }>('/api/receipts', { method: 'DELETE' }),
  },

  settings: {
    getTerminal: () => request<TerminalSettings>('/api/settings/terminal'),
    updateTerminal: (settings: TerminalSettings) =>
      request<TerminalSettings>('/api/settings/terminal', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    getDiscounts: () => request<DiscountSettings>('/api/settings/discounts'),
    updateDiscounts: (settings: DiscountSettings) =>
      request<DiscountSettings>('/api/settings/discounts', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },
};

export { ApiError };
