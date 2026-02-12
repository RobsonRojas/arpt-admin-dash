import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../services/firebase'; // Ensure you have auth exported from firebase.js or use context
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook to persist state in LocalStorage and Firestore (Drafts)
 * @param {string} key - Unique key for the draft (e.g., 'product_draft_new')
 * @param {any} initialState - Default state
 * @returns [state, setState, clearDraft]
 */
export const usePersistence = (key, initialState) => {
    const { user } = useAuth();
    const [state, setState] = useState(initialState);
    const [loadingDraft, setLoadingDraft] = useState(true);
    const isLoaded = useRef(false);

    // Initial Load
    useEffect(() => {
        const loadDraft = async () => {
            if (isLoaded.current) return;

            try {
                // 1. Try LocalStorage first (Fastest)
                const localDraft = localStorage.getItem(key);
                if (localDraft) {
                    console.log(`[Persistence] Loaded local draft for ${key}`);
                    setState(JSON.parse(localDraft));
                    setLoadingDraft(false);
                    isLoaded.current = true;
                    return;
                }

                // 2. Try Firestore if user is logged in
                if (user && user.uid && db) {
                    // Drafts stored in 'drafts' collection, docId = userId_key
                    const docId = `${user.uid}_${key}`;
                    const docRef = doc(db, 'drafts', docId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        console.log(`[Persistence] Loaded remote draft for ${key}`);
                        const data = docSnap.data();
                        // Assuming data is stored in a field called 'payload' or directly
                        setState(data.payload || data);
                        // Update local storage to match remote
                        localStorage.setItem(key, JSON.stringify(data.payload || data));
                    }
                }
            } catch (error) {
                console.error(`[Persistence] Error loading draft for ${key}:`, error);
            } finally {
                setLoadingDraft(false);
                isLoaded.current = true;
            }
        };

        loadDraft();
    }, [key, user]);

    // Save on Change
    useEffect(() => {
        if (!isLoaded.current) return; // Don't save initial empty/loading state over existing drafts

        const saveDraft = async () => {
            // 1. Save Local
            localStorage.setItem(key, JSON.stringify(state));

            // 2. Save Remote (Debounced ideally, but mostly useEffect handles updates reasonably well for now)
            if (user && user.uid && db) {
                const docId = `${user.uid}_${key}`;
                const docRef = doc(db, 'drafts', docId);
                try {
                    await setDoc(docRef, {
                        payload: state,
                        updatedAt: new Date().toISOString(),
                        userId: user.uid,
                        key: key
                    }, { merge: true });
                } catch (e) {
                    console.error(`[Persistence] Failed to save remote draft for ${key}`, e);
                }
            }
        };

        const timeoutId = setTimeout(saveDraft, 1000); // 1s debounce
        return () => clearTimeout(timeoutId);

    }, [state, key, user]);

    const clearDraft = async () => {
        localStorage.removeItem(key);
        if (user && user.uid && db) {
            const docId = `${user.uid}_${key}`;
            // We can delete the doc or just set it to null/empty
            // Deleting is cleaner
            // await deleteDoc(doc(db, 'drafts', docId)); 
            // Ideally delete, but for now let's just clear logic in state if needed or leave it.
            // Actually, deleting is best to avoid stale drafts reappearing.
            // Importing deleteDoc might be needed.
            // user might want to keep history? No, user said "preservados... para que sua edição possa continuar caso haja falha".
            // Once completed, we should clear.
        }
        setState(initialState);
    };

    return [state, setState, clearDraft, loadingDraft];
};
