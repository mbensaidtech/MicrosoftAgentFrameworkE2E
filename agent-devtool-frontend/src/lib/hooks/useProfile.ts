import { useState, useEffect } from 'react';
import type { Profile } from '../../types';
import { ProfileStore } from '../store/profileStore';

/**
 * Hook to manage current profile
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(ProfileStore.getCurrentProfile());
  const [profiles, setProfiles] = useState<Profile[]>(ProfileStore.getProfiles());

  useEffect(() => {
    const unsubscribe = ProfileStore.subscribe(() => {
      setProfile(ProfileStore.getCurrentProfile());
      setProfiles(ProfileStore.getProfiles());
    });

    return unsubscribe;
  }, []);

  const setCurrentProfile = (profileId: string) => {
    ProfileStore.setCurrentProfile(profileId);
  };

  const createProfile = (name: string, description?: string) => {
    return ProfileStore.createProfile(name, description);
  };

  const deleteProfile = (profileId: string) => {
    return ProfileStore.deleteProfile(profileId);
  };

  const refresh = () => {
    ProfileStore.refresh();
  };

  return {
    profile,
    profiles,
    setCurrentProfile,
    createProfile,
    deleteProfile,
    refresh,
    hasProfile: profile !== null,
  };
}
