import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome5 } from '@expo/vector-icons';
import api from '@/services/api';
import { formatPrice } from '../../src/utils/formatPrice';
import { styles } from '../../src/styles/revenue-styles';

type Period = 'day' | 'week' | 'month' | 'year';

interface Appointment {
    id: number;
    clientName: string;
    service: string;
    price: number;
    dateString: string;
    time: string;
}

interface RevenueStats {
    period: Period;
    startDate: string;
    endDate: string;
    totalIncome: number;
    appointmentCount: number;
    appointments: Appointment[];
    insights: {
        averagePerAppointment: number;
        topService: string | null;
        topServiceCount: number;
    };
}

const PERIOD_LABELS = {
    day: 'Hoy',
    week: 'Semana',
    month: 'Mes',
    year: 'Año',
};

export default function RevenueStatsScreen() {
    const router = useRouter();
    const [period, setPeriod] = useState<Period>('day');
    const [stats, setStats] = useState<RevenueStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await api.get(`/appointments/revenue/stats?period=${period}`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching revenue stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchStats();
        }, [period])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const formatDateRange = () => {
        if (!stats) return '';

        if (stats.startDate === stats.endDate) {
            return new Date(stats.startDate).toLocaleDateString('es-AR');
        }

        const start = new Date(stats.startDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
        const end = new Date(stats.endDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
        return `${start} - ${end}`;
    };

    const renderAppointment = ({ item }: { item: Appointment }) => {
        const date = new Date(item.dateString).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short'
        });

        return (
            <View style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentDate}>{date} • {item.time} hs</Text>
                    <Text style={styles.appointmentPrice}>${formatPrice(item.price)}</Text>
                </View>
                <Text style={styles.appointmentClient}>{item.clientName}</Text>
                <Text style={styles.appointmentService}>{item.service}</Text>
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
                        <Text style={styles.headerTitle}>Estadísticas de Ingresos</Text>
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
                    <Text style={styles.headerTitle}>Estadísticas de Ingresos</Text>
                </View>

                {/* Period Tabs */}
                <View style={styles.tabsContainer}>
                    {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.tab, period === p && styles.activeTab]}
                            onPress={() => setPeriod(p)}
                        >
                            <Text style={[styles.tabText, period === p && styles.activeTabText]}>
                                {PERIOD_LABELS[p]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ea']} />
                    }
                >
                    {/* Date Range */}
                    <View style={styles.dateRangeContainer}>
                        <FontAwesome5 name="calendar-alt" size={16} color="#666" />
                        <Text style={styles.dateRangeText}>{formatDateRange()}</Text>
                    </View>

                    {/* Summary Cards */}
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryTitle}>📊 Resumen</Text>

                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Total</Text>
                                <Text style={styles.summaryValue}>${formatPrice(stats?.totalIncome || 0)}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Promedio</Text>
                                <Text style={styles.summaryValue}>
                                    ${formatPrice(stats?.insights.averagePerAppointment || 0)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.summaryRow}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Turnos</Text>
                                <Text style={styles.summaryValueSecondary}>{stats?.appointmentCount || 0}</Text>
                            </View>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryLabel}>Servicio Top</Text>
                                <Text style={styles.summaryValueSecondary}>
                                    {stats?.insights.topService || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Appointments List */}
                    <View style={styles.listContainer}>
                        <Text style={styles.listTitle}>📋 Detalle de Turnos</Text>

                        {stats && stats.appointments.length > 0 ? (
                            <FlatList
                                data={stats.appointments}
                                renderItem={renderAppointment}
                                keyExtractor={(item) => item.id.toString()}
                                scrollEnabled={false}
                                contentContainerStyle={{ paddingBottom: 15 }}
                            />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <FontAwesome5 name="inbox" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>
                                    No hay turnos en este período
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
