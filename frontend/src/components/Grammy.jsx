import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Volume2, Wand2, ArrowRight, X, GripHorizontal, Check, Languages, ChevronDown } from 'lucide-react';
import { LANGUAGES } from '../lingo/dictionary';

export default function Grammy({ mode = 'viewer', onReplace, baseLang = 'en' }) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [targetLang, setTargetLang] = useState(baseLang);
    const [activeTab, setActiveTab] = useState('options'); // 'options', 'result', 'suggestions'
    const [langOpen, setLangOpen] = useState(false);
    const widgetRef = useRef(null);
    const langRef = useRef(null);

    useEffect(() => {
        const handleSelection = (e) => {
            // Ignore mouseup events that originate from inside the widget
            if (widgetRef.current && widgetRef.current.contains(e.target)) {
                return;
            }

            setTimeout(() => {
                let text = '';
                let rect = null;

                const selection = window.getSelection();
                const activeEl = document.activeElement;

                // Case 1: Standard DOM text selection (Viewer mode)
                if (selection && selection.toString().trim().length > 1) {
                    text = selection.toString().trim();
                    try {
                        const range = selection.getRangeAt(0);
                        rect = range.getBoundingClientRect();
                    } catch (err) { }
                }

                // Case 2: Selection inside Input/Textarea (Editor mode)
                if (!text && activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
                    const start = activeEl.selectionStart;
                    const end = activeEl.selectionEnd;
                    if (start !== end && (end - start) > 1) {
                        text = activeEl.value.substring(start, end).trim();
                        rect = activeEl.getBoundingClientRect();
                    }
                }

                if (text && rect) {
                    setPosition({
                        x: Math.min(window.innerWidth - 300, Math.max(20, (rect.left + rect.right) / 2 - 140 + window.scrollX)),
                        y: rect.top + window.scrollY - 140
                    });
                    setSelectedText(text);
                    setIsVisible(true);
                    setAiResult(null);
                    setActiveTab('options');
                    setLangOpen(false);
                } else {
                    setIsVisible(false);
                }
            }, 100);
        };

        document.addEventListener('mouseup', handleSelection);
        return () => {
            document.removeEventListener('mouseup', handleSelection);
        };
    }, []);

    // Close lang dropdown on outside click
    useEffect(() => {
        if (!langOpen) return;
        const handler = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) {
                setLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [langOpen]);

    const handleClose = (e) => {
        e.stopPropagation();
        setIsVisible(false);
    };

    // BCP-47 locale codes for TTS voices
    const VOICE_LOCALE_MAP = {
        en: 'en-US',
        hi: 'hi-IN',
        ar: 'ar-SA',
        fr: 'fr-FR',
        de: 'de-DE',
        zh: 'zh-CN',
        ja: 'ja-JP',
    };

    const handleRead = () => {
        window.speechSynthesis.cancel(); // stop any ongoing speech
        const utterance = new SpeechSynthesisUtterance(selectedText);
        utterance.lang = VOICE_LOCALE_MAP[targetLang] || targetLang;
        window.speechSynthesis.speak(utterance);
    };

    const handleImprove = async () => {
        setLoading(true);
        setActiveTab('result');
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/improve-writing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: selectedText, locale: targetLang })
            });
            const data = await response.json();
            setAiResult({ type: 'improved', text: data.improvedContent });
        } catch (error) {
            console.error('Improvement failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggest = async () => {
        setLoading(true);
        setActiveTab('suggestions');
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/get-suggestions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: selectedText, locale: targetLang })
            });
            const data = await response.json();
            setAiResult({ type: 'suggestions', ...data });
        } catch (error) {
            console.error('Suggestions failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (onReplace && aiResult?.text) {
            onReplace(aiResult.text);
            setIsVisible(false);
        }
    };

    const activeLang = LANGUAGES.find(l => l.code === targetLang) || LANGUAGES[0];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={widgetRef}
                    drag
                    dragMomentum={false}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    style={{
                        position: 'absolute',
                        left: position.x,
                        top: position.y,
                        zIndex: 1000,
                    }}
                    className="w-72 bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-2xl overflow-visible text-slate-800 cursor-default"
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header/Grabber */}
                    <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b border-slate-100 cursor-move rounded-t-2xl">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-indigo-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grammy AI</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <GripHorizontal size={14} className="opacity-20" />
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={handleClose}
                                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {activeTab === 'options' && (
                            <div className="space-y-4">
                                <div className="p-2 bg-slate-50 rounded-lg text-[11px] italic text-slate-500 line-clamp-2 border border-slate-100">
                                    "{selectedText}"
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <button onClick={handleRead} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-all group border border-slate-100">
                                        <Volume2 size={18} className="text-blue-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-bold uppercase text-slate-600">Read</span>
                                    </button>
                                    <button onClick={handleImprove} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-all group border border-slate-100">
                                        <Languages size={18} className="text-purple-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-bold uppercase text-slate-600">Translate</span>
                                    </button>
                                    <button onClick={handleSuggest} className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-all group border border-slate-100">
                                        <Sparkles size={18} className="text-emerald-600 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-bold uppercase text-slate-600">Suggest</span>
                                    </button>
                                </div>

                                {/* Beautiful Language Picker */}
                                <div className="relative pt-2 border-t border-slate-100" ref={langRef}>
                                    <button
                                        type="button"
                                        onClick={() => setLangOpen(v => !v)}
                                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Languages size={12} className="text-indigo-600 opacity-70" />
                                            <span className="text-[10px] font-bold text-slate-800">{activeLang.nativeName}</span>
                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider">{activeLang.name}</span>
                                        </div>
                                        <ChevronDown size={11} className={`text-slate-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {langOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                                                transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                                                className="grammy-lang-scroll absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-2xl z-[1100] overflow-y-auto max-h-52"
                                                style={{
                                                    scrollbarWidth: 'thin',
                                                    scrollbarColor: '#4f46e5 transparent',
                                                }}
                                            >
                                                <style>{`
                                                    .grammy-lang-scroll::-webkit-scrollbar { width: 4px; }
                                                    .grammy-lang-scroll::-webkit-scrollbar-track { background: transparent; }
                                                    .grammy-lang-scroll::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 99px; }
                                                    .grammy-lang-scroll::-webkit-scrollbar-thumb:hover { background: #6366f1; }
                                                `}</style>
                                                {LANGUAGES.map((lang) => (
                                                    <button
                                                        key={lang.code}
                                                        type="button"
                                                        onClick={() => { setTargetLang(lang.code); setLangOpen(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-all hover:bg-indigo-50 ${targetLang === lang.code ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900'}`}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold">{lang.nativeName}</span>
                                                            <span className="text-[9px] text-slate-400 uppercase tracking-wider">{lang.name}</span>
                                                        </div>
                                                        {targetLang === lang.code && (
                                                            <Check size={11} strokeWidth={3} className="text-indigo-600" />
                                                        )}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'result' || activeTab === 'suggestions') && (
                            <div className="space-y-3">
                                {loading ? (
                                    <div className="flex flex-col items-center py-6 gap-3">
                                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-[10px] font-bold animate-pulse">Consulting AI...</span>
                                    </div>
                                ) : (
                                    <>
                                        {activeTab === 'result' && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs leading-relaxed max-h-40 overflow-y-auto text-slate-700">
                                                    {aiResult?.text}
                                                </div>
                                                {mode === 'writer' && (
                                                    <button
                                                        onClick={handleApply}
                                                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 p-2 rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-indigo-500/20"
                                                    >
                                                        <Check size={14} /> Replace Selection
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'suggestions' && aiResult && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                {aiResult.synonyms?.length > 0 && (
                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Synonyms</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {aiResult.synonyms.map((s, i) => (
                                                                <span key={i} className="text-[10px] bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-100 text-emerald-700 font-medium">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {aiResult.tips?.length > 0 && (
                                                    <div className="space-y-2">
                                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Writing Tips</span>
                                                        <div className="space-y-1.5">
                                                            {aiResult.tips.map((t, i) => (
                                                                <div key={i} className="flex gap-2 text-[10px] text-slate-600 leading-normal">
                                                                    <ArrowRight size={10} className="mt-0.5 text-indigo-600 flex-shrink-0" />
                                                                    {t}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setActiveTab('options')}
                                            className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[9px] font-bold uppercase transition-all text-slate-400 hover:text-slate-600 border border-slate-100"
                                        >
                                            Back to Options
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
