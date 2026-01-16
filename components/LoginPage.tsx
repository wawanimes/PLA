
import React, { useState } from 'react';
import { Lock, User, Key, ArrowRight, ShieldCheck, Info } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: string, pass: string) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        {/* Branding Area */}
        <div className="text-center mb-8">
          <div className="inline-flex relative mb-4">
             <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full"></div>
             <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-cyan-400 to-blue-800 p-[1.5px] orb-glow ring-2 ring-black/40">
                <div className="w-full h-full rounded-full bg-black flex flex-col items-center justify-center border border-white/10 overflow-hidden">
                   <div className="text-[6px] text-cyan-400 font-bold tracking-[0.2em] -mb-1">PLANET</div>
                   <div className="text-xs text-white font-black italic tracking-tighter futuristic-font">STREAM</div>
                </div>
             </div>
          </div>
          <h1 className="text-2xl futuristic-font text-white tracking-tighter uppercase italic">
            Administration
          </h1>
          <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.4em] mt-1 opacity-60">
            Accès sécurisé
          </p>
        </div>

        {/* Login Box */}
        <div className="mod-box p-8 border-t-2 border-cyan-500 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Identifiant
              </label>
              <div className="relative group">
                <input 
                  type="text"
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-3.5 pl-4 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-700"
                  placeholder="Admin name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Key size={12} /> Mot de passe
              </label>
              <div className="relative group">
                <input 
                  type="password"
                  required
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-3.5 pl-4 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 bg-black border-white/10 rounded focus:ring-0 text-cyan-500" />
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 transition-colors uppercase">Se souvenir</span>
              </label>
              <a href="#" className="text-[10px] font-bold text-[#70ccff] hover:underline uppercase">Oublié ?</a>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-lg transition-all shadow-xl shadow-cyan-900/20 flex items-center justify-center gap-3 border border-cyan-400/20 group"
            >
              CONNEXION <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 text-slate-500">
            <ShieldCheck size={24} className="opacity-30" />
            <p className="text-[9px] font-medium leading-relaxed uppercase tracking-tight">
              Cette zone est réservée aux administrateurs. Votre adresse IP est enregistrée pour des raisons de sécurité.
            </p>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="w-full mt-6 text-center text-[11px] font-bold text-slate-600 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          Retourner au site
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
