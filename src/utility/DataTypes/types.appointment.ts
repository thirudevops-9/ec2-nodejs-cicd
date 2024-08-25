export interface Appointment {
  doctorName: string;
  description: string;
  apptDate: Date;
  apptTime: Date;
}

export interface UpdateAppointment {
  doctorName?: string;
  description?: string;
  apptDate?: Date;
  apptTime?: Date;
}

export interface AppointmentInput {
  apptId: string;
  userId: string;
}

export interface UpdateAppointmentInput extends AppointmentInput {
  data: UpdateAppointment;
}

export interface CreatedAppointment {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  doctorName: string;
  description: string;
  forUserId: string | null;
  apptDate: Date;
  apptTime: Date;
  forDependantId: string | null;
}
