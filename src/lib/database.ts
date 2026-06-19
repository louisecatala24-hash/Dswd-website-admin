import { UserData, AppointmentData, DswdContactData } from '../types';

export interface BenefitData {
  id: string;
  category: string;
  titleEn: string;
  titleFil: string;
  descEn: string;
  descFil: string;
  amount: string;
  icon: string;
  color: string;
}

export interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  requirements?: string | null;
  time?: string | null;
  date: string;
  day?: string;
  updatedAt: string;
  author: string;
}

export const SAMPLE_USERS: UserData[] = [
  { 
    uid: 'user_1', 
    firstName: 'Juan', 
    lastName: 'Dela Cruz', 
    fullName: 'Juan Dela Cruz',
    email: 'juan.delacruz@example.gov.ph', 
    mobile: '09171234567', 
    category: 'Senior', 
    address: '12-A Batasan Road, Brgy. Batasan Hills, Quezon City', 
    civilStatus: 'Married', 
    sex: 'Male',
    birthYear: '1945',
    birthMonth: 'August',
    birthDay: '15',
    createdAt: new Date('2026-01-10').toISOString()
  },
  { 
    uid: 'user_2', 
    firstName: 'Maria Elena', 
    lastName: 'Santos', 
    fullName: 'Maria Elena Santos',
    email: 'maria.santos@gmail.com', 
    mobile: '09187654321', 
    category: 'Solo Parent', 
    address: 'Block 4, Sampaloc, Manila', 
    civilStatus: 'Single', 
    sex: 'Female',
    birthYear: '1988',
    birthMonth: 'May',
    birthDay: '20',
    createdAt: new Date('2026-02-12').toISOString()
  },
  { 
    uid: 'user_3', 
    firstName: 'Pedro', 
    lastName: 'Penduko', 
    fullName: 'Pedro Penduko',
    email: 'pedro.penduko@yahoo.com', 
    mobile: '09221112223', 
    category: 'PWD', 
    address: '77 Durian St., Brgy. Buhangin, Davao City', 
    civilStatus: 'Single', 
    sex: 'Male',
    birthYear: '1995',
    birthMonth: 'December',
    birthDay: '05',
    createdAt: new Date('2026-02-18').toISOString()
  },
  { 
    uid: 'user_4', 
    firstName: 'Elena', 
    lastName: 'Ramos', 
    fullName: 'Elena Ramos',
    email: 'elena.ramos@outlook.com', 
    mobile: '09459998888', 
    category: 'Senior', 
    address: '15 Mango Avenue, Cebu City, Cebu', 
    civilStatus: 'Widowed', 
    sex: 'Female',
    birthYear: '1949',
    birthMonth: 'January',
    birthDay: '22',
    createdAt: new Date('2026-03-01').toISOString()
  },
  { 
    uid: 'user_5', 
    firstName: 'Ramon', 
    lastName: 'Magsaysay', 
    fullName: 'Ramon Magsaysay',
    email: 'ramon.magsaysay@zambales.ph', 
    mobile: '09292223333', 
    category: 'PWD', 
    address: 'Poblacion, Castillejos, Zambales', 
    civilStatus: 'Married', 
    sex: 'Male',
    birthYear: '1982',
    birthMonth: 'September',
    birthDay: '30',
    createdAt: new Date('2026-03-15').toISOString()
  }
];

export const SAMPLE_BENEFITS: BenefitData[] = [
  { 
    id: 'ben_1', 
    category: 'senior', 
    titleEn: 'Social Pension', 
    titleFil: 'Sosyal na Pensyon', 
    descEn: 'Monthly stipend of ₱1,000 for indigent senior citizens to support daily food and medical needs.', 
    descFil: 'Buwanang allowance na nagkakahalagang ₱1,000 para sa mga kapos-palad na senior citizens panustos sa pagkain at gamut.', 
    amount: '₱1,000/month', 
    icon: 'Heart', 
    color: 'rose'
  },
  { 
    id: 'ben_2', 
    category: 'solo-parent', 
    titleEn: 'Solo Parent Grant', 
    titleFil: 'Tulong sa Solo Parent', 
    descEn: 'Comprehensive financial, livelihood, and tuition fee support for lone parents raising dependent children.', 
    descFil: 'Tulong pangkabuhayan, pinansyal, at suporta sa matrikula para sa mga mag-isang magulang na nagtataguyod ng pamilya.', 
    amount: '₱2,000/month', 
    icon: 'User', 
    color: 'blue'
  },
  { 
    id: 'ben_3', 
    category: 'pwd', 
    titleEn: 'PWD Cash Gift', 
    titleFil: 'Regalo sa may Kapansanan', 
    descEn: 'Quarterly supplemental income and assistive care benefits for severely disabled individuals registered with PDAO.', 
    descFil: 'Karagdagang allowance kada quarter at kagamitang pang-ayuda para sa mga may kapansanan na rehistrado sa PDAO.', 
    amount: '₱3,000/quarter', 
    icon: 'Gift', 
    color: 'emerald'
  }
];

export const SAMPLE_NEWS: AnnouncementData[] = [
  { 
    id: 'news_1',
    title: 'Senior Citizen Social Pension Distribution Schedule', 
    content: 'The DSWD Social Pension distribution for the first quarter of 2026 will start this week at the Municipal Sports Complex. Beneficiaries must present their valid OSCA senior ID and two photocopies for identity verification. Support desks will assist seniors with special mobility requirements.',
    date: new Date().toISOString().split('T')[0],
    day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    time: '8:00 AM - 4:00 PM',
    requirements: 'Original Senior OSCA ID, 2 Photocopies of ID',
    author: 'Municipal Welfare & Dev Office',
    updatedAt: new Date().toISOString()
  },
  { 
    id: 'news_2',
    title: 'New Solo Parent Discount Implementation Act', 
    content: 'Pursuant to R.A. 11861, starting this month registered solo parents are entitled to an additional 10% discount on generic baby commodities, vitamins, and medical supplies at participating local drugstores. Ensure your Solo Parent ID is updated at the MSWD dashboard.',
    date: new Date().toISOString().split('T')[0],
    day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    time: 'Office Hours (8 AM - 5 PM)',
    requirements: 'Active Validated Solo Parent Card',
    author: 'Municipal Administrator',
    updatedAt: new Date().toISOString()
  }
];

export const SAMPLE_APPOINTMENTS: AppointmentData[] = [
  { 
    id: 'app_1', 
    benefitTitle: 'Social Pension', 
    appliedCategory: 'senior', 
    category: 'senior', 
    date: new Date().toISOString().split('T')[0], 
    status: 'Pending', 
    userId: 'user_1', 
    userName: 'Juan Dela Cruz', 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verificationCode: 'DSWD-SP-40F1A'
  },
  { 
    id: 'app_2', 
    benefitTitle: 'Solo Parent Grant', 
    appliedCategory: 'solo-parent', 
    category: 'solo-parent', 
    date: new Date().toISOString().split('T')[0], 
    status: 'Approved', 
    userId: 'user_2', 
    userName: 'Maria Elena Santos', 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verificationCode: 'DSWD-SP-59C7B'
  },
  { 
    id: 'app_3', 
    benefitTitle: 'PWD Cash Gift', 
    appliedCategory: 'pwd', 
    category: 'pwd', 
    date: new Date().toISOString().split('T')[0], 
    status: 'Pending', 
    userId: 'user_3', 
    userName: 'Pedro Penduko', 
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    verificationCode: 'DSWD-SP-88E2D'
  },
  { 
    id: 'app_4', 
    benefitTitle: 'Social Pension', 
    appliedCategory: 'senior', 
    category: 'senior', 
    date: '2026-01-15', 
    status: 'Approved', 
    userId: 'user_4', 
    userName: 'Elena Ramos', 
    createdAt: new Date('2026-01-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-01-15T10:30:00Z').toISOString(),
    verificationCode: 'DSWD-SP-31A1E'
  },
  { 
    id: 'app_5', 
    benefitTitle: 'PWD Cash Gift', 
    appliedCategory: 'pwd', 
    category: 'pwd', 
    date: '2026-02-10', 
    status: 'Approved', 
    userId: 'user_5', 
    userName: 'Ramon Magsaysay', 
    createdAt: new Date('2026-02-10T08:15:00Z').toISOString(),
    updatedAt: new Date('2026-01-10T14:00:00Z').toISOString(),
    verificationCode: 'DSWD-SP-90C0B'
  }
];

export const SAMPLE_CONTACTS: DswdContactData[] = [
  {
    id: 'contact_1',
    name: 'DSWD Central Office',
    contactPerson: 'Sec. Rex Gatchalian',
    position: 'Secretary',
    email: 'osec@dswd.gov.ph',
    phone: '(02) 8931-8101',
    address: 'Batasan Pambansa Complex, Constitution Hills, Quezon City',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'contact_2',
    name: 'DSWD Field Office NCR',
    contactPerson: 'Dir. Michael Joseph J. Lorico',
    position: 'Regional Director',
    email: 'foncr@dswd.gov.ph',
    phone: '(02) 8733-0010',
    address: '389 San Rafael St., cor. Legarda St., Binondo, Manila',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'contact_3',
    name: 'DSWD Field Office IV-A (CALABARZON)',
    contactPerson: 'Dir. Barry R. Chua',
    position: 'Regional Director',
    email: 'fo4a@dswd.gov.ph',
    phone: '(02) 8807-7102',
    address: 'Alabang-Zapote Road, Alabang, Muntinlupa City',
    updatedAt: new Date().toISOString()
  }
];

export const initLocalStorage = () => {
  if (!localStorage.getItem('dswd_seeded')) {
    localStorage.setItem('dswd_users', JSON.stringify(SAMPLE_USERS));
    localStorage.setItem('dswd_benefits', JSON.stringify(SAMPLE_BENEFITS));
    localStorage.setItem('dswd_news', JSON.stringify(SAMPLE_NEWS));
    localStorage.setItem('dswd_appointments', JSON.stringify(SAMPLE_APPOINTMENTS));
    localStorage.setItem('dswd_contacts', JSON.stringify(SAMPLE_CONTACTS));
    localStorage.setItem('dswd_seeded', 'true');
    console.log('[LOCAL_DB] Seeding defaults to localStorage');
  } else if (!localStorage.getItem('dswd_contacts')) {
    // Graceful migration for existing local databases
    localStorage.setItem('dswd_contacts', JSON.stringify(SAMPLE_CONTACTS));
  }
};

export const getLocalUsers = (): UserData[] => {
  initLocalStorage();
  const raw = localStorage.getItem('dswd_users');
  return raw ? JSON.parse(raw) : SAMPLE_USERS;
};

export const setLocalUsers = (users: UserData[]) => {
  localStorage.setItem('dswd_users', JSON.stringify(users));
};

export const getLocalBenefits = (): BenefitData[] => {
  initLocalStorage();
  const raw = localStorage.getItem('dswd_benefits');
  return raw ? JSON.parse(raw) : SAMPLE_BENEFITS;
};

export const setLocalBenefits = (benefits: BenefitData[]) => {
  localStorage.setItem('dswd_benefits', JSON.stringify(benefits));
};

export const getLocalNews = (): AnnouncementData[] => {
  initLocalStorage();
  const raw = localStorage.getItem('dswd_news');
  return raw ? JSON.parse(raw) : SAMPLE_NEWS;
};

export const setLocalNews = (news: AnnouncementData[]) => {
  localStorage.setItem('dswd_news', JSON.stringify(news));
};

export const getLocalAppointments = (): AppointmentData[] => {
  initLocalStorage();
  const raw = localStorage.getItem('dswd_appointments');
  return raw ? JSON.parse(raw) : SAMPLE_APPOINTMENTS;
};

export const setLocalAppointments = (apps: AppointmentData[]) => {
  localStorage.setItem('dswd_appointments', JSON.stringify(apps));
};

export const getLocalContacts = (): DswdContactData[] => {
  initLocalStorage();
  const raw = localStorage.getItem('dswd_contacts');
  return raw ? JSON.parse(raw) : SAMPLE_CONTACTS;
};

export const setLocalContacts = (contacts: DswdContactData[]) => {
  localStorage.setItem('dswd_contacts', JSON.stringify(contacts));
};
