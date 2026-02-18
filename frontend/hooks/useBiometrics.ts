import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export const useBiometrics = () => {
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);

    const checkBiometricSupport = useCallback(async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            setIsBiometricSupported(hasHardware);

            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            setIsBiometricEnrolled(isEnrolled);

            return { hasHardware, isEnrolled };
        } catch (error) {
            console.error('Biometric support check failed:', error);
            return { hasHardware: false, isEnrolled: false };
        }
    }, []);

    const authenticate = useCallback(async (promptMessage = 'Desbloquear App') => {
        try {
            const { hasHardware, isEnrolled } = await checkBiometricSupport();

            // If hardware not supported or not enrolled, we can consider it "passed" 
            // or fail depending on security requirements. 
            // In AuthContext we treated "no hardware" as "verified" (bypass).
            if (!hasHardware || !isEnrolled) {
                return { success: true, bypass: true };
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                fallbackLabel: 'Usar PIN',
            });

            return result;
        } catch (error) {
            console.error('Biometric authentication failed:', error);
            return { success: false, error: 'Authentication failed' };
        }
    }, [checkBiometricSupport]);

    return {
        isBiometricSupported,
        isBiometricEnrolled,
        checkBiometricSupport,
        authenticate
    };
};
