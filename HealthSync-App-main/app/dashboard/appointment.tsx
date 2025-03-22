import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DOCTORS } from '../constants/doctors';

interface AppointmentForm {
  name: string;
  phone: string;
  email: string;
  doctor: string;
  date: string;
  time: string;
  reason: string;
}

export default function AppointmentScreen() {
  const router = useRouter();
  const [form, setForm] = useState<AppointmentForm>({
    name: '',
    phone: '',
    email: '',
    doctor: '',
    date: '',
    time: '',
    reason: '',
  });

  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [errors, setErrors] = useState<Partial<AppointmentForm>>({});

  const validateForm = () => {
    const newErrors: Partial<AppointmentForm> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
    }

    if (!selectedDoctor) {
      newErrors.doctor = 'Please select a doctor';
    }

    if (!form.date) {
      newErrors.date = 'Please select a date';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      newErrors.date = 'Please enter date in YYYY-MM-DD format';
    }

    if (!form.time) {
      newErrors.time = 'Please select a time';
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(form.time)) {
      newErrors.time = 'Please enter time in HH:MM format';
    }

    if (!form.reason.trim()) {
      newErrors.reason = 'Reason for visit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        // Create appointment object
        const appointment = {
          ...form,
          doctor: selectedDoctor,
          id: Date.now().toString(),
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        };

        // Get existing appointments
        const existingAppointments = await AsyncStorage.getItem('appointments');
        const appointments = existingAppointments ? JSON.parse(existingAppointments) : [];

        // Add new appointment
        appointments.push(appointment);
        await AsyncStorage.setItem('appointments', JSON.stringify(appointments));

        // Show success message
        Alert.alert(
          'Appointment Confirmed',
          'Your appointment has been successfully booked. We will send you a reminder before the appointment.',
          [
            {
              text: 'View Appointments',
              onPress: () => {
                router.push('/dashboard');
              },
            },
            {
              text: 'Book Another',
              onPress: () => {
                // Reset form
                setForm({
                  name: '',
                  phone: '',
                  email: '',
                  doctor: '',
                  date: '',
                  time: '',
                  reason: '',
                });
                setSelectedDoctor('');
              },
            },
          ]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to book appointment. Please try again.');
      }
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Book Appointment',
          headerShown: true,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Book an Appointment</Text>
          <Text style={styles.subtitle}>Fill in your details below</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your full name"
              value={form.name}
              onChangeText={(text) => setForm(prev => ({ ...prev, name: text }))}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm(prev => ({ ...prev, phone: text }))}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => setForm(prev => ({ ...prev, email: text }))}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Doctor</Text>
            <View style={styles.doctorsList}>
              {DOCTORS.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={[
                    styles.doctorCard,
                    selectedDoctor === doctor.id && styles.selectedDoctorCard,
                  ]}
                  onPress={() => setSelectedDoctor(doctor.id)}
                >
                  <Ionicons
                    name="person"
                    size={24}
                    color={selectedDoctor === doctor.id ? '#fff' : '#1a237e'}
                  />
                  <View style={styles.doctorInfo}>
                    <Text
                      style={[
                        styles.doctorName,
                        selectedDoctor === doctor.id && styles.selectedDoctorText,
                      ]}
                    >
                      {doctor.name}
                    </Text>
                    <Text
                      style={[
                        styles.doctorSpecialization,
                        selectedDoctor === doctor.id && styles.selectedDoctorText,
                      ]}
                    >
                      {doctor.specialization}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {errors.doctor && <Text style={styles.errorText}>{errors.doctor}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Date</Text>
            <TextInput
              style={[styles.input, errors.date && styles.inputError]}
              placeholder="YYYY-MM-DD"
              value={form.date}
              onChangeText={(text) => setForm(prev => ({ ...prev, date: text }))}
            />
            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Time</Text>
            <TextInput
              style={[styles.input, errors.time && styles.inputError]}
              placeholder="HH:MM"
              value={form.time}
              onChangeText={(text) => setForm(prev => ({ ...prev, time: text }))}
            />
            {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reason for Visit</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.reason && styles.inputError]}
              placeholder="Describe your symptoms or reason for visit"
              multiline
              numberOfLines={4}
              value={form.reason}
              onChangeText={(text) => setForm(prev => ({ ...prev, reason: text }))}
            />
            {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  doctorsList: {
    gap: 12,
  },
  doctorCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedDoctorCard: {
    backgroundColor: '#1a237e',
    borderColor: '#1a237e',
  },
  doctorInfo: {
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  doctorSpecialization: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  selectedDoctorText: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#1a237e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 