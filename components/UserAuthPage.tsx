
import React, { useState } from 'react';
import { ArrowRight, Mail, Lock, User, AtSign, ChevronLeft } from 'lucide-react';

interface UserAuthPageProps {
  onLoginSuccess: (userData: any) => void;
  onBack: () => void;
  initialMode?: 'signin' | 'signup';
}

const UserAuthPage: React.FC<UserAuthPageProps> = ({ onLoginSuccess, onBack, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful login/registration
    onLoginSuccess({ email: formData.email, name: formData.name || 'User' });
  };

  const inputClass = "w-full bg-[#1f1f23] border border-transparent focus:border-[#a855f7] rounded-lg p-3 text-sm text-white focus:outline-none transition-all placeholder:text-slate-600";
  const labelClass = "text-[13px] font-medium text-slate-400 mb-1.5 block";

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative">
      {/* Radial Gradient Spotlight Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-[420px] w-full z-10 animate-in fade-in zoom-in-95 duration-500">
        <button 
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} /> Back to Site
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {mode === 'signin' ? 'Sign in to your account' : 'Create an Account'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <>
              <div>
                <label className={labelClass}>Name</label>
                <input 
                  type="text" 
                  placeholder="Name" 
                  className={inputClass}
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className={labelClass}>Username</label>
                <input 
                  type="text" 
                  placeholder="Username" 
                  className={inputClass}
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </>
          )}

          <div>
            <label className={labelClass}>Email</label>
            <input 
              type="email" 
              placeholder="Email" 
              className={inputClass}
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={labelClass}>Password</label>
              {mode === 'signin' && (
                <a href="#" className="text-[12px] text-slate-500 hover:text-purple-400 transition-colors">
                  Forgot your password?
                </a>
              )}
            </div>
            <input 
              type="password" 
              placeholder="Password" 
              className={inputClass}
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98] mt-4"
          >
            {mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            {mode === 'signin' ? (
              <>
                Don't have an account yet?{' '}
                <button 
                  onClick={() => setMode('signup')}
                  className="text-white font-bold hover:text-purple-400 transition-colors"
                >
                  Create an Account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('signin')}
                  className="text-white font-bold hover:text-purple-400 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserAuthPage;
