import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';

import { auth, db } from '@/config/firebase';

import { DB } from '@/constants/db';
import type { LoginParams, RegisterParams } from '@/types/user';

export async function register(params: RegisterParams) {
  const { email, password, username } = params;
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await addDoc(collection(db, DB.USERS), {
    uid: user.uid,
    email,
    password,
  });

  await updateProfile(auth.currentUser, {
    displayName: username,
  });

  return user;
}

export async function login(params: LoginParams) {
  const { email, password } = params;
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  return user;
}

export async function logout() {
  await signOut(auth);
}

export async function verifyTokenValidity() {
  try {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
      return true;
    }
  } catch (error) {
    console.error('Error verifying token validity: ', error);
  }
  return false;
}
