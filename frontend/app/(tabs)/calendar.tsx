import { useState, useEffect, useCallback } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import api from '../../src/services/api';

// Configuration for Spanish
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

// Define the type of data for an Appointment
interface Appointment {
  id: number;
  dateString: string; 
  time: string;      
  clientName: string;
  service: string;
  clientId?: number;
}

export default function AgendaScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // States for the create/edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  // States for the form
  const [formClientName, setFormClientName] = useState('');
  const [formService, setFormService] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDate, setFormDate] = useState('');
  
  // States for time picker
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  // Function to fetch appointments from the backend
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error cargando turnos:', error);
      Alert.alert('Error', 'No se pudieron cargar los turnos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch appointments when the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );
  
  // Filter appointments for the selected date
  const appointmentsForDay = appointments.filter(app => app.dateString === selectedDate);

  // Helper function to format time from Date to HH:MM string
  const formatTimeToString = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Helper function to parse time string to Date
  const parseTimeStringToDate = (timeString: string): Date => {
    if (!timeString) {
      return new Date();
    }
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  //  STATUS LOGIC 
  const getAppointmentStatus = (dateStr: string, timeStr: string) => {
    const now = new Date();
    
    // Create the appointment date by combining day and time
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const apptDate = new Date(year, month - 1, day, hours, minutes);


    if (apptDate < now) {
        return 'past';
    }

   
    const diffInMilliseconds = apptDate.getTime() - now.getTime();
    const diffInMinutes = diffInMilliseconds / (1000 * 60);

    if (diffInMinutes > 0 && diffInMinutes <= 120) {
        return 'urgent';
    }

    return 'normal';
  };

  // Function to open the create modal
  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormDate(selectedDate || today);
    setFormTime('');
    setSelectedTime(new Date());
    setFormClientName('');
    setFormService('');
    setModalVisible(true);
  };

  // Handler for time picker in create modal
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setSelectedTime(selectedDate);
      setFormTime(formatTimeToString(selectedDate));
    }
  };

  // Handler for time picker in edit modal
  const handleEditTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEditTimePicker(false);
    }
    if (selectedDate) {
      setSelectedTime(selectedDate);
      setFormTime(formatTimeToString(selectedDate));
    }
  };

  // function to create an appointment
  const handleCreateAppointment = async () => {
    if (!formClientName.trim() || !formService.trim() || !formTime.trim() || !formDate.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      await api.post('/api/appointments', {
        dateString: formDate,
        time: formTime,
        clientName: formClientName,
        service: formService
      });

      setModalVisible(false);
      // Enhanced alert with appointment details
      Alert.alert(
        '✅ Turno Creado',
        `Turno agendado para:\n\n👤 ${formClientName}\n📅 ${formDate}\n⏰ ${formTime}\n💇 ${formService}`,
        [{ text: 'OK' }]
      );
      fetchAppointments();
    } catch (error) {
      console.error('Error creando turno:', error);
      Alert.alert('Error', 'No se pudo crear el turno');
    }
  };

  // function to open the edit modal
  const handleOpenEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormDate(appointment.dateString);
    setFormTime(appointment.time);
    setSelectedTime(parseTimeStringToDate(appointment.time));
    setFormClientName(appointment.clientName);
    setFormService(appointment.service);
    setEditModalVisible(true);
  };

  // function to update an appointment
  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    if (!formClientName.trim() || !formService.trim() || !formTime.trim() || !formDate.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    try {
      await api.put(`/api/appointments/${editingAppointment.id}`, {
        dateString: formDate,
        time: formTime,
        clientName: formClientName,
        service: formService
      });

      setEditModalVisible(false);
      // Enhanced alert with updated appointment details
      Alert.alert(
        '✅ Turno Actualizado',
        `Turno actualizado para:\n\n👤 ${formClientName}\n📅 ${formDate}\n⏰ ${formTime}\n💇 ${formService}`,
        [{ text: 'OK' }]
      );
      fetchAppointments();
    } catch (error) {
      console.error('Error actualizando turno:', error);
      Alert.alert('Error', 'No se pudo actualizar el turno');
    }
  };

  // function to delete an appointment
  const handleDeleteAppointment = (appointmentId: number, clientName: string) => {
    Alert.alert(
      'Eliminar Turno',
      `¿Estás seguro de eliminar el turno de ${clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/appointments/${appointmentId}`);
              Alert.alert('Eliminado', 'Turno eliminado correctamente');
              fetchAppointments();
            } catch (error) {
              console.error('Error eliminando turno:', error);
              Alert.alert('Error', 'No se pudo eliminar el turno');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Agenda 📅</Text>
      </View>

      {/* 1. THE CALENDAR */}
      <Calendar
        onDayPress={day => {
          setSelectedDate(day.dateString);
        }}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#6200ee' }
        }}
        theme={{
          selectedDayBackgroundColor: '#6200ee',
          todayTextColor: '#6200ee',
          arrowColor: '#6200ee',
        }}
      />

      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>
            Turnos del: {selectedDate}
        </Text>
      </View>

      {/* 2. LIST OF APPOINTMENTS */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Cargando turnos...</Text>
        </View>
      ) : (
        <FlatList
          data={appointmentsForDay}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: 15 }}
          ListEmptyComponent={
              <Text style={styles.emptyText}>No hay turnos para este día. 💤</Text>
          }
          renderItem={({ item }) => {
            const status = getAppointmentStatus(item.dateString, item.time);
            
            let cardStyle = styles.card;
            let timeContainerStyle = styles.timeContainer;
            let showUrgentIcon = false;

            if (status === 'past') {
                cardStyle = { ...styles.card, backgroundColor: '#e0e0e0' };
                timeContainerStyle = { ...styles.timeContainer, backgroundColor: '#e0e0e0' };
            } else if (status === 'urgent') {
                cardStyle = { ...styles.card, backgroundColor: '#ffeeba' };
                timeContainerStyle = { ...styles.timeContainer, backgroundColor: '#ffeeba' };
                showUrgentIcon = true;
            }

            return (
                <View style={cardStyle}>
                  <View style={timeContainerStyle}>
                      <Text style={styles.timeText}>{item.time}</Text>
                      
                      {showUrgentIcon && <Text style={{ fontSize: 12, marginTop: 2 }}>🔔</Text>}
                  </View>
                  <View style={styles.infoContainer}>
                      <Text style={styles.clientName}>
                        {item.clientName} {status === 'past' ? '(Finalizado)' : ''}
                      </Text>
                      <Text style={styles.serviceText}>{item.service}</Text>
                  </View>
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => handleOpenEditModal(item)}
                    >
                      <FontAwesome5 name="edit" size={18} color="#6200ee" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.iconButton}
                      onPress={() => handleDeleteAppointment(item.id, item.clientName)}
                    >
                      <FontAwesome5 name="trash-alt" size={18} color="#ee2626" />
                    </TouchableOpacity>
                  </View>
                </View>
            );
          }}
        />
      )}

      {/* 3. (+) BUTTON */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleOpenCreateModal}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* CREATE APPOINTMENT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Nuevo Turno</Text>
              
              <Text style={styles.inputLabel}>Fecha (YYYY-MM-DD):</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ej: 2024-05-20"
                value={formDate}
                onChangeText={setFormDate}
              />

              <Text style={styles.inputLabel}>Hora:</Text>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formTime || 'Seleccionar hora ⏰'}
                </Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                  locale="es-ES"
                />
              )}
              {Platform.OS === 'ios' && showTimePicker && (
                <TouchableOpacity 
                  style={styles.timePickerCloseButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.timePickerCloseText}>Listo</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.inputLabel}>Nombre del Cliente:</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ej: Marta Gomez"
                value={formClientName}
                onChangeText={setFormClientName}
              />

              <Text style={styles.inputLabel}>Servicio:</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ej: Corte, Color, Nutrición"
                value={formService}
                onChangeText={setFormService}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]} 
                  onPress={handleCreateAppointment}
                >
                  <Text style={styles.buttonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* EDIT APPOINTMENT MODAL */}
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
              <Text style={styles.modalTitle}>Editar Turno</Text>
              
              <Text style={styles.inputLabel}>Fecha (YYYY-MM-DD):</Text>
              <TextInput 
                style={styles.input}
                value={formDate}
                onChangeText={setFormDate}
              />

              <Text style={styles.inputLabel}>Hora:</Text>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => setShowEditTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formTime || 'Seleccionar hora ⏰'}
                </Text>
              </TouchableOpacity>
              
              {showEditTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEditTimeChange}
                  locale="es-ES"
                />
              )}
              {Platform.OS === 'ios' && showEditTimePicker && (
                <TouchableOpacity 
                  style={styles.timePickerCloseButton}
                  onPress={() => setShowEditTimePicker(false)}
                >
                  <Text style={styles.timePickerCloseText}>Listo</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.inputLabel}>Nombre del Cliente:</Text>
              <TextInput 
                style={styles.input}
                value={formClientName}
                onChangeText={setFormClientName}
              />

              <Text style={styles.inputLabel}>Servicio:</Text>
              <TextInput 
                style={styles.input}
                value={formService}
                onChangeText={setFormService}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]} 
                  onPress={handleUpdateAppointment}
                >
                  <Text style={styles.buttonText}>Guardar Cambios</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  dayHeader: {
    padding: 15,
    backgroundColor: '#eaddff', 
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontSize: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    alignItems: 'center'
  },
  timeContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginRight: 15,
  },
  timeText: {
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceText: {
    color: '#666',
  },
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
  },
  fabText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: -2, 
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 10,
    marginLeft: 5,
  },
  // Styles for the modal
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
    padding: 12,
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
  // Time picker button styles
  timeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fafafa',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  timePickerCloseButton: {
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  timePickerCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});