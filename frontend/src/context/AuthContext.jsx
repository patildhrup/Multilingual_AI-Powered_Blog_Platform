import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getSession();

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = (email, password) => supabase.auth.signUp({ email, password });
    const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
    const signOut = () => supabase.auth.signOut();

    const signInWithGoogle = () => supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });

    const signInWithGithub = () => supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: window.location.origin
        }
    });

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, signInWithGoogle, signInWithGithub }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
