/** Whether a jobseeker profile is visible to employers / the public. */
export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export const PROFILE_VISIBILITIES: ProfileVisibility[] = Object.values(ProfileVisibility);
