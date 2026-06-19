export interface UserData {
  uid: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email: string;
  mobile: string;
  category: 'Senior' | 'PWD' | 'Solo Parent' | 'Others' | string;
  address?: string;
  civilStatus?: string;
  createdAt?: any;
  sex?: string;
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
}

export interface AppointmentData {
  id: string;
  benefitTitle: string;
  appliedCategory?: string;
  category?: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  verificationCode?: string;
}

export interface AdminData {
  uid: string;
  email: string;
}

export interface DswdContactData {
  id: string;
  name: string;
  contactPerson: string;
  position: string;
  email: string;
  phone: string;
  address: string;
  updatedAt?: string | any;
}

