/** Format / round of an interview. */
export enum InterviewType {
  PHONE = 'PHONE',
  VIDEO = 'VIDEO',
  IN_PERSON = 'IN_PERSON',
  TECHNICAL = 'TECHNICAL',
  HR = 'HR',
  FINAL = 'FINAL',
}

export const INTERVIEW_TYPES: InterviewType[] = Object.values(InterviewType);
