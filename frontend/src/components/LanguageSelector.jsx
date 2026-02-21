import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LANGUAGES } from '../lingo/dictionary';

export default function LanguageSelector({ currentLocale, onChange, className = "", position = "bottom" }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const activeLang = LANGUAGES.find(l => l.code === (currentLocale || 'en')) || LANGUAGES[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-3 bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 hover:border-indigo-500/50 transition-all shadow-lg group"
            >
                <div className="flex items-center gap-2">
                    <Globe size={18} className="text-indigo-400" />
                    <span className="text-sm font-bold text-[#f8fafc]">{activeLang.nativeName}</span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-[#64748b] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: position === 'bottom' ? 10 : -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: position === 'bottom' ? 10 : -10, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className={`absolute ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 w-full min-w-[200px] bg-[#0f172a] border border-[#334155] rounded-2xl shadow-2xl z-[100] py-2 overflow-y-auto max-h-64 custom-scrollbar`}
                    >
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .custom-scrollbar::-webkit-scrollbar {
                                width: 5px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb {
                                background: #334155;
                                border-radius: 10px;
                            }
                            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: #4f46e5;
                            }
                        ` }} />
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => {
                                    onChange(lang.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-all hover:bg-indigo-500/10 ${currentLocale === lang.code ? 'text-indigo-400 bg-indigo-500/5' : 'text-[#94a3b8] hover:text-white'
                                    }`}
                            >
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-bold">{lang.nativeName}</span>
                                    <span className="text-[10px] opacity-70 uppercase tracking-widest">{lang.name}</span>
                                </div>
                                {currentLocale === lang.code && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="bg-indigo-500/20 p-1 rounded-full"
                                    >
                                        <Check size={12} strokeWidth={3} className="text-indigo-400" />
                                    </motion.div>
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
