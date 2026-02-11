import { styles } from '../../src/styles/index-styles';
import { StyleSheet, Text, View, FlatList, Platform, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
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

  // -- State for "Edit Client" Modal --
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');


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
      const response = await api.post('/api/clients', {
        fullname: newClientName,
        phone: newClientPhone,
      });

      const newClient = response.data.client;

      setClients(listBefore =>{
        const newList = [...listBefore, newClient];
        newList.sort((a, b) => a.fullname.localeCompare(b.fullname));
        return newList;
      })

      setModalVisible(false);
      setNewClientName('');
      setNewClientPhone('');
      Alert.alert("¡Éxito!", "Clienta agregada correctamente");

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo crear la clienta");
    }
  };


  // -- Handler to Edit Client --
  const handleEditPress = (client: Client ) => {
    setEditingClient(client);
    setEditName(client.fullname);
    setEditPhone(client.phone || '');
    setEditModalVisible(true);
};

  const handleUpdateClient = async () => {
    if (!editName.trim() || !editingClient) {
        Alert.alert("Error", "El nombre es obligatorio");
        return;
    }

    try {
        await api.put(`/api/clients/${editingClient.id}`, {
            fullname: editName,
            phone: editPhone,
        });

        setClients(prevClients => prevClients.map(client =>
            client.id === editingClient.id
                ? { ...client, fullname: editName, phone: editPhone }
                : client
        ));

        setEditModalVisible(false);
        Alert.alert("¡Listo!", "Cliente actualizado correctamente");

    } catch (error) {
        console.error("Error al editar:", error);
        Alert.alert("Error", "No se pudo actualizar el cliente");
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

            const backup = [...clients];
            setClients(prev => prev.filter(c => c.id !== clientId));

            try {
              await api.delete(`/api/clients/${clientId}`); 
              Alert.alert("Eliminado", "Cliente eliminado correctamente.");
            } catch (error) {
              setClients(backup); 
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
        <Text style={styles.title}>Gestión de Clientes</Text>
        <Text style={{ fontSize: 14, color: '#6B7280' }}>
          Gestioná tus {clients.length} registros activos
        </Text>
      </View>

      <FlatList
        data={clients}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay clientes cargados aún.</Text>
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
              onPress={() => handleEditPress(item)}
                >
              <FontAwesome5 name="user-edit" size={18} color="#6200ee" />
            </TouchableOpacity>

            {/* Delete Button Area */}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteClient(item.id, item.fullname)}
            >
              <FontAwesome5 name="user-times" size={18} color="#ee2626" />
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
            <Text style={styles.modalTitle}>Nueva Cliente</Text>

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

      {/* -- Edit Modal -- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Cliente</Text>
            <Text style={styles.inputLabel}>Nombre Completo:</Text>
            <TextInput 
              style={styles.input} 
              value={editName} 
              onChangeText={setEditName} 
            />  
            <Text style={styles.inputLabel}>Teléfono:</Text>
            <TextInput 
              style={styles.input} 
              value={editPhone} 
              onChangeText={setEditPhone} 
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleUpdateClient}>
                <Text style={styles.buttonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
