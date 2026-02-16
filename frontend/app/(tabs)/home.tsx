import { styles } from '../../src/styles/home-styles';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import api from '../../src/services/api';
import { formatPrice } from '../../src/utils/formatPrice';


interface NextAppointment {
  id: number;
  clientName: string;
  service: string;
  time: string;
  dateString: string;
}

interface DashboardData {
  nextAppointment: NextAppointment | null;
  todayCount: number;
  todayIncome?: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);


  const userName = "Maria";

  // Function to fetch dashboard data
  const fetchDashboard = async () => {
    try {
      const response = await api.get('/api/appointments/dashboard/summary');
      setData(response.data);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load every time we enter the screen
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDashboard();
    }, [])
  );

  // Auto-refresh every 10 seconds when on screen
  React.useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard();
    }, 10000);

    return () => clearInterval(interval);
  }, [])

  // Pull to Refresh (drag to refresh)
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long'
    }).replace(/^\w/, c => c.toUpperCase());
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
      }
    >
      <StatusBar barStyle="light-content" backgroundColor="#6200ee" />

      {/* 1. HEADER (Greeting) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingSub}>{formatDate()}</Text>
          <Text style={styles.greetingTitle}>{getGreeting()}, {userName}! 👋</Text>
        </View>
      </View>

      {/* 2. DASHBOARD CONTENT */}
      <View style={styles.content} key={refreshKey}>

        {/* NEXT APPOINTMENT CARD */}
        <Text style={styles.sectionTitle}>Próximo Cliente 🚨</Text>

        {data?.nextAppointment ? (
          <View style={styles.nextCard}>
            <View style={styles.nextCardHeader}>
              <FontAwesome5 name="clock" size={16} color="#fff" />
              <Text style={styles.nextTime}>{data.nextAppointment.time} hs</Text>
            </View>

            <View style={styles.nextCardBody}>
              <Text style={styles.clientName}>{data.nextAppointment.clientName}</Text>
              <Text style={styles.serviceName}>{data.nextAppointment.service}</Text>

              <View style={styles.tagContainer}>
                {/* Calculate if it's today or tomorrow to show a notice */}
                {data.nextAppointment.dateString === new Date().toISOString().split('T')[0]
                  ? <Text style={styles.tagToday}>HOY</Text>
                  : <Text style={styles.tagFuture}>MAÑANA</Text>
                }
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <FontAwesome5 name="check-circle" size={40} color="#4caf50" />
            <Text style={styles.emptyTitle}>¡Todo libre!</Text>
            <Text style={styles.emptySub}>No tenés más turnos próximos.</Text>
          </View>
        )}

        {/* QUICK SUMMARY */}
        <Text style={styles.sectionTitle}>Resumen de Hoy 📊</Text>
        {/* STATS CARDS */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/agenda/today')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
              <FontAwesome5 name="calendar-check" size={20} color="#2196f3" />
            </View>
            <Text style={styles.statNumber}>{data?.todayCount || 0}</Text>
            <Text style={styles.statLabel}>Turnos Hoy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push('/revenue/stats')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
              <FontAwesome5 name="dollar-sign" size={20} color="#43a047" />
            </View>
            <Text style={styles.statNumber}>
              {data?.todayIncome !== undefined ? `$${formatPrice(data.todayIncome)}` : '--'}
            </Text>
            <Text style={styles.statLabel}>Ingresos Hoy</Text>
          </TouchableOpacity>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>Acciones Rápidas ⚡</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/calendar')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#6200ee' }]}>
            <FontAwesome5 name="plus" size={18} color="#fff" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Nuevo Turno</Text>
            <Text style={styles.actionSub}>Agendar en el calendario</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)?autoFocus=true')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#009688' }]}>
            <FontAwesome5 name="search" size={18} color="#fff" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Buscar Cliente</Text>
            <Text style={styles.actionSub}>Ver fichas técnicas</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#ccc" />
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}
