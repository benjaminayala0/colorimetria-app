import { styles } from '../../src/styles/services-styles';
import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform, } from 'react-native';
import { useFocusEffect } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import api from '@/services/api';
import { formatPrice } from '../../src/utils/formatPrice';

interface Service {
    id: number;
    name: string;
    price: number;
}

export default function ServicesScreen() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Form states
    const [formName, setFormName] = useState('');
    const [formPrice, setFormPrice] = useState('');

    // Fetch services from API
    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/services');
            setServices(response.data);
        } catch (error) {
            console.error('Error loading services:', error);
            Alert.alert('Error', 'No se pudieron cargar los servicios');
        } finally {
            setLoading(false);
        }
    }, []);

    // Load services when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchServices();
        }, [fetchServices])
    );

    // Pull to refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchServices();
        setRefreshing(false);
    };

    // Open create modal
    const handleOpenCreateModal = () => {
        setEditingService(null);
        setFormName('');
        setFormPrice('');
        setModalVisible(true);
    };

    // Open edit modal
    const handleOpenEditModal = (service: Service) => {
        setEditingService(service);
        setFormName(service.name);
        setFormPrice(service.price.toString());
        setModalVisible(true);
    };

    // Create or update service
    const handleSaveService = async () => {
        if (!formName.trim() || !formPrice.trim()) {
            Alert.alert('Error', 'Todos los campos son obligatorios');
            return;
        }

        const price = parseFloat(formPrice);
        if (isNaN(price) || price <= 0) {
            Alert.alert('Error', 'El precio debe ser un número válido mayor a 0');
            return;
        }

        try {
            if (editingService) {
                // Update existing service
                await api.put(`/api/services/${editingService.id}`, {
                    name: formName,
                    price: price,
                });
                Alert.alert('✅ Actualizado', 'Servicio actualizado correctamente');
            } else {
                // Create new service
                await api.post('/api/services', {
                    name: formName,
                    price: price,
                });
                Alert.alert('✅ Creado', 'Servicio creado correctamente');
            }

            setModalVisible(false);
            fetchServices();
        } catch (error) {
            console.error('Error saving service:', error);
            Alert.alert('Error', 'No se pudo guardar el servicio');
        }
    };

    // Delete service
    const handleDeleteService = (service: Service) => {
        Alert.alert(
            'Eliminar Servicio',
            `¿Estás seguro de eliminar "${service.name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/api/services/${service.id}`);
                            Alert.alert('✅ Eliminado', 'Servicio eliminado correctamente');
                            fetchServices();
                        } catch (error) {
                            console.error('Error deleting service:', error);
                            Alert.alert('Error', 'No se pudo eliminar el servicio');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Servicios 💇</Text>
            </View>

            <View style={styles.content}>
                {services.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <FontAwesome5 name="cut" size={60} color="#ccc" />
                        <Text style={styles.emptyText}>No hay servicios creados</Text>
                        <Text style={styles.emptyText}>Presiona + para agregar uno</Text>
                    </View>
                ) : (
                    <FlatList
                        data={services}
                        keyExtractor={(item) => item.id.toString()}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
                        }
                        renderItem={({ item }) => (
                            <View style={styles.serviceCard}>
                                <View style={styles.serviceInfo}>
                                    <Text style={styles.serviceName}>{item.name}</Text>
                                    <Text style={styles.servicePrice}>${formatPrice(item.price)}</Text>
                                </View>
                                <View style={styles.serviceActions}>
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => handleOpenEditModal(item)}
                                    >
                                        <FontAwesome5 name="edit" size={20} color="#6200ee" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => handleDeleteService(item)}
                                    >
                                        <FontAwesome5 name="trash-alt" size={20} color="#ee2626" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                )}
            </View>

            {/* FAB Button */}
            <TouchableOpacity style={styles.fab} onPress={handleOpenCreateModal}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            {/* Create/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                        </Text>

                        <Text style={styles.inputLabel}>Nombre del Servicio:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Color"
                            value={formName}
                            onChangeText={setFormName}
                        />

                        <Text style={styles.inputLabel}>Precio:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej: 15000"
                            value={formPrice}
                            onChangeText={setFormPrice}
                            keyboardType="numeric"
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.saveButton]}
                                onPress={handleSaveService}
                            >
                                <Text style={styles.buttonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}
