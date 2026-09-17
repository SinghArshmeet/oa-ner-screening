/**
 * OA-Screen NER Authentication & Session Management Module
 * Note: This is an operational client-side mock authentication layer for frontline triage stations.
 * It isolates authentication so it can easily connect to an OAuth2/JWT backend in production.
 */

export const ROLES = {
  screener: {
    id: 'screener',
    label: 'Clinical Screener',
    title: 'Frontline Triage Operator',
    badge: 'Station Screener',
    icon: 'assignment_ind',
    description: 'Patient enrollment, 8s gait capture, and KOOS-NER questionnaire triage.',
    defaultEmail: 'screener@phc.assam.gov.in',
    defaultName: 'S. Terangpi, ANM'
  },
  officer: {
    id: 'officer',
    label: 'Medical Officer',
    title: 'Medical Officer (MO)',
    badge: 'Medical Officer',
    icon: 'medical_services',
    description: 'Diagnostic review, KL-grade radiographic estimates, and teleconsult sign-off.',
    defaultEmail: 'mo.sharma@gmch.gov.in',
    defaultName: 'Dr. R. Sharma, MO'
  },
  admin: {
    id: 'admin',
    label: 'System Administrator',
    title: 'Regional Mesh Administrator',
    badge: 'System Admin',
    icon: 'admin_panel_settings',
    description: 'ESP32 hardware fleet management, offline mesh synchronization, and audit logs.',
    defaultEmail: 'admin.diphu@icmr.gov.in',
    defaultName: 'Eng. K. Das, IT'
  }
};

export const DEMO_ACCOUNTS = [
  // Clinical Screeners
  {
    role: 'screener',
    email: 'screener@phc.assam.gov.in',
    staffId: 'NER-STAFF-0892',
    password: 'demo123',
    name: 'S. Terangpi, ANM',
    station: 'Diphu PHC, Station A'
  },
  {
    role: 'screener',
    email: 'screener.borah@phc.assam.gov.in',
    staffId: 'NER-STAFF-1044',
    password: 'demo123',
    name: 'P. Borah, GNM',
    station: 'Diphu PHC, Station B'
  },
  {
    role: 'screener',
    email: 'screener.kachari@phc.assam.gov.in',
    staffId: 'NER-STAFF-2190',
    password: 'demo123',
    name: 'M. Kachari, CHW',
    station: 'Bokajan Sub-Centre'
  },

  // Medical Officers
  {
    role: 'officer',
    email: 'mo.sharma@gmch.gov.in',
    staffId: 'NER-MO-0142',
    password: 'demo123',
    name: 'Dr. R. Sharma, MO',
    station: 'Diphu CHC / GMCH Ortho Unit'
  },
  {
    role: 'officer',
    email: 'mo.gogoi@gmch.gov.in',
    staffId: 'NER-MO-0298',
    password: 'demo123',
    name: 'Dr. N. Gogoi, Orthopaedic Specialist',
    station: 'Diphu District Hospital'
  },
  {
    role: 'officer',
    email: 'mo.deuri@icmr.gov.in',
    staffId: 'NER-MO-0371',
    password: 'demo123',
    name: 'Dr. A. Deuri, Clinical Evaluator',
    station: 'ICMR-RMRC Tele-Consult Desk'
  },

  // System Administrators
  {
    role: 'admin',
    email: 'admin.diphu@icmr.gov.in',
    staffId: 'NER-ADM-001',
    password: 'admin123',
    name: 'Eng. K. Das, IT',
    station: 'ICMR-RMRC Hub, Diphu'
  },
  {
    role: 'admin',
    email: 'admin.mesh@assam.gov.in',
    staffId: 'NER-ADM-009',
    password: 'admin123',
    name: 'T. Saikia, Network Admin',
    station: 'State Health Telemetry NOC, Guwahati'
  }
];

const STORAGE_KEY = 'oa_ner_auth_session';
const REGISTERED_USERS_KEY = 'oa_ner_registered_users';

/**
 * Retrieve list of registered practitioners from localStorage
 */
export function getRegisteredUsers() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse registered users:', e);
    return [];
  }
}

/**
 * Register a new clinical practitioner / station operator
 */
export async function registerUser({ name, email, staffId, roleId = 'screener', station, password }) {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 450));

  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanStaffId = (staffId || '').trim().toUpperCase();
  const cleanStation = (station || '').trim();
  const cleanPassword = (password || '').trim();

  if (!cleanName) throw new Error('Full Name and designation are required.');
  if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('A valid institutional email address is required.');
  if (!cleanPassword || cleanPassword.length < 5) throw new Error('Password must be at least 5 characters long.');

  const registered = getRegisteredUsers();

  // Check for duplicate email or staff ID
  const existingUser = registered.find(
    (u) => u.email.toLowerCase() === cleanEmail || (cleanStaffId && u.staffId?.toUpperCase() === cleanStaffId)
  );

  if (existingUser) {
    throw new Error('An account with this email address or Staff ID already exists.');
  }

  const roleConfig = ROLES[roleId] || ROLES.screener;
  const newStaffId = cleanStaffId || `NER-${roleConfig.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser = {
    staffId: newStaffId,
    name: cleanName,
    email: cleanEmail,
    role: roleConfig.label,
    roleId: roleConfig.id,
    roleBadge: roleConfig.badge,
    station: cleanStation || 'Diphu CHC / Karbi Anglong Station',
    password: cleanPassword,
    registeredAt: new Date().toISOString(),
    isRegistered: true,
  };

  registered.push(newUser);
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registered));
  } catch (err) {
    console.warn('Could not persist registered user to storage:', err);
  }

  return {
    id: newUser.staffId,
    staffId: newUser.staffId,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    roleId: newUser.roleId,
    roleBadge: newUser.roleBadge,
    station: newUser.station,
    isRegistered: true,
    isDemo: false
  };
}

/**
 * Helper to get all accounts available for a given role
 */
export function getAccountsForRole(roleId) {
  if (!roleId) return [];
  const demoAccounts = DEMO_ACCOUNTS.filter((acc) => acc.role === roleId).map((acc) => {
    const roleConfig = ROLES[acc.role] || ROLES.screener;
    return {
      id: acc.staffId,
      staffId: acc.staffId,
      name: acc.name,
      email: acc.email,
      role: roleConfig.label,
      roleId: roleConfig.id,
      roleBadge: roleConfig.badge,
      station: acc.station,
      isDemo: true
    };
  });

  const registeredAccounts = getRegisteredUsers()
    .filter((acc) => acc.roleId === roleId)
    .map((acc) => ({
      id: acc.staffId,
      staffId: acc.staffId,
      name: acc.name,
      email: acc.email,
      role: acc.role,
      roleId: acc.roleId,
      roleBadge: acc.roleBadge,
      station: acc.station,
      isDemo: false,
      isRegistered: true
    }));

  return [...registeredAccounts, ...demoAccounts];
}

/**
 * Retrieve the active user from localStorage (persistent) or sessionStorage (transient)
 */
export function getStoredUser() {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check persistent localStorage
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      delete parsed.password;
      delete parsed.token;
      return parsed;
    }

    // 2. Check transient sessionStorage
    const sessionData = sessionStorage.getItem(STORAGE_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      delete parsed.password;
      delete parsed.token;
      return parsed;
    }
  } catch (err) {
    console.warn('Could not read stored authentication session:', err);
  }

  return null;
}

/**
 * Authenticate with email/staff ID and password
 */
export async function loginUser({ identifier, password, roleId = 'screener', rememberDevice = false }) {
  // Simulate network roundtrip latency for realistic clinical UI
  await new Promise((resolve) => setTimeout(resolve, 450));

  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanId) {
    throw new Error('Please enter your Staff ID or registered PHC email address.');
  }

  if (!cleanPassword) {
    throw new Error('Please enter your station access password.');
  }

  // 1. Check custom registered practitioners
  const registeredUsers = getRegisteredUsers();
  const matchedRegistered = registeredUsers.find(
    (acc) =>
      (acc.email.toLowerCase() === cleanId || acc.staffId?.toLowerCase() === cleanId) &&
      acc.password === cleanPassword
  );

  if (matchedRegistered) {
    const roleConfig = ROLES[matchedRegistered.roleId] || ROLES[roleId] || ROLES.screener;
    const user = {
      id: matchedRegistered.staffId,
      staffId: matchedRegistered.staffId,
      name: matchedRegistered.name,
      email: matchedRegistered.email,
      role: roleConfig.label,
      roleId: roleConfig.id,
      roleBadge: roleConfig.badge,
      station: matchedRegistered.station || 'Diphu CHC / Karbi Anglong Station',
      rememberDevice,
      isDemo: false,
      isRegistered: true,
      authenticatedAt: new Date().toISOString()
    };

    if (rememberDevice) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      localStorage.removeItem(STORAGE_KEY);
    }
    return user;
  }

  // 2. Check exact demo accounts
  const matchedDemo = DEMO_ACCOUNTS.find(
    (acc) =>
      (acc.email.toLowerCase() === cleanId || acc.staffId.toLowerCase() === cleanId) &&
      acc.password === cleanPassword
  );

  // 3. Accept standard demo password 'demo123' or 'admin123' for any valid staff/email format
  const roleConfig = ROLES[roleId] || ROLES.screener;
  const isGenericValid =
    (cleanPassword === 'demo123' || cleanPassword === 'admin123' || cleanPassword === 'password') &&
    (cleanId.includes('@') || cleanId.startsWith('ner-') || cleanId.startsWith('staff-') || cleanId.length >= 4);

  if (!matchedDemo && !isGenericValid) {
    throw new Error(
      'Invalid credentials. Check your email/password or create a new account using the "Register Practitioner" tab.'
    );
  }

  const role = matchedDemo ? ROLES[matchedDemo.role] : roleConfig;
  const user = {
    id: matchedDemo?.staffId || `NER-STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
    name: matchedDemo?.name || role.defaultName,
    email: matchedDemo?.email || cleanId,
    role: role.label,
    roleId: role.id,
    roleBadge: role.badge,
    station: matchedDemo?.station || 'Diphu PHC, Assam',
    rememberDevice,
    isDemo: true, // Clearly identify trial/simulated accounts
    demoStatus: 'Offline Simulation',
    authenticatedAt: new Date().toISOString()
  };

  // Store in selected storage without exposing password
  if (rememberDevice) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.removeItem(STORAGE_KEY);
  }

  return user;
}


/**
 * Quick 1-click bypass for instant local testing
 */
export function loginAsDemo(roleId = 'screener') {
  const role = ROLES[roleId] || ROLES.screener;
  const matchedDemo = DEMO_ACCOUNTS.find((acc) => acc.role === role.id) || DEMO_ACCOUNTS[0];

  const user = {
    id: matchedDemo.staffId,
    name: matchedDemo.name,
    email: matchedDemo.email,
    role: role.label,
    roleId: role.id,
    roleBadge: role.badge,
    station: matchedDemo.station,
    rememberDevice: false,
    isDemo: true, // Labeled as simulated/demo
    demoStatus: 'Offline Simulation',
    authenticatedAt: new Date().toISOString()
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.removeItem(STORAGE_KEY);

  return user;
}

/**
 * Switch account to another user profile within current session
 */
export function switchAccount(targetAccount, rememberDevice = false) {
  const roleConfig = ROLES[targetAccount.roleId || targetAccount.role] || ROLES.screener;
  const user = {
    id: targetAccount.staffId || targetAccount.id,
    name: targetAccount.name,
    email: targetAccount.email,
    role: roleConfig.label,
    roleId: roleConfig.id,
    roleBadge: roleConfig.badge,
    station: targetAccount.station,
    rememberDevice,
    isDemo: true,
    demoStatus: 'Offline Simulation',
    authenticatedAt: new Date().toISOString()
  };

  if (rememberDevice) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.removeItem(STORAGE_KEY);
  }

  return user;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetch current user from server session (HTTP-only cookie)
 */
export async function fetchServerUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const user = await res.json();
      // Cache profile locally for synchronous rendering without saving tokens
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    }
  } catch (err) {
    console.debug('No active server session found:', err);
  }
  return null;
}

/**
 * Terminate session both on client and server
 */
export async function logoutUser() {
  try {
    // 1. Invalidate session on backend
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});

    // 2. Clear client storage
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Error during session teardown:', err);
  }
}
