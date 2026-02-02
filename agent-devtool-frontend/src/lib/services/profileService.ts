import type { Profile, ProfileStorage, AgentConfig } from '../../types';

const STORAGE_KEY = 'agent-devtool-profiles';

/**
 * Profile Service - Manages profile creation, selection, and storage
 */
export class ProfileService {
  /**
   * Get all profiles from storage
   */
  static getProfiles(): Profile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const data: ProfileStorage = JSON.parse(stored);
      // Convert date strings back to Date objects
      return data.profiles.map(profile => ({
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      }));
    } catch (error) {
      console.error('Error loading profiles:', error);
      return [];
    }
  }

  /**
   * Get current profile
   */
  static getCurrentProfile(): Profile | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const data: ProfileStorage = JSON.parse(stored);
      if (!data.currentProfileId) return null;
      
      const profile = data.profiles.find(p => p.id === data.currentProfileId);
      if (!profile) return null;
      
      return {
        ...profile,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
      };
    } catch (error) {
      console.error('Error loading current profile:', error);
      return null;
    }
  }

  /**
   * Create a new profile
   */
  static createProfile(name: string, description?: string, color?: string): Profile {
    const profile: Profile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      color,
      createdAt: new Date(),
      updatedAt: new Date(),
      agents: [],
      backendUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5016',
      defaultProtocol: 'rest',
    };

    const profiles = this.getProfiles();
    profiles.push(profile);
    this.saveProfiles(profiles, profile.id);

    return profile;
  }

  /**
   * Update a profile
   */
  static updateProfile(profileId: string, updates: Partial<Profile>): Profile | null {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === profileId);
    
    if (index === -1) return null;

    const updatedProfile: Profile = {
      ...profiles[index],
      ...updates,
      updatedAt: new Date(),
    };

    profiles[index] = updatedProfile;
    this.saveProfiles(profiles, this.getCurrentProfileId());

    return updatedProfile;
  }

  /**
   * Delete a profile
   */
  static deleteProfile(profileId: string): boolean {
    const profiles = this.getProfiles();
    const filtered = profiles.filter(p => p.id !== profileId);
    
    if (filtered.length === profiles.length) return false; // Profile not found

    const currentProfileId = this.getCurrentProfileId();
    const newCurrentId = currentProfileId === profileId 
      ? (filtered.length > 0 ? filtered[0].id : null)
      : currentProfileId;

    this.saveProfiles(filtered, newCurrentId);
    return true;
  }

  /**
   * Set current profile
   */
  static setCurrentProfile(profileId: string): boolean {
    const profiles = this.getProfiles();
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) return false;

    this.saveProfiles(profiles, profileId);
    return true;
  }

  /**
   * Add agent to profile
   */
  static addAgentToProfile(profileId: string, agent: AgentConfig): boolean {
    const profiles = this.getProfiles();
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) return false;

    // Check if agent with same ID already exists
    if (profile.agents.some(a => a.id === agent.id)) {
      return false; // Agent already exists
    }

    profile.agents.push(agent);
    profile.updatedAt = new Date();
    
    this.saveProfiles(profiles, this.getCurrentProfileId());
    return true;
  }

  /**
   * Update agent in profile
   */
  static updateAgentInProfile(profileId: string, agentId: string, updates: Partial<AgentConfig>): boolean {
    const profiles = this.getProfiles();
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) return false;

    const agentIndex = profile.agents.findIndex(a => a.id === agentId);
    if (agentIndex === -1) return false;

    profile.agents[agentIndex] = {
      ...profile.agents[agentIndex],
      ...updates,
    };
    profile.updatedAt = new Date();
    
    this.saveProfiles(profiles, this.getCurrentProfileId());
    return true;
  }

  /**
   * Remove agent from profile
   */
  static removeAgentFromProfile(profileId: string, agentId: string): boolean {
    const profiles = this.getProfiles();
    const profile = profiles.find(p => p.id === profileId);
    
    if (!profile) return false;

    const initialLength = profile.agents.length;
    profile.agents = profile.agents.filter(a => a.id !== agentId);
    
    if (profile.agents.length === initialLength) return false; // Agent not found

    profile.updatedAt = new Date();
    this.saveProfiles(profiles, this.getCurrentProfileId());
    return true;
  }

  /**
   * Get agents for current profile
   */
  static getCurrentProfileAgents(): AgentConfig[] {
    const profile = this.getCurrentProfile();
    return profile?.agents || [];
  }

  /**
   * Export a profile to JSON file
   * @param profileId - Profile ID to export (if null, exports current profile)
   * @returns JSON string ready for download
   */
  static exportProfile(profileId?: string): string | null {
    const targetProfileId = profileId || this.getCurrentProfileId();
    if (!targetProfileId) return null;

    const profiles = this.getProfiles();
    const profile = profiles.find(p => p.id === targetProfileId);
    if (!profile) return null;

    // Create export object (exclude internal IDs, convert dates to ISO strings)
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: {
        name: profile.name,
        description: profile.description,
        agents: profile.agents,
        backendUrl: profile.backendUrl,
        defaultProtocol: profile.defaultProtocol,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export all profiles to JSON file
   * @returns JSON string ready for download
   */
  static exportAllProfiles(): string | null {
    const profiles = this.getProfiles();
    if (profiles.length === 0) return null;

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profiles: profiles.map(profile => ({
        name: profile.name,
        description: profile.description,
        agents: profile.agents,
        backendUrl: profile.backendUrl,
        defaultProtocol: profile.defaultProtocol,
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import a profile from JSON
   * @param jsonString - JSON string to import
   * @param options - Import options
   * @returns Import result with success status and message
   */
  static importProfile(
    jsonString: string,
    options: { overwriteExisting?: boolean; renameOnConflict?: boolean } = {}
  ): { success: boolean; message: string; profile?: Profile } {
    try {
      const data = JSON.parse(jsonString);

      // Validate structure
      if (!data.profile && !data.profiles) {
        return { success: false, message: 'Invalid profile format: missing profile or profiles field' };
      }

      // Handle single profile import
      if (data.profile) {
        return this.importSingleProfile(data.profile, options);
      }

      // Handle multiple profiles import
      if (data.profiles && Array.isArray(data.profiles)) {
        return this.importMultipleProfiles(data.profiles, options);
      }

      return { success: false, message: 'Invalid profile format' };
    } catch (error) {
      return {
        success: false,
        message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Import a single profile
   */
  private static importSingleProfile(
    profileData: any,
    options: { overwriteExisting?: boolean; renameOnConflict?: boolean }
  ): { success: boolean; message: string; profile?: Profile } {
    // Validate required fields
    if (!profileData.name) {
      return { success: false, message: 'Profile name is required' };
    }

    if (!Array.isArray(profileData.agents)) {
      return { success: false, message: 'Agents must be an array' };
    }

    // Validate agents structure
    for (const agent of profileData.agents) {
      if (!agent.id || !agent.name || !agent.restPath || !agent.a2aPath) {
        return {
          success: false,
          message: 'Invalid agent format: missing required fields (id, name, restPath, a2aPath)',
        };
      }
    }

    const existingProfiles = this.getProfiles();
    const existingProfile = existingProfiles.find(p => p.name === profileData.name);

    let profileName = profileData.name;
    if (existingProfile) {
      if (options.overwriteExisting) {
        // Update existing profile
        const updatedProfile: Profile = {
          ...existingProfile,
          description: profileData.description || existingProfile.description,
          agents: profileData.agents,
          backendUrl: profileData.backendUrl || existingProfile.backendUrl,
          defaultProtocol: profileData.defaultProtocol || existingProfile.defaultProtocol,
          updatedAt: new Date(),
        };

        const index = existingProfiles.findIndex(p => p.id === existingProfile.id);
        existingProfiles[index] = updatedProfile;
        this.saveProfiles(existingProfiles, this.getCurrentProfileId());

        return {
          success: true,
          message: `Profile "${profileName}" updated successfully`,
          profile: updatedProfile,
        };
      } else if (options.renameOnConflict) {
        // Rename the new profile
        let counter = 1;
        while (existingProfiles.some(p => p.name === `${profileData.name} (${counter})`)) {
          counter++;
        }
        profileName = `${profileData.name} (${counter})`;
      } else {
        return {
          success: false,
          message: `Profile "${profileData.name}" already exists. Use overwrite or rename option.`,
        };
      }
    }

    // Create new profile
    const newProfile: Profile = {
      id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: profileName,
      description: profileData.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      agents: profileData.agents,
      backendUrl: profileData.backendUrl || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5016',
      defaultProtocol: profileData.defaultProtocol || 'rest',
    };

    existingProfiles.push(newProfile);
    this.saveProfiles(existingProfiles, this.getCurrentProfileId());

    return {
      success: true,
      message: `Profile "${profileName}" imported successfully`,
      profile: newProfile,
    };
  }

  /**
   * Import multiple profiles
   */
  private static importMultipleProfiles(
    profilesData: any[],
    options: { overwriteExisting?: boolean; renameOnConflict?: boolean }
  ): { success: boolean; message: string; profiles?: Profile[] } {
    const importedProfiles: Profile[] = [];
    const errors: string[] = [];

    for (const profileData of profilesData) {
      const result = this.importSingleProfile(profileData, options);
      if (result.success && result.profile) {
        importedProfiles.push(result.profile);
      } else {
        errors.push(result.message);
      }
    }

    if (importedProfiles.length === 0) {
      return {
        success: false,
        message: `Failed to import profiles: ${errors.join('; ')}`,
      };
    }

    return {
      success: true,
      message: `Imported ${importedProfiles.length} profile(s)${errors.length > 0 ? `. Errors: ${errors.join('; ')}` : ''}`,
      profiles: importedProfiles,
    };
  }

  /**
   * Private: Save profiles to storage
   */
  private static saveProfiles(profiles: Profile[], currentProfileId: string | null): void {
    const data: ProfileStorage = {
      profiles,
      currentProfileId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Private: Get current profile ID
   */
  private static getCurrentProfileId(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const data: ProfileStorage = JSON.parse(stored);
      return data.currentProfileId;
    } catch {
      return null;
    }
  }
}
