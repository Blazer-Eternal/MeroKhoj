'use client';

/** Loads the caller's jobseeker profile (id needed for nested resources). */
import { useApiItem } from '@/hooks/use-api-item';
import { endpoints } from '@/services/api-endpoints';
import type { JobseekerProfile } from '@/types';

export interface ProfileResponse {
  profile: JobseekerProfile | null;
}

export function useMyProfile() {
  const state = useApiItem<ProfileResponse>(endpoints.users.myProfile);
  return {
    profile: state.data?.profile ?? null,
    profileId: state.data?.profile?.id ?? null,
    loading: state.loading,
    error: state.error,
    refetch: state.refetch,
  };
}
