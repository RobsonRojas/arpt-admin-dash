import axios from 'axios';
import { auth } from './firebase';

const getBaseURL = () => {
    if (typeof window !== 'undefined') {
        const savedURL = localStorage.getItem('arpt_api_url');
        if (savedURL) return savedURL;
    }
    return "https://arpt.site/api";
};

export const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 8 * 1000,
});
console.log('>>> [API.js] Module loaded and api instance created');

api.interceptors.request.use(
    async (config) => {
        const currentUser = auth?.currentUser;

        if (import.meta.env.VITE_SKIP_AUTH === 'true') {
            config.headers = config.headers || {};
            config.headers['Authorization'] = `Bearer test-admin-token`;
            return config;
        }

        if (currentUser) {
            try {
                // Force fresh token to be sure it's not expired
                const token = await currentUser.getIdToken(true);
                
                // Use .set for AxiosHeaders (Axios 1.x) or direct assignment for plain objects
                if (config.headers && typeof config.headers.set === 'function') {
                    config.headers.set('Authorization', `Bearer ${token}`);
                } else {
                    config.headers = config.headers || {};
                    config.headers['Authorization'] = `Bearer ${token}`;
                }
                
                console.log(`>>> [API Interceptor] Token attached successfully [v2] to: ${config.url}`);
            } catch (error) {
                console.error(">>> [API Interceptor] Error getting auth token:", error);
            }
        } else {
            console.warn(`>>> [API Interceptor] No current user found (singleton auth) for request: ${config.method?.toUpperCase()} ${config.url}`);
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