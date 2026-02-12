import React, { createContext, useContext, useState, useEffect } from 'react';

const ErrorContext = createContext();

export const useError = () => {
    return useContext(ErrorContext);
};

export const ErrorProvider = ({ children }) => {
    const [errors, setErrors] = useState([]);

    // Load errors from local storage on mount
    useEffect(() => {
        const savedErrors = localStorage.getItem('arpt_error_logs');
        if (savedErrors) {
            try {
                setErrors(JSON.parse(savedErrors));
            } catch (e) {
                console.error("Failed to parse error logs", e);
            }
        }
    }, []);

    // Save errors to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('arpt_error_logs', JSON.stringify(errors));
    }, [errors]);

    const logError = (error, context = 'General') => {
        const newError = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            message: error.message || String(error),
            stack: error.stack || null,
            context: context,
            details: error.response?.data || null,
            url: error.config?.url || window.location.href
        };

        setErrors(prev => [newError, ...prev].slice(0, 100)); // Keep last 100 errors
        console.error(`[${context}]`, error);
    };

    const clearErrors = () => {
        setErrors([]);
        localStorage.removeItem('arpt_error_logs');
    };

    return (
        <ErrorContext.Provider value={{ errors, logError, clearErrors }}>
            {children}
        </ErrorContext.Provider>
    );
};
