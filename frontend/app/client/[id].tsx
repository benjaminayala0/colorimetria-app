import { useLocalSearchParams, Stack } from 'expo-router';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
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

  // -- State for editing functionality --
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSheet, setEditingSheet] = useState<TechnicalSheet | null>(null);
  
  // -- Temporary state for form inputs --
  const [tempService, setTempService] = useState('');
  const [tempFormula, setTempFormula] = useState('');
  const [tempNotes, setTempNotes] = useState('');
  const [tempDate, setTempDate] = useState('');

  // Fetch technical sheets for the client when component mounts
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

  useEffect(() => {
    if (id) fetchSheets();
  }, [id]);

  // -- Handler to open the modal with selected sheet data --
  const handleEditPress = (sheet: TechnicalSheet) => {
    setEditingSheet(sheet);
    setTempService(sheet.service);
    setTempFormula(sheet.formula);
    setTempNotes(sheet.notes || '');
    setTempDate(sheet.date);
    setModalVisible(true);
  };

  // -- Handler to submit updated data to the backend --
  const handleSaveEdit = async () => {
    if (!editingSheet) return;

    try {
      // Send PUT request to update the specific sheet
      await api.put(`/sheets/${editingSheet.id}`, {
        service: tempService,
        formula: tempFormula,
        notes: tempNotes,
        date: tempDate,
      });

      // Close modal and refresh list
      setModalVisible(false);
      Alert.alert("Success", "Technical sheet updated successfully.");
      fetchSheets(); 

    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update the technical sheet.");
    }
  };

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
                
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.serviceBadge}>{item.service}</Text>
                  
                  {/* Edit button triggered by user interaction */}
                  <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.editButton}>
                    <Text style={{fontSize: 18}}>✏️</Text>
                  </TouchableOpacity>
                </View>
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

      {/* -- Edit Modal Component -- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Ficha</Text>

            <Text style={styles.inputLabel}>Servicio:</Text>
            <TextInput style={styles.input} value={tempService} onChangeText={setTempService} />

            <Text style={styles.inputLabel}>Fecha (YYYY-MM-DD):</Text>
            <TextInput style={styles.input} value={tempDate} onChangeText={setTempDate} />

            <Text style={styles.inputLabel}>Fórmula:</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={tempFormula} 
              onChangeText={setTempFormula} 
              multiline 
            />

            <Text style={styles.inputLabel}>Notas:</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={tempNotes} 
              onChangeText={setTempNotes} 
              multiline 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveEdit}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

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
    marginRight: 10, // Added margin for spacing with edit button
  },
  editButton: {
    padding: 5,
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
  // -- Modal Styles --
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
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
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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