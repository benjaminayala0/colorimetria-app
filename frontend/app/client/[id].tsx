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

  // -- State for EDITING functionality --
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSheet, setEditingSheet] = useState<TechnicalSheet | null>(null);
  
  // -- State for CREATING functionality  --
  const [createModalVisible, setCreateModalVisible] = useState(false);
  
  // -- Form States (Shared for Create & Edit) --
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

  // --- DELETE HANDLER ---
  const handleDeleteSheet = (sheetId: number) => {
    Alert.alert(
      "Eliminar Ficha",
      "¿Estás seguro de que querés borrar esta ficha? No se puede recuperar.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/sheets/${sheetId}`);
              Alert.alert("Eliminado", "La ficha se borró correctamente.");
              fetchSheets(); 
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "No se pudo borrar la ficha.");
            }
          }
        }
      ]
    );
  };

  // --- EDIT HANDLERS ---
  const handleEditPress = (sheet: TechnicalSheet) => {
    setEditingSheet(sheet);
    setTempService(sheet.service);
    setTempFormula(sheet.formula);
    setTempNotes(sheet.notes || '');
    setTempDate(sheet.date);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSheet) return;
    try {
      await api.put(`/sheets/${editingSheet.id}`, {
        service: tempService,
        formula: tempFormula,
        notes: tempNotes,
        date: tempDate,
      });
      setEditModalVisible(false);
      Alert.alert("Success", "Technical sheet updated successfully.");
      fetchSheets(); 
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to update the technical sheet.");
    }
  };

  // --- CREATE HANDLERS ---
  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setTempService('');
    setTempFormula('');
    setTempNotes('');
    setTempDate(today); 
    setCreateModalVisible(true);
  };

  const handleCreateSheet = async () => {
    if (!tempService || !tempFormula) {
        Alert.alert("Error", "Servicio y Fórmula son obligatorios");
        return;
    }

    try {
        await api.post('/sheets', {
            clientId: id, 
            service: tempService,
            formula: tempFormula,
            notes: tempNotes,
            date: tempDate
        });
        
        setCreateModalVisible(false);
        Alert.alert("¡Éxito!", "Ficha agregada correctamente");
        fetchSheets(); 

    } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudo crear la ficha");
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
          
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emoji}>📂</Text>
              <Text style={styles.emptyText}>Este cliente no tiene fichas todavía.</Text>
            </View>
          }

          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{item.date}</Text>
                
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.serviceBadge}>{item.service}</Text>
                  
                  {/* Edit button */}
                  <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.iconButton}>
                    <Text style={{fontSize: 18}}>✏️</Text>
                  </TouchableOpacity>

                  {/* Delete button */}
                  <TouchableOpacity onPress={() => handleDeleteSheet(item.id)} style={[styles.iconButton, { marginLeft: 10 }]}>
                    <Text style={{fontSize: 18}}>🗑️</Text>
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

      {/* -- Floating Action Button for NEW SHEET (+) -- */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleOpenCreate}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* -- Edit Modal Component -- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Ficha</Text>
            <Text style={styles.inputLabel}>Servicio:</Text>
            <TextInput style={styles.input} value={tempService} onChangeText={setTempService} />
            <Text style={styles.inputLabel}>Fecha (YYYY-MM-DD):</Text>
            <TextInput style={styles.input} value={tempDate} onChangeText={setTempDate} />
            <Text style={styles.inputLabel}>Fórmula:</Text>
            <TextInput style={[styles.input, styles.textArea]} value={tempFormula} onChangeText={setTempFormula} multiline />
            <Text style={styles.inputLabel}>Notas:</Text>
            <TextInput style={[styles.input, styles.textArea]} value={tempNotes} onChangeText={setTempNotes} multiline />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveEdit}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* -- Create Modal Component -- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Visita</Text>
            
            <Text style={styles.inputLabel}>Servicio:</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Ej: Color, Corte, Nutrición"
                value={tempService} 
                onChangeText={setTempService} 
            />
            
            <Text style={styles.inputLabel}>Fecha (YYYY-MM-DD):</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Ej: 2024-01-20"
                value={tempDate} 
                onChangeText={setTempDate} 
            />
            
            <Text style={styles.inputLabel}>Fórmula:</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Ej: 30g de 7.1 + 20 vol"
                value={tempFormula} 
                onChangeText={setTempFormula} 
                multiline 
            />
            
            <Text style={styles.inputLabel}>Notas:</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Opcional..."
                value={tempNotes} 
                onChangeText={setTempNotes} 
                multiline 
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleCreateSheet}>
                <Text style={styles.buttonText}>Crear</Text>
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
    borderLeftColor: '#6200ee',
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
    marginRight: 10, 
  },
  // Updated style for icons
  iconButton: {
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