'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { UserCog, Plus, ShieldCheck, User, AlertCircle, UserX } from 'lucide-react';
import { api } from '../lib/api';
import { getRoleLabel } from '../auth/permissions';
import type { StoredUser, UserRole } from '../auth/types';
import { useAuth } from '../context/AuthContext';

export default function StaffManagementSection() {
  const { session } = useAuth();
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('receptionist');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const user = await api.users.create({ username, password, displayName, role });
      setSuccess(`Registered ${user.displayName} successfully.`);
      setUsername('');
      setDisplayName('');
      setPassword('');
      setRole('receptionist');
      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (userId: string, name: string) => {
    if (!session) return;
    if (!window.confirm(`Deactivate ${name}? They will no longer be able to sign in.`)) return;

    try {
      await api.users.deactivate(userId);
      setSuccess(`${name} has been deactivated.`);
      setError(null);
      await refreshUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user.');
    }
  };

  return (
    <div className="space-y-6" id="staff-management-container">
      <div className="bg-white p-4 rounded-xl border border-hotel-100 shadow-sm">
        <h2 className="text-xl font-bold text-hotel-950 flex items-center gap-2">
          <UserCog className="text-hotel-600 size-5" />
          Staff Management
        </h2>
        <p className="text-xs text-brand-500 mt-1">
          Register super admins and receptionists for this terminal
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleRegister}
          className="bg-white rounded-xl border border-brand-100 shadow-sm p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-brand-800 flex items-center gap-2">
            <Plus className="size-4 text-indigo-600" />
            Register Staff Member
          </h3>

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <ShieldCheck className="size-4 shrink-0" />
              {success}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm font-semibold rounded-lg px-3 py-2 outline-hidden"
              placeholder="min. 3 characters"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm font-semibold rounded-lg px-3 py-2 outline-hidden"
              placeholder="Shown in header"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm font-semibold rounded-lg px-3 py-2 outline-hidden"
              placeholder="min. 6 characters"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-sm font-semibold rounded-lg px-3 py-2 outline-hidden"
            >
              <option value="receptionist">Receptionist</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold uppercase tracking-wider text-xs py-2.5 rounded-xl transition-all cursor-pointer"
          >
            {isSubmitting ? 'Registering...' : 'Register Staff'}
          </button>
        </form>

        <div className="bg-white rounded-xl border border-brand-100 shadow-sm p-5 space-y-3">
          <h3 className="text-sm font-bold text-brand-800">Active Staff ({users.filter(u => u.active).length})</h3>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {users.length === 0 ? (
              <p className="text-xs text-brand-500 py-4 text-center">No staff registered.</p>
            ) : (
              users.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${
                    user.active ? 'border-brand-100 bg-brand-50/30' : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-9 rounded-full flex items-center justify-center shrink-0 ${
                      user.role === 'super_admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role === 'super_admin' ? <ShieldCheck className="size-4" /> : <User className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-900 truncate">{user.displayName}</p>
                      <p className="text-[10px] text-brand-500 font-mono">@{user.username}</p>
                      <span className={`inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        user.role === 'super_admin'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>

                  {user.active && user.id !== session?.userId ? (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(user.id, user.displayName)}
                      className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-100 cursor-pointer"
                    >
                      <UserX className="size-3.5" />
                      Deactivate
                    </button>
                  ) : user.id === session?.userId ? (
                    <span className="text-[10px] font-bold uppercase text-indigo-600 shrink-0">You</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Inactive</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
