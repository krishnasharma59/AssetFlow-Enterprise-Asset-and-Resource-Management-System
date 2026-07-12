import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordValid = form.password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!passwordValid) {
      setError('Password must contain at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center mb-3">
            <Package size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Create your AssetFlow account</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Every new signup starts as an Employee. Admins assign extra permissions later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="label">Full name</label>
            <input
              required
              minLength={2}
              maxLength={50}
              className="input"
              placeholder="Priya Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              maxLength={100}
              className="input"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={8}
              maxLength={20}
              className="input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p className={`mt-2 flex items-center gap-1.5 text-xs ${passwordValid ? 'text-emerald-600' : 'text-slate-500'}`}>
              {passwordValid ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              At least 8 characters
            </p>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
