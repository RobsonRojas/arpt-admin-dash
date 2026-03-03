import axios from 'axios';
import { auth } from './firebase';

export const api = axios.create({
    baseURL: "https://arpt.site/api",
    // baseURL: "http://localhost:4001",
    timeout: 8 * 1000,
});

api.interceptors.request.use(
    async (config) => {
        if (auth?.currentUser) {
            try {
                const token = await auth.currentUser.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            } catch (error) {
                console.error("Error getting auth token:", error);
            }
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