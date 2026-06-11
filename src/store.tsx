import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Guardia, Lead, Activity } from './types';
import { db, auth } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format } from 'date-fns';

interface AppState {
  users: User[];
  guardias: Guardia[];
  leads: Lead[];
  activities: Activity[];
  currentUser: User | null;
  shiftNames: Record<string, string>;
  login: () => Promise<void>;
  logout: () => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLeadStatus: (leadId: string, status: Lead['status']) => void;
  removeLead: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  assignGuardia: (guardia: Omit<Guardia, 'id'>) => void;
  removeGuardia: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  updateShiftName: (key: string, name: string) => void;
  isLoadingAuth: boolean;
  firebaseUser: FirebaseUser | null;
}

const StoreContext = createContext<AppState | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [shiftNames, setShiftNames] = useState<Record<string, string>>({
    'Campo Editable 1': 'Campo Editable 1',
    'Campo Editable 2': 'Campo Editable 2',
    'Campo Editable 3': 'Campo Editable 3'
  });
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Authentication Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setCurrentUser(null);
        setIsLoadingAuth(false);
      }
    });
    return () => unsub();
  }, []);

  // Sync Current User Profile
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.email) return;

    if (firebaseUser.email === 'laecristobalgalvan@gmail.com') {
      setCurrentUser({ id: firebaseUser.email, email: firebaseUser.email, name: 'Administrador (Gerente)', role: 'gerente' });
    }

    const unsub = onSnapshot(doc(db, 'users', firebaseUser.email), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User);
      } else if (firebaseUser.email !== 'laecristobalgalvan@gmail.com') {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setIsLoadingAuth(false);
    });

    return () => unsub();
  }, [firebaseUser]);

  // Sync Real-Time Data (Only if logged in and profile loaded)
  useEffect(() => {
    if (!currentUser) return;

    const unsubs: (() => void)[] = [];
    const isGerente = currentUser.role === 'gerente';

    // Sync Users
    unsubs.push(onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    }, (error) => console.error("Error fetching users:", error)));

    // Sync config
    unsubs.push(onSnapshot(doc(db, 'config', 'main'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().shiftNames) {
        setShiftNames(docSnap.data().shiftNames);
      }
    }, (error) => console.error("Error fetching config:", error)));

    // Sync guardias
    unsubs.push(onSnapshot(collection(db, 'guardias'), (snapshot) => {
      setGuardias(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Guardia)));
    }, (error) => console.error("Error fetching guardias:", error)));

    // Sync leads
    const leadsQuery = isGerente ? collection(db, 'leads') : query(collection(db, 'leads'), where('userId', '==', currentUser.id));
    unsubs.push(onSnapshot(leadsQuery, (snapshot) => {
      setLeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
    }, (error) => console.error("Error fetching leads:", error)));

    // Sync activities
    const activitiesQuery = isGerente ? collection(db, 'activities') : query(collection(db, 'activities'), where('userId', '==', currentUser.id));
    unsubs.push(onSnapshot(activitiesQuery, (snapshot) => {
      setActivities(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Activity)));
    }, (error) => console.error("Error fetching activities:", error)));

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [currentUser]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      alert("Error al iniciar sesión.");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addLead = async (leadData: Omit<Lead, 'id'>) => {
    const newId = uuidv4();
    await setDoc(doc(db, 'leads', newId), { ...leadData, id: newId });

    // Auto activities
    const date7 = format(addDays(new Date(leadData.date), 7), 'yyyy-MM-dd');
    const date30 = format(addDays(new Date(leadData.date), 30), 'yyyy-MM-dd');

    const act1Id = uuidv4();
    await setDoc(doc(db, 'activities', act1Id), {
      id: act1Id, leadId: newId, userId: leadData.userId, date: date7, type: 'FollowUp', status: 'Pendiente', comment: '¿Quieres que actualicemos el estatus de tu lead?'
    });

    const act2Id = uuidv4();
    await setDoc(doc(db, 'activities', act2Id), {
      id: act2Id, leadId: newId, userId: leadData.userId, date: date30, type: 'FollowUp', status: 'Pendiente', comment: 'Este es un buen momento para actualizar tu lead'
    });
  };

  const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
    await updateDoc(doc(db, 'leads', leadId), { status });
  };

  const removeLead = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este prospecto? Se borrará de forma permanente junto con sus actividades.')) {
      await deleteDoc(doc(db, 'leads', id));
      // Try to find and delete related activities
      const actsForLead = activities.filter(a => a.leadId === id);
      for (const act of actsForLead) {
        await deleteDoc(doc(db, 'activities', act.id));
      }
    }
  };

  const addActivity = async (actData: Omit<Activity, 'id'>) => {
    const actId = uuidv4();
    await setDoc(doc(db, 'activities', actId), { ...actData, id: actId });
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    await updateDoc(doc(db, 'activities', id), updates);
  };

  const assignGuardia = async (newGuardia: Omit<Guardia, 'id'>) => {
    const existing = guardias.find(g => g.date === newGuardia.date && g.shift === newGuardia.shift && g.userId === newGuardia.userId);
    if (!existing) {
      const gId = uuidv4();
      await setDoc(doc(db, 'guardias', gId), { ...newGuardia, id: gId });
    }
  };

  const removeGuardia = async (id: string) => {
    await deleteDoc(doc(db, 'guardias', id));
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    // Save cleanly using email as primary ID to simplify matching
    const id = user.email.toLowerCase().trim();
    await setDoc(doc(db, 'users', id), { ...user, id });
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    await updateDoc(doc(db, 'users', id), updates);
  };

  const removeUser = async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
    // Optional: we could clean up guardias or leads, but generally we just keep them for history
  };

  const updateShiftName = async (key: string, name: string) => {
    const newShifts = { ...shiftNames, [key]: name };
    setShiftNames(newShifts); // Optimistic UI
    await setDoc(doc(db, 'config', 'main'), { shiftNames: newShifts }, { merge: true });
  };

  return (
    <StoreContext.Provider value={{
      users, guardias, leads, activities, currentUser, shiftNames,
      login, logout, addLead, updateLeadStatus, removeLead, addActivity, updateActivity, assignGuardia, removeGuardia,
      addUser, updateUser, removeUser, updateShiftName, isLoadingAuth, firebaseUser
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
