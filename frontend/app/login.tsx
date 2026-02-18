import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useContext(AuthContext);
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleLogin = async () => {
        setError(null);
        if (!email || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        const result = await login(email, password);
        if (result.success) {
            // Navigation is handled by RootLayout based on userToken
            // But we can force replace just in case
            // @ts-ignore
            router.replace('/(tabs)');
        } else {
            setError(result.error || 'Error al iniciar sesión');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={styles.scrollContainer}>

                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.setupButton}
                        onPress={() => router.push('/setup')}
                    >
                        <Text style={styles.setupButtonText}>⚙️</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Colorimetría</Text>
                    <Text style={styles.subtitle}>Ficha Técnica Digital</Text>
                </View>

                <View style={styles.form}>
                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="ejemplo@correo.com"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contraseña</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="********"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Ingresar</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => {
                            // @ts-ignore
                            router.push('/register')
                        }}>
                            <Text style={styles.link}>Regístrate</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        position: 'relative',
        width: '100%',
    },
    setupButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 10,
    },
    setupButtonText: {
        fontSize: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 18,
        color: '#7f8c8d',
    },
    form: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    errorContainer: {
        backgroundColor: '#fee2e2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    errorText: {
        color: '#b91c1c',
        fontSize: 14,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#34495e',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f1f2f6',
        height: 50,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#2c3e50',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    button: {
        backgroundColor: '#3498db',
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#7f8c8d',
        fontSize: 14,
    },
    link: {
        color: '#3498db',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
