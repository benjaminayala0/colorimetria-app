import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router'; // Import useRootNavigationState
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useContext, useState } from 'react';
import { ActivityIndicator, View, Image, TouchableOpacity, Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, AuthContext } from '../context/AuthContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { userToken, isLoading, isBiometricVerified, authenticateWithBiometrics } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!rootNavigationState?.key) return;

    if (!rootNavigationState?.key) return;

    if (!userToken) {
      const isLoginPage = segments[0] === 'login';
      const isRegisterPage = segments[0] === 'register';
      const isSetupPage = segments[0] === 'setup';

      if (!isLoginPage && !isRegisterPage && !isSetupPage) {
        // @ts-ignore
        router.replace('/login');
      }
    } else if (isBiometricVerified) {
      const isLoginPage = segments[0] === 'login';
      if (isLoginPage) {
        // @ts-ignore
        router.replace('/(tabs)/home');
      }
    }
  }, [userToken, isLoading, isBiometricVerified, segments, rootNavigationState?.key]);

  useEffect(() => {
    if (userToken && !isBiometricVerified && !isLoading) {
      handleBiometricAuth();
    }
  }, [userToken, isBiometricVerified, isLoading]);

  const handleBiometricAuth = async () => {
    if (isBiometricLoading) return;
    setIsBiometricLoading(true);
    await authenticateWithBiometrics();
    setIsBiometricLoading(false);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Image
          source={require('../assets/images/v3.png')}
          style={{ width: 450, height: 1150, resizeMode: 'contain' }}
        />
      </View>
    );
  }

  if (userToken && !isBiometricVerified) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Image
          source={require('../assets/images/v3.png')}
          style={{ width: 300, height: 290, marginBottom: 20, resizeMode: 'contain' }}
        />
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>Desbloquear App</Text>
        <TouchableOpacity
          onPress={handleBiometricAuth}
          style={{ backgroundColor: '#2c3e50', padding: 15, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>Usar Biometría</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {

          }}
          style={{ marginTop: 20 }}
        >
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ presentation: 'modal', title: 'Configuración' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
