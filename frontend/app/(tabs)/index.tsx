import { StyleSheet, Text, View, FlatList, Platform, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router'; 
import api from '../../src/services/api'; 

// Define the Client type
interface Client {
  id: number;
  fullname: string;
  phone: string;
  allergies?: string; 
}

// HomeScreen component
export default function HomeScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); 

  // -- State for "Add Client" Modal --
  const [modalVisible, setModalVisible] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Function to fetch clients
  const fetchClients = async () => {
    try {
      console.log("Pidiendo clientes al backend...");
      const response = await api.get('/api/clients');
      setClients(response.data); 
    } catch (error) {
      console.error("Error conectando:", error);
    } finally {
      setLoading(false);
    }
  };
  // Fetch clients on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchClients();
    }, [])
  );

  // -- Handler to Create Client --
  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    try {
      await api.post('/api/clients', {
        fullname: newClientName,
        phone: newClientPhone,
      });

      setModalVisible(false);
      setNewClientName('');
      setNewClientPhone('');
      fetchClients(); 
      Alert.alert("¡Éxito!", "Clienta agregada correctamente");

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo crear la clienta");
    }
  };

  // -- Handler to DELETE Client --
  const handleDeleteClient = (clientId: number, clientName: string) => {
    Alert.alert(
      "Eliminar Cliente",
      `¿Estás seguro de borrar a ${clientName}? Se borrará también todo su historial de fichas.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/api/clients/${clientId}`);
              fetchClients(); // Reload list
              Alert.alert("Eliminado", "Cliente eliminado correctamente.");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "No se pudo eliminar al cliente.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>Cargando clientas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Clientas 💇‍♀️</Text>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay clientas cargadas aún.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            {/* Main Card Area - Click to go to details */}
            <TouchableOpacity 
              style={styles.cardContent}
              onPress={() => {
                router.push(`/client/${item.id}` as any);
              }}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.fullname.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.name}>{item.fullname}</Text>
                <Text style={styles.phone}>{item.phone || 'Sin teléfono'}</Text>
              </View>
            </TouchableOpacity>

            {/*Button edit area*/}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                router.push(`/client/edit/${item.id}` as any);
              }}
            >
              <Text style={{fontSize: 20}}>✏️</Text>
            </TouchableOpacity>

            {/* Delete Button Area */}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteClient(item.id, item.fullname)}
            >
              <Text style={{fontSize: 20}}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* -- FAB (+) -- */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* -- Create Modal -- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Clienta</Text>

            <Text style={styles.inputLabel}>Nombre Completo:</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: Marta Lopez"
              value={newClientName} 
              onChangeText={setNewClientName} 
            />

            <Text style={styles.inputLabel}>Teléfono:</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ej: 11 5555 6666"
              keyboardType="phone-pad"
              value={newClientPhone} 
              onChangeText={setNewClientPhone} 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleCreateClient}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? 30 : 0, 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 16,
  },
  // -- Modified Card Styles to include Delete Button --
  cardContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    paddingRight: 15, 
  },
  cardContent: {
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  deleteButton: {
    padding: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  phone: {
    fontSize: 14,
    color: '#666',
  },
  // -- FAB Styles --
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#6200ee',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: -2, 
  },
  // -- Modal Styles --
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#6200ee',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});