import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const DEFAULT_URL = 'http://192.168.1.6:3000/api';

const api = axios.create({
    baseURL: DEFAULT_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        try {
            const storedUrl = await SecureStore.getItemAsync('api_url');
            if (storedUrl) {
                const cleanStored = storedUrl.replace(/\/$/, '');
                if (cleanStored.endsWith('/api')) {
                    config.baseURL = cleanStored;
                } else {
                    config.baseURL = `${cleanStored}/api`;
                }
            }
        } catch (e) {
        }

        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                let currentBaseUrl = DEFAULT_URL;
                try {
                    const storedUrl = await SecureStore.getItemAsync('api_url');
                    if (storedUrl) {
                        const cleanStored = storedUrl.replace(/\/$/, '');
                        if (cleanStored.endsWith('/api')) {
                            currentBaseUrl = cleanStored;
                        } else {
                            currentBaseUrl = `${cleanStored}/api`;
                        }
                    }
                } catch (e) { }
                const response = await axios.post(`${currentBaseUrl}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken } = response.data;

                await SecureStore.setItemAsync('userToken', accessToken);

                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                console.error('RefreshToken failed:', refreshError);
                await SecureStore.deleteItemAsync('userToken');
                await SecureStore.deleteItemAsync('refreshToken');
                await SecureStore.deleteItemAsync('userInfo');
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
