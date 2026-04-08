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

        console.log(`>>> [API Request] ${config.method?.toUpperCase()} ${config.url}`, {
            hasUser: !!currentUser,
            userEmail: currentUser?.email
        });

        if (currentUser) {
            try {
                // Force fresh token to be sure it's not expired
                const token = await currentUser.getIdToken(true);
                config.headers.Authorization = `Bearer ${token}`;
                console.log(`>>> [API Interceptor] Token attached to ${config.url.substring(0, 50)}...`);
            } catch (error) {
                console.error(">>> [API Interceptor] Error getting auth token:", error);
            }
        } else {
            console.warn(`>>> [API Interceptor] No current user for request: ${config.method?.toUpperCase()} ${config.url}`);
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