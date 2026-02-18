import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Stack } from 'expo-router';

// Default fallback URL
const DEFAULT_URL = 'http://192.168.1.6:3000';

export default function SetupScreen() {
    const [apiUrl, setApiUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadCurrentUrl();
    }, []);

    const loadCurrentUrl = async () => {
        try {
            const storedUrl = await SecureStore.getItemAsync('api_url');
            setApiUrl(storedUrl || DEFAULT_URL);
        } catch (error) {
            console.error('Error loading API URL:', error);
            setApiUrl(DEFAULT_URL);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!apiUrl.trim()) {
            Alert.alert('Error', 'La URL no puede estar vacía');
            return;
        }

        if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
            Alert.alert('Error', 'La URL debe comenzar con http:// o https://');
            return;
        }

        try {
            setIsLoading(true);
            const cleanUrl = apiUrl.replace(/\/$/, '');

            await SecureStore.setItemAsync('api_url', cleanUrl);

            Alert.alert('¡Guardado!', 'La configuración se ha guardado correctamente. La aplicación se recargará.', [
                {
                    text: 'OK',
                    onPress: () => {

                        router.replace('/login');
                    }
                }
            ]);
        } catch (error) {
            console.error('Error saving API URL:', error);
            Alert.alert('Error', 'No se pudo guardar la configuración');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Stack.Screen options={{ title: 'Configuración', headerShown: true }} />

            <View style={styles.content}>
                <Text style={styles.title}>Configurar Servidor</Text>
                <Text style={styles.description}>
                    Ingresa la dirección IP y puerto de tu servidor backend.
                    Esto es útil para desarrollo local.
                </Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>URL del API</Text>
                    <TextInput
                        style={styles.input}
                        value={apiUrl}
                        onChangeText={setApiUrl}
                        placeholder="http://192.168.1.X:3000"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                    />
                    <Text style={styles.hint}>Ejemplo: http://192.168.1.6:3000</Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>Guardar Configuración</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
        justifyContent: 'center',
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 6,
    },
    button: {
        backgroundColor: '#6200ee',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
    },
});
