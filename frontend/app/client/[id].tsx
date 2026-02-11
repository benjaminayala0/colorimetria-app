import { useLocalSearchParams, Stack } from 'expo-router';
import { styles } from '../../src/styles/clients-styles';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert, Image, ScrollView, KeyboardAvoidingView, Platform, RefreshControl} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import *as ImageManipulator from 'expo-image-manipulator'
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
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [showCreateDatePicker, setShowCreateDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

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

  const optimizeImage = async (uri: string) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.error("Error optimizando:", error);
      return uri; 
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
      quality: 1,
    });

    if (!result.canceled) {
      let uri = result.assets[0].uri;

      uri = await optimizeImage(uri);
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
      let uri = result.assets[0].uri;

      try {
        await MediaLibrary.createAssetAsync(uri);
      } catch (error) {
        console.error("Error al guardar en galería:", error);
      }

      uri = await optimizeImage(uri);

      //update state
      if (type === 'before') setPhotoBefore(uri);
      else setPhotoAfter(uri);
   }
  };

  const formatDateToText = (dateString: string) => {
    if (!dateString) {
      return '';
    }
    const [year, month, day] = dateString.split('-').map(Number);
    const localDate = new Date(year, (month || 1) - 1, day || 1);
    return localDate
      .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const handleCreateDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCreateDatePicker(false);
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setTempDate(dateString);
    }
  };

  const handleEditDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEditDatePicker(false);
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setTempDate(dateString);
    }
  };

  // -- REFRESH HANDLER --
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSheets();
    setRefreshing(false);
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

            const backup = [...sheets];

            setSheets(prev => prev.filter(s => s.id !== sheetId));

            try {
              await api.delete(`/api/sheets/${sheetId}`); 
              Alert.alert("Eliminado", "La ficha se borró correctamente.");
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
    const cleanDate = sheet.date.split('T')[0];
    setTempDate(cleanDate);
    setPhotoBefore(sheet.photoBefore || null);
    setPhotoAfter(sheet.photoAfter || null);
    setShowEditDatePicker(false);
    setEditModalVisible(true);
    
  };

  const handleSaveEdit = async () => {
    if (!editingSheet) return;

    if (tempService.length > 255) {
        Alert.alert("Error", "El campo Servicio no puede exceder los 255 caracteres.");
        return;
    }
    if (tempFormula.length > 255) {
        Alert.alert("Error", "El campo Fórmula no puede exceder los 255 caracteres.");
        return;
    }
    if (tempNotes.length > 500) {
        Alert.alert("Error", "El campo Notas no puede exceder los 500 caracteres.");
        return;
    }

    if (!tempService || !tempFormula) {
        Alert.alert("Error", "Servicio y Fórmula son obligatorios");
        return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(tempDate)) {
      Alert.alert("Error", "Seleccioná una fecha válida");
        return;
    }
    
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
    setShowCreateDatePicker(false);
    setCreateModalVisible(true);
  };

  // -- CREATE SHEET HANDLER --
  const handleCreateSheet = async () => {


    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(tempDate)) {
      Alert.alert("Error", "Seleccioná una fecha válida");
        return;
    }
    if (!tempService || !tempFormula) {
        Alert.alert("Error", "Servicio y Fórmula son obligatorios");
        return;
    }

    const checkDate = new Date(tempDate);
    if (isNaN(checkDate.getTime())) {
        Alert.alert("Error", "La fecha ingresada no es válida");
        return;
    }

    if (isSubmitting) return; 
    setIsSubmitting(true);

    if (tempService.length > 255) {
        Alert.alert("Error", "El campo Servicio no puede exceder los 255 caracteres.");
        setIsSubmitting(false);
        return;
    }
    if (tempFormula.length > 255) {
        Alert.alert("Error", "El campo Fórmula no puede exceder los 255 caracteres.");
        setIsSubmitting(false);
        return;
    }
    if (tempNotes.length > 500) {
        Alert.alert("Error", "El campo Notas no puede exceder los 500 caracteres.");
        setIsSubmitting(false);
        return;
    }

    try {
  
        const formData = new FormData();
    
        formData.append('clientId', id.toString()); 
        formData.append('service', tempService);
        formData.append('formula', tempFormula);
        formData.append('notes', tempNotes);
      setShowCreateDatePicker(false);
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
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleCancelCreate = () => {
   
    const hasUnsavedData = 
        tempService.trim() !== '' || 
        tempFormula.trim() !== '' || 
        tempNotes.trim() !== '' || 
        photoBefore !== null || 
        photoAfter !== null;

    if (hasUnsavedData) {
        Alert.alert(
            "¿Descartar cambios?",
            "Si salís ahora, se perderán los datos ingresados.",
            [
                { text: "Seguir editando", style: "cancel" },
                { 
                    text: "Descartar", 
                    style: "destructive", 
            onPress: () => {
              setShowCreateDatePicker(false);
              setCreateModalVisible(false);
            }
                }
            ]
        );
    } else {
      setShowCreateDatePicker(false);
        setCreateModalVisible(false);
    }
  };

  const handleCancelEdit = () => {
    Alert.alert(
        "¿Cancelar edición?",
        "Los cambios que hiciste no se guardarán.",
        [
            { text: "Seguir editando", style: "cancel" },
            { 
                text: "Salir sin guardar", 
                style: "destructive", 
          onPress: () => {
            setShowEditDatePicker(false);
            setEditModalVisible(false);
          }
            }
        ]
    );
    setShowEditDatePicker(false);
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />
          }
          
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emoji}>📂</Text>
              <Text style={styles.emptyText}>Este cliente no tiene fichas todavía.</Text>
            </View>
          }

          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
      
                <View style={{flexDirection: 'row', alignItems: 'center',flex: 1,justifyContent: 'space-between',marginBottom: 5,width: '100%'}}>
                  <Text style={styles.serviceBadge}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.service}
                  </Text>
                  
                  {/* Edit button */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => handleEditPress(item)} style={styles.iconButton}>
                    <FontAwesome5 name="edit" size={18} color="#6200ee" />
                  </TouchableOpacity>

                  {/* Delete button */}
                  <TouchableOpacity onPress={() => handleDeleteSheet(item.id)} style={[styles.iconButton, { marginLeft: 10 }]}>
                    <FontAwesome5 name="trash-alt" size={18} color="#ee2626" />
                  </TouchableOpacity>
                </View>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FontAwesome5 name="calendar-alt" size={12} color="#999" style={{ marginRight: 5 }} />
                <Text style={styles.date}>{item.date}</Text>
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
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Editar Ficha</Text>
            <Text style={styles.inputLabel}>Servicio:</Text>
            <TextInput style=
              {styles.input}
              value={tempService}
              onChangeText={setTempService} 
              maxLength={255}
              />
            <Text style={[styles.charCounter, tempService.length >= 250 && styles.charCounterWarning]}>
                {tempService.length}/255
            </Text>

            <Text style={styles.inputLabel}>Fecha:</Text>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowEditDatePicker(true)}
            >
              <Text style={styles.timeButtonText}>
                📅 {tempDate ? formatDateToText(tempDate) : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>

            {showEditDatePicker && (
              <DateTimePicker
                value={new Date(tempDate ? `${tempDate}T12:00:00` : Date.now())}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEditDateChange}
                locale="es-ES"
              />
            )}
            {Platform.OS === 'ios' && showEditDatePicker && (
              <TouchableOpacity 
                style={styles.timePickerCloseButton}
                onPress={() => setShowEditDatePicker(false)}
              >
                <Text style={styles.timePickerCloseText}>Listo</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.inputLabel}>Fórmula:</Text>
            <TextInput 
            style={[styles.input, styles.textArea]} 
            value={tempFormula} 
            onChangeText={setTempFormula} 
            multiline 
            maxLength={255}
            />
            <Text style={[styles.charCounter, tempFormula.length >= 250 && styles.charCounterWarning]}>
                {tempFormula.length}/255
            </Text>

            <Text style={styles.inputLabel}>Notas:</Text>
            <TextInput 
            style={[styles.input, styles.textArea]} 
            value={tempNotes} 
            onChangeText={setTempNotes} 
            multiline
            maxLength={500}
            />
            <Text style={[styles.charCounter, tempNotes.length >= 490 && styles.charCounterWarning]}>
                {tempNotes.length}/500
            </Text>

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
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelEdit}>
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
        onRequestClose={handleCancelCreate}
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
                maxLength={255}
            />
            <Text style={[styles.charCounter, tempService.length >= 250 && styles.charCounterWarning]}>
              {tempService.length}/255
            </Text>

            <Text style={styles.inputLabel}>Fecha:</Text>
            <TouchableOpacity 
              style={styles.timeButton}
              onPress={() => setShowCreateDatePicker(true)}
            >
              <Text style={styles.timeButtonText}>
                📅 {tempDate ? formatDateToText(tempDate) : 'Seleccionar fecha'}
              </Text>
            </TouchableOpacity>

            {showCreateDatePicker && (
              <DateTimePicker
                value={new Date(tempDate ? `${tempDate}T12:00:00` : Date.now())}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleCreateDateChange}
                locale="es-ES"
              />
            )}
            {Platform.OS === 'ios' && showCreateDatePicker && (
              <TouchableOpacity 
                style={styles.timePickerCloseButton}
                onPress={() => setShowCreateDatePicker(false)}
              >
                <Text style={styles.timePickerCloseText}>Listo</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.inputLabel}>Fórmula:</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Ej: 30g de 7.1 + 20 vol"
                value={tempFormula} 
                onChangeText={setTempFormula} 
                multiline 
                maxLength={255}
            />
            <Text style={[styles.charCounter, tempFormula.length >= 250 && styles.charCounterWarning]}>
                {tempFormula.length}/255
            </Text>
            
            <Text style={styles.inputLabel}>Notas:</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Opcional..."
                value={tempNotes} 
                onChangeText={setTempNotes} 
                multiline 
                maxLength={500}
            />
            <Text style={[styles.charCounter, tempNotes.length >= 490 && styles.charCounterWarning]}>
                {tempNotes.length}/500
            </Text>

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
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelCreate}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton, isSubmitting && {opacity: 0.5, backgroundColor: '#999'  }]} onPress={handleCreateSheet} disabled={isSubmitting}>
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

