import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

export function ResetPasswordModal({ isOpen, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      setLoading(false);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(newPassword);
      setSuccess(true);
      if (onSuccess) onSuccess();
      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in font-sans">
      <div className="w-full max-w-md p-8 rounded-3xl bg-black/90 border border-white/[0.12] space-y-6 shadow-2xl">
        <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">Security Protocol</span>
            <h3 className="text-xl font-display font-bold text-white">Reset Account Password</h3>
          </div>
          <button onClick={() => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); onClose(); }} className="text-gray-400 hover:text-white" aria-label="Close">✕</button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
            <span className="text-2xl block">✓</span>
            <h4 className="text-emerald-400 font-bold text-sm">Password Updated</h4>
            <p className="text-xs text-gray-400">Your new credentials are now active. Closing window...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">New Password (min 8 chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-cyan-400 text-black font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 text-xs"
            >
              {loading ? 'Updating Credentials...' : 'Update Password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
