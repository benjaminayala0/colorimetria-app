import { styles } from '../../src/styles/calendar-styles';
import { useState, useEffect, useCallback } from 'react';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Text, View, SafeAreaView, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Linking, LogBox } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import * as Notifications from 'expo-notifications';
import api from '@/services/api';
import { formatPrice } from '../../src/utils/formatPrice';


LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
]);

// Configuration for Spanish
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

// Define the type of data for a Service
interface Service {
  id: number;
  name: string;
  price: number;
}

// Define the type of data for a Client
interface Client {
  id: number;
  fullname: string;
  phone: string;
}

// Define the type of data for an Appointment
interface Appointment {
  id: number;
  dateString: string;
  time: string;
  clientName: string;
  service: string;
  price: number;
  clientId: number | null;
  serviceId: number | null;
  status?: string;
}


Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});


export default function AgendaScreen() {

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedServicePrice, setSelectedServicePrice] = useState<number>(0);

  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  // Load services and clients when screen is focused
  useFocusEffect(
    useCallback(() => {
      api.get('/api/services').then(res => {
        setServices(res.data);
      });
      api.get('/api/clients').then(res => {
        setClients(res.data);
      });
    }, [])
  );

  // Initialize notifications
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'No se pudieron obtener los permisos para notificaciones.');
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }

      } catch (error) {
        console.log("Error inicializando notificaciones:", error);
      }
    })();
  }, []);


  // States for the create/edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Form states
  const [formClientName, setFormClientName] = useState('');
  const [formService, setFormService] = useState('');
  const [editSelectedServiceId, setEditSelectedServiceId] = useState<number | null>(null);
  const [editSelectedServicePrice, setEditSelectedServicePrice] = useState<number>(0);
  const [formTime, setFormTime] = useState('');
  const [formDate, setFormDate] = useState('');

  // Time picker states
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

  // Appointment status logic
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
    setSelectedClientId(null);
    setFormService('');
    setSelectedServiceId(null);
    setSelectedServicePrice(0);
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

  const handleDateChange = (event: any, selectedDate?: Date) => {

    if (Platform.OS === 'android') setShowDatePicker(false);

    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormDate(dateString);
    }
  };

  const handleEditDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowEditDatePicker(false);

    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormDate(dateString);
    }
  };

  // Function for formatting dates
  const formatDateToText = (dateString: string) => {
    if (!dateString) return '';

    const [year, month, day] = dateString.split('-').map(Number);

    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).replace(/^\w/, c => c.toUpperCase());
  };

  // Function to create an appointment
  const handleCreateAppointment = async () => {
    if (!selectedClientId || !selectedServiceId || !formTime.trim() || !formDate.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const selectedClient = clients.find(c => c.id === selectedClientId);
    const selectedService = services.find(s => s.id === selectedServiceId);
    try {
      await api.post('/api/appointments', {
        dateString: formDate,
        time: formTime,
        clientName: selectedClient?.fullname || '',
        clientId: selectedClientId,
        serviceId: selectedServiceId
      });

      try {
        const [year, month, day] = formDate.split('-').map(Number);
        const [hours, minutes] = formTime.split(':').map(Number);

        // Calculate the trigger time for the notification (15 minutes before the appointment)
        const appointmentTime = new Date(year, month - 1, day, hours, minutes);
        const triggerTime = new Date(appointmentTime.getTime() - 15 * 60 * 1000);

        // Diagnostic logs for notification scheduling
        const now = Date.now();
        const secondsUntilTrigger = Math.ceil((triggerTime.getTime() - now) / 1000);

        if (secondsUntilTrigger > 0) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "⏰ Próximo Turno",
              body: `Tenés a ${selectedClient?.fullname || 'Cliente'} en 15 min (${selectedService?.name || formService})`,
              sound: true,

              ...(Platform.OS === 'android' && {
                channelId: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                vibrate: [0, 250, 250, 250],
              }),
            },
            trigger: {
              type: 'timeInterval',
              seconds: secondsUntilTrigger,
              repeats: false,
            } as any,
          });
        }
      } catch (notifError) {
        console.log("Error al programar notificación (no crítico):", notifError);
      }

      setModalVisible(false);
      // Enhanced alert with appointment details
      Alert.alert(
        '✅ Turno Creado',
        `Turno agendado para:\n\n👤 ${selectedClient?.fullname || 'Cliente'}\n📅 ${formDate}\n⏰ ${formTime}\n💇 ${selectedService ? selectedService.name : ''}\n💲 $${selectedService ? formatPrice(selectedService.price) : ''}`,
        [{ text: 'OK' }]
      );
      fetchAppointments();
    } catch (error) {
      console.error('Error creando turno:', error);
      Alert.alert('Error', 'No se pudo crear el turno');
    }
  };

  // Function to open the edit modal
  const handleOpenEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormDate(appointment.dateString);
    setFormTime(appointment.time);
    setSelectedTime(parseTimeStringToDate(appointment.time));
    setFormClientName(appointment.clientName);
    setSelectedClientId(appointment.clientId || null);

    // Search service by name (legacy) or by id if available
    const svc = services.find(s => s.name === appointment.service || s.id === appointment.serviceId);
    setEditSelectedServiceId(svc ? svc.id : null);
    setEditSelectedServicePrice(svc ? svc.price : 0);
    setFormService(appointment.service);
    setEditModalVisible(true);
  };

  // Function to update an appointment
  const handleUpdateAppointment = async () => {
    if (!editingAppointment) return;

    if (!selectedClientId || !editSelectedServiceId || !formTime.trim() || !formDate.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    const selectedClient = clients.find(c => c.id === selectedClientId);
    try {
      await api.put(`/api/appointments/${editingAppointment.id}`, {
        dateString: formDate,
        time: formTime,
        clientName: selectedClient?.fullname || '',
        clientId: selectedClientId,
        serviceId: editSelectedServiceId
      });

      setEditModalVisible(false);
      // Enhanced alert with updated appointment details
      Alert.alert(
        '✅ Turno Actualizado',
        `Turno actualizado para:\n\n👤 ${selectedClient?.fullname || 'Cliente'}\n📅 ${formDate}\n⏰ ${formTime}\n💇 ${services.find(s => s.id === editSelectedServiceId)?.name || ''}\n💲 $${formatPrice(services.find(s => s.id === editSelectedServiceId)?.price)}`,
        [{ text: 'OK' }]
      );
      fetchAppointments();
    } catch (error) {
      console.error('Error actualizando turno:', error);
      Alert.alert('Error', 'No se pudo actualizar el turno');
    }
  };

  // Function to delete an appointment
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

  const handleWhatsApp = (item: Appointment) => {
    const fechaTexto = formatDateToText(item.dateString);
    const mensaje = `Hola ${item.clientName}! 👋 Te escribo para recordarte tu turno del *${fechaTexto}* a las *${item.time} hs* para *${item.service}*. \n\nPor favor confirmame si podés venir. Gracias! ✨`;


    const url = `whatsapp://send?text=${encodeURIComponent(mensaje)}`;


    Linking.openURL(url).catch((err) => {
      console.error('Error al abrir WhatsApp:', err);
      Alert.alert(
        'Error',
        'No se pudo abrir WhatsApp. Asegurate de tenerlo instalado.'
      );
    });
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
          {formatDateToText(selectedDate)}
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

            // Determine card colors based on appointment status
            let cardStyle = styles.card;
            let timeContainerStyle = styles.timeContainer;
            let showUrgentIcon = false;
            let statusBadge = null;

            // Status-based styling
            if (item.status === 'completed') {
              cardStyle = { ...styles.card, backgroundColor: '#e8f5e9', borderLeftWidth: 3, borderLeftColor: '#4caf50' } as any;
              timeContainerStyle = { ...styles.timeContainer, backgroundColor: '#e8f5e9' };
              statusBadge = <Text style={{ fontSize: 11, color: '#4caf50', marginLeft: 5 }}>✅</Text>;
            } else if (item.status === 'absent') {
              cardStyle = { ...styles.card, backgroundColor: '#ffebee', borderLeftWidth: 3, borderLeftColor: '#f44336' } as any;
              timeContainerStyle = { ...styles.timeContainer, backgroundColor: '#ffebee' };
              statusBadge = <Text style={{ fontSize: 11, color: '#f44336', marginLeft: 5 }}>❌ Ausente</Text>;
            } else if (item.status === 'cancelled') {
              cardStyle = { ...styles.card, backgroundColor: '#f5f5f5', borderLeftWidth: 3, borderLeftColor: '#9e9e9e' } as any;
              timeContainerStyle = { ...styles.timeContainer, backgroundColor: '#f5f5f5' };
              statusBadge = <Text style={{ fontSize: 11, color: '#9e9e9e', marginLeft: 5 }}>🚫 Cancelado</Text>;
            } else if (status === 'past') {
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
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.clientName}>
                      {item.clientName} {status === 'past' && !item.status ? '(Finalizado)' : ''}
                    </Text>
                    {statusBadge}
                  </View>
                  <Text style={styles.serviceText}>{item.service}</Text>
                </View>
                <View style={styles.actionsContainer}>

                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => { handleWhatsApp(item) }}
                  >
                    <FontAwesome5 name="whatsapp" size={18} color={status === 'past' ? "#ccc" : "#25D366"} />
                  </TouchableOpacity>

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

              <Text style={{ textAlign: 'center', fontSize: 16, color: '#6200ee', marginBottom: 15, fontWeight: 'bold' }}>
                📅 {formatDateToText(formDate)}
              </Text>

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

              <Text style={styles.inputLabel}>Cliente:</Text>
              <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10 }}>
                <Picker
                  selectedValue={selectedClientId}
                  onValueChange={(itemValue) => {
                    setSelectedClientId(itemValue);
                  }}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Seleccionar cliente..." value={null} />
                  {clients.map(c => (
                    <Picker.Item key={c.id} label={c.fullname} value={c.id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Servicio:</Text>
              <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10 }}>
                <Picker
                  selectedValue={selectedServiceId}
                  onValueChange={(itemValue, itemIndex) => {
                    setSelectedServiceId(itemValue);
                    const svc = services.find(s => s.id === itemValue);
                    setSelectedServicePrice(svc ? svc.price : 0);
                  }}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Seleccionar servicio..." value={null} />
                  {services.map(s => (
                    <Picker.Item key={s.id} label={`${s.name} ($${formatPrice(s.price)})`} value={s.id} />
                  ))}
                </Picker>
              </View>
              {selectedServiceId && (
                <Text style={{ color: '#43a047', fontWeight: 'bold', marginBottom: 10 }}>
                  Precio: ${formatPrice(selectedServicePrice)}
                </Text>
              )}

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

              <Text style={styles.inputLabel}>Fecha:</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEditDatePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  📅 {formDate ? formatDateToText(formDate) : 'Seleccionar fecha'}
                </Text>
              </TouchableOpacity>

              {showEditDatePicker && (
                <DateTimePicker
                  value={new Date(formDate ? formDate + 'T12:00:00' : Date.now())}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleEditDateChange}
                  locale="es-ES"
                />
              )}

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

              <Text style={styles.inputLabel}>Cliente:</Text>
              <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10 }}>
                <Picker
                  selectedValue={selectedClientId}
                  onValueChange={(itemValue) => {
                    setSelectedClientId(itemValue);
                  }}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Seleccionar cliente..." value={null} />
                  {clients.map(c => (
                    <Picker.Item key={c.id} label={c.fullname} value={c.id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.inputLabel}>Servicio:</Text>
              <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10 }}>
                <Picker
                  selectedValue={editSelectedServiceId}
                  onValueChange={(itemValue, itemIndex) => {
                    setEditSelectedServiceId(itemValue);
                    const svc = services.find(s => s.id === itemValue);
                    setEditSelectedServicePrice(svc ? svc.price : 0);
                  }}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Seleccionar servicio..." value={null} />
                  {services.map(s => (
                    <Picker.Item key={s.id} label={`${s.name} ($${formatPrice(s.price)})`} value={s.id} />
                  ))}
                </Picker>
              </View>
              {editSelectedServiceId && (
                <Text style={{ color: '#43a047', fontWeight: 'bold', marginBottom: 10 }}>
                  Precio: ${formatPrice(editSelectedServicePrice)}
                </Text>
              )}

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
