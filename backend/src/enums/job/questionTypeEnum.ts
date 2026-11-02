/** Type of screening question asked on a job application form. */
export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
}

export const QUESTION_TYPES: QuestionType[] = Object.values(QuestionType);

/** Question types that must have at least one option defined. */
export const QUESTION_TYPES_REQUIRING_OPTIONS: QuestionType[] = [
  QuestionType.SINGLE_CHOICE,
  QuestionType.MULTI_CHOICE,
];

/** Question types that must NOT have options (free-form answers). */
export const QUESTION_TYPES_WITHOUT_OPTIONS: QuestionType[] = [
  QuestionType.TEXT,
  QuestionType.NUMBER,
  QuestionType.DATE,
  QuestionType.BOOLEAN,
];
