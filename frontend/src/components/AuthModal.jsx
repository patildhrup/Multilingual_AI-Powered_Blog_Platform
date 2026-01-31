import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Mail, Lock, Loader2, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { signIn, signUp, signInWithGoogle, signInWithGithub } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data, error } = isLogin
                ? await signIn(email, password)
                : await signUp(email, password);

            if (error) throw error;

            if (!isLogin && data?.user && !data?.session) {
                alert("Signup successful! Please check your email to confirm your account.");
                onClose();
                return;
            }

            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = async (provider) => {
        setLoading(true);
        setError(null);
        try {
            const { error } = provider === 'google'
                ? await signInWithGoogle()
                : await signInWithGithub();
            if (error) throw error;
            // OAuth will redirect, so we don't close the modal here
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-3xl p-8 shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-[#94a3b8] hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-3xl font-black mb-2">
                            {isLogin ? 'Welcome Back' : 'Join the Conversation'}
                        </h2>
                        <p className="text-[#94a3b8] mb-8">
                            {isLogin ? 'Login to join the discussion.' : 'Create an account to share your thoughts.'}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#94a3b8] ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#94a3b8] ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-[#0f172a] border border-[#334155] rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-400 text-sm font-medium bg-red-400/10 p-3 rounded-xl border border-red-400/20">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    isLogin ? 'Sign In' : 'Create Account'
                                )}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#334155]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#1e293b] text-[#64748b] font-bold">OR</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleOAuthLogin('google')}
                                disabled={loading}
                                className="w-full bg-white hover:bg-gray-50 text-gray-900 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-[#334155] disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            <button
                                onClick={() => handleOAuthLogin('github')}
                                disabled={loading}
                                className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-[#334155] disabled:opacity-50"
                            >
                                <Github size={20} />
                                Continue with GitHub
                            </button>
                        </div>

                        <div className="mt-8 text-center text-[#94a3b8]">
                            <p>
                                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-indigo-400 font-bold hover:underline"
                                >
                                    {isLogin ? 'Sign Up' : 'Log In'}
                                </button>
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
