import { useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signOut,
  updateProfile as fbUpdateProfile,
  User
} from 'firebase/auth';

import { auth } from './firebase';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  image: string | null;
};

const map = (u: User | null): AppUser | null =>
  u
    ? {
        id: u.uid,
        email: u.email ?? '',
        name: u.displayName ?? '',
        firstName: u.displayName?.split(' ')[0],
        lastName: u.displayName?.split(' ').slice(1).join(' '),
        image: u.photoURL
      }
    : null;

export function useAuth() {
  const [state, setState] = useState<{
    user: AppUser | null;
    isLoading: boolean;
  }>({
    user: map(auth.currentUser),
    isLoading: !auth.currentUser
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setState({
        user: map(u),
        isLoading: false
      });
    });

    return unsubscribe;
  }, []);

  return state;
}

export function loginWithRedirect(opts?: {
  redirectUrl?: string;
}) {
  const next =
    opts?.redirectUrl ??
    window.location.pathname + window.location.search;

  window.location.assign(
    /login?next=${encodeURIComponent(next)}
  );
}

export async function logout() {
  await signOut(auth);
  window.location.assign('/');
}

export async function updateProfile(p: {
  name?: string;
}) {
  if (auth.currentUser && p.name) {
    await fbUpdateProfile(auth.currentUser, {
      displayName: p.name
    });
  }
}
