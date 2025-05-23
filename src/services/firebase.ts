import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5d9A3JA23O6r7VXu6oRk-_xGHYPElh-s",
  authDomain: "databaseupload-2195a.firebaseapp.com",
  projectId: "databaseupload-2195a",
  storageBucket: "databaseupload-2195a.firebasestorage.app",
  messagingSenderId: "1010080505707",
  appId: "1:1010080505707:web:64105decb233bd888f362e",
  measurementId: "G-CX190YM3CJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Authentication functions
export const registerUser = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Media handling functions
export interface MediaItem {
  id: string;
  userId: string;
  mediaUrl: string;
  resourceType: string;
  collectionId: string | null;
  createdAt: any;
}

export const saveMediaToFirestore = async (
  userId: string, 
  mediaUrl: string, 
  resourceType: string,
  collectionId: string | null = null
) => {
  try {
    const docRef = await addDoc(collection(db, "media"), {
      userId,
      mediaUrl,
      resourceType,
      collectionId,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
};

export const getUserMedia = async (userId: string) => {
  try {
    const mediaRef = collection(db, "media");
    const q = query(mediaRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const media = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MediaItem[];
    
    return { media, error: null };
  } catch (error: any) {
    return { media: [], error: error.message };
  }
};

// Delete media function
export const deleteMedia = async (mediaId: string) => {
  try {
    await deleteDoc(doc(db, "media", mediaId));
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Collections functions
export interface Collection {
  id: string;
  userId: string;
  name: string;
  createdAt: any;
}

export const createCollection = async (userId: string, name: string) => {
  try {
    const docRef = await addDoc(collection(db, "collections"), {
      userId,
      name,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
};

export const getUserCollections = async (userId: string) => {
  try {
    const collectionsRef = collection(db, "collections");
    const q = query(collectionsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const collections = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Collection[];
    
    return { collections, error: null };
  } catch (error: any) {
    return { collections: [], error: error.message };
  }
};

export const updateMediaCollection = async (mediaId: string, collectionId: string | null) => {
  try {
    const mediaRef = doc(db, "media", mediaId);
    await updateDoc(mediaRef, {
      collectionId
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
