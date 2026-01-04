import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import api from '../../src/services/api';

// Define the TechnicalSheet type
interface TechnicalSheet {
  id: number;
  date: string;
  service: string;
  formula: string;
  notes?: string;
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams(); 
  const [sheets, setSheets] = useState<TechnicalSheet[]>([]);
  const [loading, setLoading] = useState(true);

 // Fetch technical sheets for the client when component mounts
  useEffect(() => {
    const fetchSheets = async () => {
      try {
        console.log(`Buscando fichas para cliente ${id}...`);
      // Fetch sheets from backend
        const response = await api.get(`/sheets/client/${id}`);
        setSheets(response.data);
      } catch (error) {
        console.error("Error trayendo fichas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSheets();
  }, [id]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Historial Cliente #${id}` }} />

      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={sheets}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 15 }}
          
         // Show this when there are no technical sheets
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emoji}>📂</Text>
              <Text style={styles.emptyText}>Este cliente no tiene fichas todavía.</Text>
            </View>
          }

          // define how each item is rendered
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.serviceBadge}>{item.service}</Text>
              </View>
              
              <Text style={styles.label}>Fórmula:</Text>
              <Text style={styles.formula}>{item.formula}</Text>

              {item.notes && (
                <>
                  <Text style={styles.label}>Notas:</Text>
                  <Text style={styles.notes}>{item.notes}</Text>
                </>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

// Styles for the component
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Estilo cuando no hay datos
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  // Tarjeta de Ficha
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: '#6200ee', // Borde violeta decorativo
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#999',
    fontWeight: 'bold',
  },
  serviceBadge: {
    backgroundColor: '#ede7f6',
    color: '#6200ee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    fontSize: 12,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 5,
    textTransform: 'uppercase',
  },
  formula: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  notes: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
});