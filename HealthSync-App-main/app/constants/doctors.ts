export interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

export const DOCTORS: Doctor[] = [
  { id: '1', name: 'Dr. Sarah Johnson', specialization: 'Cardiologist' },
  { id: '2', name: 'Dr. Michael Chen', specialization: 'General Physician' },
  { id: '3', name: 'Dr. Emily Williams', specialization: 'Neurologist' },
]; 