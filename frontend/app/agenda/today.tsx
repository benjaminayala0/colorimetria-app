import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import api from '@/services/api';
import { formatPrice } from '../../src/utils/formatPrice';
import { styles } from '../../src/styles/agenda-styles';

interface AgendaAppointment {
    id: number;
    time: string;
    clientName: string;
    clientPhone: string | null;
    clientId: number | null;
    service: string;
    price: number;
    status: string;
    completedAt?: string | null;
    isPast: boolean;
    isCurrent: boolean;
}

interface AgendaData {
    date: string;
    appointments: AgendaAppointment[];
    totalAppointments: number;
    pendingCount: number;
    completedCount: number;
    absentCount: number;
    cancelledCount: number;
    totalRevenue: number;
}

export default function TodayAgendaScreen() {
    const router = useRouter();
    const [agenda, setAgenda] = useState<AgendaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAgenda = async () => {
        try {
            const response = await api.get('/api/appointments/today');
            setAgenda(response.data);
        } catch (error) {
            console.error('Error fetching agenda:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchAgenda();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAgenda();
    };

    const handleCall = (phone: string | null, clientName: string) => {
        if (!phone) {
            Alert.alert('Sin teléfono', `${clientName} no tiene número registrado`);
            return;
        }

        // Format phone number for Argentina
        let formattedPhone = phone.replace(/\s/g, '');
        if (!formattedPhone.startsWith('+')) {
            if (formattedPhone.startsWith('54')) {
                formattedPhone = '+' + formattedPhone;
            } else if (formattedPhone.startsWith('9')) {
                formattedPhone = '+54' + formattedPhone;
            } else {
                formattedPhone = '+549' + formattedPhone;
            }
        }

        Linking.openURL(`tel:${formattedPhone}`).catch(() => {
            Alert.alert('Error', 'No se pudo abrir el marcador');
        });
    };

    const handleViewClient = (clientId: number | null) => {
        if (clientId) {
            router.push(`/client/${clientId}` as any);
        } else {
            Alert.alert('Sin cliente', 'Este turno no tiene cliente asociado');
        }
    };

    const handleUpdateStatus = async (appointmentId: number, newStatus: string) => {
        try {
            setRefreshing(true);
            await api.patch(`/api/appointments/${appointmentId}/status`, { status: newStatus });

            // Refresh the agenda to show updated status
            await fetchAgenda();

            const statusLabels: Record<string, string> = {
                completed: 'Completado',
                absent: 'Ausente',
                cancelled: 'Cancelado'
            };
            Alert.alert('✅ Estado Actualizado', `Turno marcado como ${statusLabels[newStatus]}`);
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Error', 'No se pudo actualizar el estado');
        } finally {
            setRefreshing(false);
        }
    };

    const formatDateString = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusIcon = (appointment: AgendaAppointment) => {
        // Show icon based on actual status
        switch (appointment.status) {
            case 'completed':
                return <FontAwesome5 name="check-circle" size={20} color="#4caf50" style={styles.statusIcon} />;
            case 'absent':
                return <FontAwesome5 name="times-circle" size={20} color="#f44336" style={styles.statusIcon} />;
            case 'cancelled':
                return <FontAwesome5 name="ban" size={20} color="#9e9e9e" style={styles.statusIcon} />;
            default: // pending
                if (appointment.isCurrent) {
                    return <FontAwesome5 name="clock" size={20} color="#6200ea" style={styles.statusIcon} />;
                } else {
                    return <FontAwesome5 name="clock" size={20} color="#2196f3" style={styles.statusIcon} />;
                }
        }
    };

    const getRelativeTime = (time: string): string | null => {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        const appointmentTime = new Date();
        appointmentTime.setHours(hours, minutes, 0, 0);

        const diffMs = appointmentTime.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (Math.abs(diffMins) < 5) {
            return '🔴 AHORA';
        } else if (diffMins > 0 && diffMins <= 60) {
            return `Comienza en ${diffMins} min`;
        } else if (diffMins < 0 && diffMins >= -120) {
            return `Comenzó hace ${Math.abs(diffMins)} min`;
        }
        return null;
    };

    const getDuration = (scheduledTime: string, completedAt: string | null): string | null => {
        if (!completedAt) return null;

        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const scheduledDate = new Date();
        scheduledDate.setHours(hours, minutes, 0, 0);

        const completedDate = new Date(completedAt);
        const diffMs = completedDate.getTime() - scheduledDate.getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins < 0) return null;

        if (diffMins < 60) {
            return `${diffMins} min`;
        } else {
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
        }
    };

    const renderAppointment = ({ item }: { item: AgendaAppointment }) => {
        // Determine card style based on status
        const cardStyle = [
            styles.appointmentCard,
            item.status === 'completed' && styles.appointmentCardCompleted,
            item.status === 'absent' && styles.appointmentCardAbsent,
            item.status === 'cancelled' && styles.appointmentCardCancelled,
            item.status === 'pending' && item.isCurrent && styles.appointmentCardCurrent,
            item.status === 'pending' && !item.isCurrent && styles.appointmentCardUpcoming,
        ];

        return (
            <View style={cardStyle}>
                <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentTime}>
                        {getStatusIcon(item)}
                        <Text style={[
                            styles.timeText,
                            item.isPast && styles.timeTextPast,
                            item.isCurrent && styles.timeTextCurrent,
                        ]}>
                            {item.time}
                        </Text>
                        {item.isCurrent && (
                            <View style={styles.currentBadge}>
                                <Text style={styles.currentBadgeText}>ACTUAL</Text>
                            </View>
                        )}
                        {/* Relative Time Indicator */}
                        {item.status === 'pending' && getRelativeTime(item.time) && (
                            <View style={{
                                backgroundColor: item.isCurrent ? '#6200ea' : '#2196f3',
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 10,
                                marginLeft: 8
                            }}>
                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                                    {getRelativeTime(item.time)}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={[
                        styles.appointmentPrice,
                        item.isPast && styles.appointmentPricePast,
                    ]}>
                        ${formatPrice(item.price)}
                    </Text>
                </View>

                <Text style={[
                    styles.appointmentClient,
                    item.isPast && styles.appointmentClientPast,
                ]}>
                    {item.clientName}
                </Text>

                <Text style={[
                    styles.appointmentService,
                    item.isPast && styles.appointmentServicePast,
                ]}>
                    {item.service}
                </Text>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                        onPress={() => handleCall(item.clientPhone, item.clientName)}
                    >
                        <FontAwesome5 name="phone" size={14} color="#2196f3" />
                        <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                            Llamar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleViewClient(item.clientId)}
                    >
                        <FontAwesome5 name="user" size={14} color="#333" />
                        <Text style={styles.actionButtonText}>Ver Ficha</Text>
                    </TouchableOpacity>
                </View>

                {/* Status Actions - Show for pending appointments  */}
                {item.status === 'pending' && (
                    <View style={styles.statusActions}>
                        <TouchableOpacity
                            style={[styles.statusButton, styles.completedButton]}
                            onPress={() => handleUpdateStatus(item.id, 'completed')}
                        >
                            <FontAwesome5 name="check" size={12} color="#fff" />
                            <Text style={styles.statusButtonText}>Completado</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.statusButton, styles.absentButton]}
                            onPress={() => handleUpdateStatus(item.id, 'absent')}
                        >
                            <FontAwesome5 name="times" size={12} color="#fff" />
                            <Text style={styles.statusButtonText}>Ausente</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.statusButton, styles.cancelledButton]}
                            onPress={() => handleUpdateStatus(item.id, 'cancelled')}
                        >
                            <FontAwesome5 name="ban" size={12} color="#fff" />
                            <Text style={styles.statusButtonText}>Cancelado</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Status Badges - Show for finalized appointments */}
                {item.status === 'completed' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ backgroundColor: '#4caf50', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✅ Completado</Text>
                        </View>
                        {/* Duration Badge */}
                        {getDuration(item.time, item.completedAt ?? null) && (
                            <View style={{ backgroundColor: '#2196f3', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                                    ⏱️ {getDuration(item.time, item.completedAt ?? null)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
                {item.status === 'absent' && (
                    <View style={{ backgroundColor: '#f44336', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>❌ Ausente</Text>
                    </View>
                )}
                {item.status === 'cancelled' && (
                    <View style={{ backgroundColor: '#9e9e9e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>🚫 Cancelado</Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.container}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                            <Text style={styles.backText}>Volver</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Agenda de Hoy</Text>
                    </View>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6200ea" />
                    </View>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <FontAwesome5 name="arrow-left" size={20} color="#fff" />
                        <Text style={styles.backText}>Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Agenda de Hoy</Text>
                    {agenda && (
                        <Text style={styles.headerDate}>
                            {formatDateString(agenda.date)}
                        </Text>
                    )}
                </View>

                {/* Summary Bar */}
                {agenda && (
                    <>
                        <View style={styles.summaryBar}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Pendientes</Text>
                                <Text style={[styles.summaryValue, { color: '#2196f3' }]}>{agenda.pendingCount}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Completados</Text>
                                <Text style={[styles.summaryValue, { color: '#4caf50' }]}>{agenda.completedCount}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Ausentes</Text>
                                <Text style={[styles.summaryValue, { color: '#f44336' }]}>{agenda.absentCount}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Cancelados</Text>
                                <Text style={[styles.summaryValue, { color: '#9e9e9e' }]}>{agenda.cancelledCount}</Text>
                            </View>
                        </View>

                    </>
                )}

                {/* Appointments List */}
                {agenda && agenda.appointments.length > 0 ? (
                    <FlatList
                        data={agenda.appointments}
                        renderItem={renderAppointment}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#6200ea']}
                            />
                        }
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <FontAwesome5 name="calendar-day" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>
                            No hay turnos programados para hoy
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() => router.push('/(tabs)/calendar')}
                        >
                            <Text style={styles.emptyButtonText}>Ir al Calendario</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </>
    );
}
