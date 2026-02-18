import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isBiometricVerified, setIsBiometricVerified] = useState(false);

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let userToken = await SecureStore.getItemAsync('userToken');
            let userInfo = await SecureStore.getItemAsync('userInfo');
            userInfo = userInfo ? JSON.parse(userInfo) : null;

            if (userToken) {
                setUserToken(userToken);
                setUserInfo(userInfo);
            }

            setIsLoading(false);
        } catch (e) {
            console.log(`isLogged in error ${e}`);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            console.log('Login successful', response.data);

            const token = response.data.accessToken;
            const user = response.data.user;

            setUserToken(token);
            setUserInfo(user);
            setIsBiometricVerified(true);

            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

            setIsLoading(false);
            return { success: true };
        } catch (e) {
            console.log(`Login error ${e}`);
            setIsLoading(false);
            return { success: false, error: e.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (name, email, password) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                password,
            });

            console.log('Register successful', response.data);

            const token = response.data.accessToken;
            const user = response.data.user;

            setUserToken(token);
            setUserInfo(user);
            setIsBiometricVerified(true);

            await SecureStore.setItemAsync('userToken', token);
            await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(user));

            setIsLoading(false);
            return { success: true };
        } catch (e) {
            console.log(`Register error ${e}`);
            setIsLoading(false);
            return { success: false, error: e.response?.data?.error || 'Registration failed' };
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setUserInfo(null);
        setIsBiometricVerified(false);
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('userInfo');
        setIsLoading(false);
    };

    const authenticateWithBiometrics = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                setIsBiometricVerified(true);
                return true;
            }

            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) {
                setIsBiometricVerified(true);
                return true;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Desbloquear Chroma',
                fallbackLabel: 'Usar PIN',
            });

            if (result.success) {
                setIsBiometricVerified(true);
                return true;
            }
            return false;
        } catch (e) {
            console.log("Biometric error", e);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ login, logout, register, isLoading, userToken, userInfo, isBiometricVerified, authenticateWithBiometrics }}>
            {children}
        </AuthContext.Provider>
    );
};
