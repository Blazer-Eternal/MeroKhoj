import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { aiControllers } from '../../controllers';
import { requireAuth, requireJobseeker, validate } from '../../../middleware';
import {
  applyParsedResumeSchema,
  careerChatSchema,
  generateInterviewSessionSchema,
  generateJdSchema,
  improveJdSchema,
  improveResumeSchema,
  parseResumeSchema,
  skillGapQuerySchema,
  submitAnswerSchema,
} from '../../../validators';
import { AppError } from '../../../utils';
import { ALLOWED_RESUME_TYPES } from '../../../services/jobseeker/resumeServices';
import { detectResumeKind } from '../../../services/ai/shared/textExtract';

const router = Router();

/**
 * /api/ai — Phase 2 AI features.
 * Jobseeker: resume parse/apply/improve, career chat, skill gap, interview
 * prep. Employer: JD generation. Semantic search lives at GET /jobs/semantic.
 * Every generative endpoint answers 503 AI_NOT_CONFIGURED without a key.
 */

// --- upload middleware -----------------------------------------------------

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // same ceiling as resumeServices

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const kind = detectResumeKind(file.originalname, file.mimetype);
    if (!kind || !(kind in ALLOWED_RESUME_TYPES)) {
      callback(
        new AppError(
          `Unsupported file type. Allowed: ${Object.keys(ALLOWED_RESUME_TYPES).join(', ')}`,
          400,
          'VALIDATION_ERROR',
        ),
      );
      return;
    }
    callback(null, true);
  },
});

/** Normalise multer errors into the standard error envelope. */
const handleUploadErrors = (error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'Resume file exceeds the 10MB limit'
        : `Upload failed: ${error.message}`;
    next(new AppError(message, 400, 'VALIDATION_ERROR'));
    return;
  }
  next(error);
};

// --- resume (jobseeker) ----------------------------------------------------

router.post(
  '/resume/parse',
  requireAuth,
  requireJobseeker,
  validate({ body: parseResumeSchema }),
  aiControllers.parseResume,
);

router.post(
  '/resume/parse/file',
  requireAuth,
  requireJobseeker,
  handleUploadErrors,
  upload.single('file'),
  handleUploadErrors,
  aiControllers.parseResumeUpload,
);

router.post(
  '/resume/apply',
  requireAuth,
  requireJobseeker,
  validate({ body: applyParsedResumeSchema }),
  aiControllers.applyParsed,
);

router.post(
  '/resume/improve',
  requireAuth,
  requireJobseeker,
  validate({ body: improveResumeSchema }),
  aiControllers.improveResume,
);

// --- job description generator (employer) ----------------------------------

router.post(
  '/job-descriptions/generate',
  requireAuth,
  validate({ body: generateJdSchema }),
  aiControllers.generateJd,
);

router.post(
  '/job-descriptions/improve',
  requireAuth,
  validate({ body: improveJdSchema }),
  aiControllers.improveJd,
);

// --- career assistant (jobseeker chat) -------------------------------------

router.post(
  '/career-assistant/message',
  requireAuth,
  requireJobseeker,
  validate({ body: careerChatSchema }),
  aiControllers.chat,
);
router.get('/career-assistant/history', requireAuth, requireJobseeker, aiControllers.chatHistory);
router.delete(
  '/career-assistant/history',
  requireAuth,
  requireJobseeker,
  aiControllers.clearChatHistory,
);

// --- skill gap analysis (jobseeker) ----------------------------------------

router.get(
  '/skill-gap',
  requireAuth,
  requireJobseeker,
  validate({ query: skillGapQuerySchema }),
  aiControllers.skillGap,
);

// --- interview preparation (jobseeker) -------------------------------------

router.post(
  '/interview/sessions',
  requireAuth,
  requireJobseeker,
  validate({ body: generateInterviewSessionSchema }),
  aiControllers.createInterviewSession,
);
router.get('/interview/sessions', requireAuth, requireJobseeker, aiControllers.listInterviewSessions);
router.get('/interview/sessions/:id', requireAuth, requireJobseeker, aiControllers.getInterviewSession);
router.post(
  '/interview/sessions/:id/questions/:questionId/answer',
  requireAuth,
  requireJobseeker,
  validate({ body: submitAnswerSchema }),
  aiControllers.answerInterviewQuestion,
);

export default router;
