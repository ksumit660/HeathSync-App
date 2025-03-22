import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { DOCTORS, Doctor } from '../constants/doctors';

const RECENT_REPORTS_KEY = '@healthsync_recent_reports';

interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string;
  doctor: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const username = "Ishant kumar";
  // Patient ID in the new format
  const uniqueId = "ISH-20051225-003";
  const pathname = usePathname();
  
  const [recentReports, setRecentReports] = useState([
    {
      name: "Blood Test Report",
      date: "19 Jan 2025",
      status: "Normal"
    },
    {
      name: "ECG Report",
      date: "17 Jan 2025",
      status: "Review Required"
    },
    {
      name: "Chest X-Ray",
      date: "17 Jan 2025",
      status: "Normal"
    }
  ]);

  const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);

  const upcomingAppointments = [
    {
      doctor: "Dr. Dinesh chilke",
      specialty: "Cardiologist",
      date: "Tomorrow, 10:00 AM"
    },
    {
      doctor: "Dr. Manju sanghi",
      specialty: "General Physician",
      date: "Next Week, Tuesday"
    }
  ];

  useEffect(() => {
    if (pathname === '/dashboard') {
      loadRecentReports();
      loadBookedAppointments();
    }
  }, [pathname]);

  const loadRecentReports = async () => {
    try {
      const savedReports = await AsyncStorage.getItem(RECENT_REPORTS_KEY);
      if (savedReports) {
        setRecentReports(JSON.parse(savedReports));
      }
    } catch (error) {
      console.error('Error loading recent reports:', error);
    }
  };

  const loadBookedAppointments = async () => {
    try {
      const appointments = await AsyncStorage.getItem('appointments');
      if (appointments) {
        const parsedAppointments: Appointment[] = JSON.parse(appointments);
        // Sort appointments by date
        const sortedAppointments = parsedAppointments.sort((a: Appointment, b: Appointment) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
          return dateA.getTime() - dateB.getTime();
        });
        setBookedAppointments(sortedAppointments);
      }
    } catch (error) {
      console.error('Error loading booked appointments:', error);
    }
  };

  const formatAppointmentDateTime = (date: string, time: string) => {
    const appointmentDate = new Date(date + ' ' + time);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (appointmentDate.toDateString() === today.toDateString()) {
      return `Today, ${time}`;
    } else if (appointmentDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${time}`;
    } else {
      return `${date}, ${time}`;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.username}>{username}!</Text>
        <View style={styles.idContainer}>
          <Text style={styles.idLabel}>Patient ID:</Text>
          <Text style={styles.idValue}>{uniqueId}</Text>
        </View>
        <Text style={styles.subtitle}>Here's your health summary</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
        {upcomingAppointments.map((appointment, index) => (
          <View key={index} style={styles.appointmentCard}>
            <View style={styles.appointmentInfo}>
              <Text style={styles.doctorName}>{appointment.doctor}</Text>
              <Text style={styles.specialty}>{appointment.specialty}</Text>
            </View>
            <View style={styles.appointmentTimeContainer}>
              <Clock size={16} color="#64748b" />
              <Text style={styles.appointmentTime}>{appointment.date}</Text>
            </View>
          </View>
        ))}
      </View>

      {bookedAppointments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Booked Appointments</Text>
          {bookedAppointments.map((appointment, index) => {
            const doctor = DOCTORS.find(d => d.id === appointment.doctor);
            return (
              <View key={index} style={styles.appointmentCard}>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.doctorName}>{doctor ? doctor.name : 'Doctor'}</Text>
                  <Text style={styles.specialty}>{doctor ? doctor.specialization : 'Specialist'}</Text>
                  <Text style={styles.appointmentReason}>{appointment.reason}</Text>
                </View>
                <View style={styles.appointmentTimeContainer}>
                  <Calendar size={16} color="#64748b" />
                  <Text style={styles.appointmentTime}>
                    {formatAppointmentDateTime(appointment.date, appointment.time)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {recentReports.map((report, index) => (
          <View key={index} style={styles.reportCard}>
            <View>
              <Text style={styles.reportName}>{report.name}</Text>
              <Text style={styles.reportDate}>{report.date}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              report.status === 'Normal' ? styles.normalStatus : styles.reviewStatus
            ]}>
              <Text style={[
                styles.statusText,
                report.status === 'Normal' ? styles.normalStatusText : styles.reviewStatusText
              ]}>
                {report.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  idLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 6,
  },
  idValue: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  appointmentInfo: {
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: '#64748b',
  },
  appointmentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#64748b',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  reportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: 14,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  normalStatus: {
    backgroundColor: '#dcfce7',
  },
  reviewStatus: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  normalStatusText: {
    color: '#059669',
  },
  reviewStatusText: {
    color: '#d97706',
  },
  decreaseText: {
    color: '#059669',
  },
  increaseText: {
    color: '#dc2626',
  },
  appointmentReason: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },
}); 