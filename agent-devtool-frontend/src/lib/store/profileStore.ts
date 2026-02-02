import type { Profile } from '../../types';
import { ProfileService } from '../services/profileService';

/**
 * Simple profile store using React state pattern
 * Can be replaced with Zustand/Redux if needed
 */
export class ProfileStore {
  private static listeners: Set<() => void> = new Set();
  private static currentProfile: Profile | null = null;

  /**
   * Subscribe to profile changes
   */
  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private static notify(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Get current profile
   */
  static getCurrentProfile(): Profile | null {
    if (!this.currentProfile) {
      this.currentProfile = ProfileService.getCurrentProfile();
    }
    return this.currentProfile;
  }

  /**
   * Set current profile
   */
  static setCurrentProfile(profileId: string): boolean {
    const success = ProfileService.setCurrentProfile(profileId);
    if (success) {
      this.currentProfile = ProfileService.getCurrentProfile();
      this.notify();
    }
    return success;
  }

  /**
   * Refresh current profile from storage
   */
  static refresh(): void {
    this.currentProfile = ProfileService.getCurrentProfile();
    this.notify();
  }

  /**
   * Get all profiles
   */
  static getProfiles(): Profile[] {
    return ProfileService.getProfiles();
  }

  /**
   * Create profile
   */
  static createProfile(name: string, description?: string, color?: string): Profile {
    const profile = ProfileService.createProfile(name, description, color);
    this.currentProfile = profile;
    this.notify();
    return profile;
  }

  /**
   * Delete profile
   */
  static deleteProfile(profileId: string): boolean {
    const success = ProfileService.deleteProfile(profileId);
    if (success) {
      this.refresh();
    }
    return success;
  }
}
