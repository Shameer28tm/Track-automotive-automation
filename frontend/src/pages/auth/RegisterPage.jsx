import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, Mail, Lock, User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phone,
        password: formData.password,
        password_confirm: formData.passwordConfirm,
      });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const msg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError('Registration failed. Please check your information.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-4">
          <Wrench className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Create Customer Account</h2>
        <p className="mt-1 text-sm text-slate-400">Join Track Automotive to book service appointments and manage vehicles</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Sarah Connor"
                  className="block w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="block w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 0123"
                  className="block w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password (min 8 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
