export interface Medicine {
  medImage?:string;
  medName: string;
  medUnit: string;
  medInventory?: number;
  medDoctor?: string;
  medIntakeTime: string;
  medIntakePerDose: number;
  medIntakeFrequency: string;
  medReminderFrequency?: string;
  medDosage: number;
  MedDosageSchedule?: string[];
  startAt?: string;
  isRefill: boolean;
}

export interface MedicineInput {
  medId: string;
  userId: string;
}

export interface UpdateMedicine {
  medName?: string;
  medUnit?: string;
  medInventory?: number;
  medDoctor?: string;
  medIntakeTime?: string;
  medIntakePerDose?: number;
  medIntakeFrequency?: string;
  medReminderFrequency?: string;
  medDosage?: number;
  MedDosageSchedule?: string[];
  startAt?: string;
  isRefill?: boolean;
  isActive?: boolean;
  medImage?:string;
}

export interface UpdateMedicineInput extends MedicineInput {
  data: UpdateMedicine;
}
