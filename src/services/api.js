import axios from 'axios';
import { auth } from './firebase';

export const api = axios.create({
    baseURL: "https://arpt.site/api",
    // baseURL: "http://localhost:4001",
    timeout: 8 * 1000,
});
console.log('>>> [API.js] Module loaded and api instance created');

api.interceptors.request.use(
    async (config) => {
        const currentUser = auth?.currentUser;

        if (currentUser) {
            try {
                // Force fresh token to be sure it's not expired
                const token = await currentUser.getIdToken(true);
                
                // Ensure headers object exists
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
                
                console.log(`>>> [API Interceptor] Token attached successfully to: ${config.url}`);
            } catch (error) {
                console.error(">>> [API Interceptor] Error getting auth token:", error);
            }
        } else {
            console.warn(`>>> [API Interceptor] No current user found for request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const setupInterceptors = (logError) => {
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            logError(error, 'API');
            return Promise.reject(error);
        }
    );
};