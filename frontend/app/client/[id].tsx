import { useLocalSearchParams, Stack } from 'expo-router';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Image, ScrollView,KeyboardAvoidingView, Platform} from 'react-native';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import api from '../../src/services/api';

// Define the TechnicalSheet type
interface TechnicalSheet {
  id: number;
  date: string;
  service: string;
  formula: string;
  notes?: string;
  photoBefore?: string;
  photoAfter?: string;
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

  // -- Image States for Create Modal --
  const [photoBefore, setPhotoBefore] = useState<string | null>(null);
  const [photoAfter, setPhotoAfter] = useState<string | null>(null);

  // Fetch technical sheets for the client when component mounts
  const fetchSheets = async () => {
    try {
      setLoading(true);
      // Fetch sheets from backend
      const response = await api.get(`/api/sheets/client/${id}`); 
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

  // Open gallery
  const openGallery = async (type: 'before' | 'after') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería para subir fotos.');
      return;
    }

    // Lauch gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (type === 'before') setPhotoBefore(uri);
      else setPhotoAfter(uri);
    }
  };

  const openCamera = async (type: 'before' | 'after' ) => {
    const camaraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const libraryStatus = await MediaLibrary.requestPermissionsAsync(true);

    if (camaraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara y galería para subir fotos.');
      return;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality:1, 
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      //update state
      if (type === 'before') setPhotoBefore(uri);
      else setPhotoAfter(uri);

      // Save to gallery
      try {
      await MediaLibrary.createAssetAsync(uri);
    } catch (error) {
      console.error("Error al abrir cámara:", error);
    }
   }
  };

  // // --- IMAGE PICKER HANDLER ---
  const pickImage = async (type: 'before' | 'after') => {
     Alert.alert(
      'Seleccionar Imagen',
      '¿De dónde querés obtener la imagen?',
      [
        {
          text: 'cancelar',
          style: 'cancel',
        },
        {
          text: 'Cámara',
          onPress: () => openCamera(type),
        },
        {
          text: 'Galería',
          onPress: () => openGallery(type),
        }
      ]
    );
  };

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
              await api.delete(`/api/sheets/${sheetId}`); 
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
    setPhotoBefore(sheet.photoBefore || null);
    setPhotoAfter(sheet.photoAfter || null);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSheet) return;
    try {
      const formData = new FormData();
      formData.append('service', tempService);
      formData.append('formula', tempFormula);
      formData.append('notes', tempNotes);
      formData.append('date', tempDate);

      if (photoBefore && !photoBefore.startsWith('http')) {
        const filename = photoBefore.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('photoBefore', {
          uri: photoBefore,
          name: filename || 'edit_before.jpg',
          type: type,
        } as any);
      }

      if (photoAfter && !photoAfter.startsWith('http')) {
        const filename = photoAfter.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('photoAfter', {
          uri: photoAfter,
          name: filename || 'edit_after.jpg',
          type: type,
        } as any);
      }

      await api.put(`/api/sheets/${editingSheet.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setEditModalVisible(false);
      Alert.alert("Éxito", "Ficha técnica actualizada correctamente.");
      fetchSheets(); 
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo actualizar la ficha.");
    }
  };

  // --- CREATE HANDLERS ---
  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setTempService('');
    setTempFormula('');
    setTempNotes('');
    setTempDate(today);
    setPhotoBefore(null);
    setPhotoAfter(null);
    setCreateModalVisible(true);
  };

  // -- CREATE SHEET HANDLER --
  const handleCreateSheet = async () => {
    if (!tempService || !tempFormula) {
        Alert.alert("Error", "Servicio y Fórmula son obligatorios");
        return;
    }

    try {
  
        const formData = new FormData();
    
        formData.append('clientId', id.toString()); 
        formData.append('service', tempService);
        formData.append('formula', tempFormula);
        formData.append('notes', tempNotes);
        formData.append('date', tempDate);

        
        if (photoBefore) {
            const filename = photoBefore.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('photoBefore', {
                uri: photoBefore,
                name: filename || 'before.jpg',
                type: type,
            } as any); 
        }

        if (photoAfter) {
            const filename = photoAfter.split('/').pop();
            const match = /\.(\w+)$/.exec(filename || '');
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('photoAfter', {
                uri: photoAfter,
                name: filename || 'after.jpg',
                type: type,
            } as any);
        }

    
        await api.post('/api/sheets', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        setCreateModalVisible(false);
        Alert.alert("¡Éxito!", "Ficha agregada con fotos correctamente");
        fetchSheets(); 

    } catch (error) {
        console.error("Error creating sheet:", error);
        Alert.alert("Error", "No se pudo crear la ficha técnica");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Historial Cliente` }} />

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
                    <FontAwesome5 name="edit" size={18} color="#6200ee" />
                  </TouchableOpacity>

                  {/* Delete button */}
                  <TouchableOpacity onPress={() => handleDeleteSheet(item.id)} style={[styles.iconButton, { marginLeft: 10 }]}>
                    <FontAwesome5 name="trash-alt" size={18} color="#ee2626" />
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

              {(item.photoBefore || item.photoAfter) && (
                <View style={styles.photosContainer}>
                    {item.photoBefore && (
                        <View style={styles.photoWrapper}>
                            <Text style={styles.photoLabel}>Antes</Text>
                            <Image source={{ uri: item.photoBefore }} style={styles.cardImage} />
                        </View>
                    )}
                    {item.photoAfter && (
                        <View style={styles.photoWrapper}>
                            <Text style={styles.photoLabel}>Después</Text>
                            <Image source={{ uri: item.photoAfter }} style={styles.cardImage} />
                        </View>
                    )}
                </View>
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Editar Ficha</Text>
            <Text style={styles.inputLabel}>Servicio:</Text>
            <TextInput style={styles.input} value={tempService} onChangeText={setTempService} />
            <Text style={styles.inputLabel}>Fecha (YYYY-MM-DD):</Text>
            <TextInput style={styles.input} value={tempDate} onChangeText={setTempDate} />
            <Text style={styles.inputLabel}>Fórmula:</Text>
            <TextInput style={[styles.input, styles.textArea]} value={tempFormula} onChangeText={setTempFormula} multiline />
            <Text style={styles.inputLabel}>Notas:</Text>
            <TextInput style={[styles.input, styles.textArea]} value={tempNotes} onChangeText={setTempNotes} multiline />

            <Text style={styles.inputLabel}>Fotos (Opcional):</Text>
            <View style={styles.photoButtonsContainer}>
                {/* Button before */}
                <TouchableOpacity style={styles.photoUploadButton} onPress={() => pickImage('before')}>
                  {photoBefore ? (
                    <Image source={{ uri: photoBefore }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                         <Text>📷 Antes</Text>
                    </View>
                  )}
                </TouchableOpacity>


                {/* Button after */}
                <TouchableOpacity style={styles.photoUploadButton} onPress={() => pickImage('after')}>
                  {photoAfter ? (
                    <Image source={{ uri: photoAfter }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.placeholderImage}>
                         <Text>✨ Después</Text>
                    </View>
                  )}
                </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveEdit}>
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* -- Create Modal Component -- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
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

            <Text style={styles.inputLabel}>Fotos (Opcional):</Text>
            <View style={styles.photoButtonsContainer}>
                <TouchableOpacity style={styles.photoUploadButton} onPress={() => pickImage('before')}>
                    {photoBefore ? (
                        <Image source={{ uri: photoBefore }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                             <Text>📷 Antes</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.photoUploadButton} onPress={() => pickImage('after')}>
                    {photoAfter ? (
                        <Image source={{ uri: photoAfter }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholderImage}>
                             <Text>✨ Después</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleCreateSheet}>
                <Text style={styles.buttonText}>Crear</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  photosContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  photoWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  cardImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#eee',
    resizeMode: 'cover',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  photoUploadButton: {
    width: '48%',
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: '90%', 
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
    padding: 10,
    borderRadius: 8,
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
