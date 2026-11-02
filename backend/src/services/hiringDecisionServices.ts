import { AppError } from '../utils';
import { getSequelize } from '../config';
import {
  IHiringDecision,
  IHiringDecisionCreation,
  IAuthUser,
} from '../interfaces';
import {
  HiringDecisionOutcome,
  DECISION_APPLICATION_STATUS,
  ApplicationStatus,
  APPLICATION_TERMINAL_STATUSES,
} from '../enums';
import {
  hiringDecisionRepository,
  applicationRepository,
  applicationStatusHistoryRepository,
} from '../repositories';
import { assertCanMakeHiringDecisions, isPlatformAdmin } from './accessControl';
import { recordAuditForUser } from './auditLogServices';

/**
 * Hiring decision business logic (entity 23).
 *
 * The atomicity guarantee: recording a decision and moving the application to
 * the resulting status happen inside ONE database transaction — either both
 * land or neither does. The previous decision (if any) and the old status are
 * written to the append-only audit trail so history is preserved even though
 * `hiring_decisions` only ever holds the current decision (unique on
 * application_id).
 */

/** Load an application (with job) or throw 404. */
const loadApplicationOrThrow = async (applicationId: string) => {
  const application = await applicationRepository.findByIdWithJobAndJobseeker(applicationId);
  if (!application) throw AppError.notFound('Application not found');
  return application;
};

/** Assert the caller may make hiring decisions for the application's company. */
const assertCanDecide = async (
  user: IAuthUser,
  application: { job?: unknown },
): Promise<void> => {
  const job = application.job as { company_id?: string } | undefined;
  if (job?.company_id) {
    await assertCanMakeHiringDecisions(user, job.company_id);
    return;
  }
  if (!isPlatformAdmin(user)) {
    throw AppError.forbidden('You are not authorized to make hiring decisions');
  }
};

/**
 * Record the hiring decision for an application AND update the application
 * status in a single transaction.
 */
export const makeDecision = async (
  user: IAuthUser,
  applicationId: string,
  input: { outcome: HiringDecisionOutcome; notes?: string | null },
): Promise<IHiringDecision> => {
  const application = await loadApplicationOrThrow(applicationId);
  await assertCanDecide(user, application);

  const currentStatus = application.status;

  // Terminal applications can't be re-decided.
  if (APPLICATION_TERMINAL_STATUSES.includes(currentStatus)) {
    throw AppError.conflict(`Application is already ${currentStatus} and cannot be decided`);
  }

  const newStatus = DECISION_APPLICATION_STATUS[input.outcome];

  // Guard against deciding into the status it is already in.
  if (currentStatus === newStatus) {
    throw AppError.conflict(`Application is already ${newStatus}`);
  }

  const sequelize = getSequelize();
  const t = await sequelize.transaction();

  try {
    // 1. Upsert the single current decision (unique per application).
    const existing = await hiringDecisionRepository.findByApplication(applicationId);
    const now = new Date();
    let decision: IHiringDecision | null;

    if (existing) {
      decision = await hiringDecisionRepository.update(
        applicationId,
        { outcome: input.outcome, notes: input.notes ?? null, decided_by: user.id, decided_at: now },
        { transaction: t },
      );
    } else {
      const payload: IHiringDecisionCreation = {
        application_id: applicationId,
        decided_by: user.id,
        outcome: input.outcome,
        notes: input.notes ?? null,
        decided_at: now,
      };
      decision = await hiringDecisionRepository.create(payload, { transaction: t });
    }

    if (!decision) throw AppError.internal('Failed to record hiring decision');

    // 2. Move the application to the resulting status in the SAME txn.
    const updates: Partial<{ status: ApplicationStatus; withdrawn_at?: Date }> = {
      status: newStatus,
    };
    await applicationRepository.update(applicationId, updates, { transaction: t });

    // 3. Append the status-history row in the SAME txn.
    await applicationStatusHistoryRepository.create(
      {
        application_id: applicationId,
        old_status: currentStatus,
        new_status: newStatus,
        changed_by: user.id,
        reason: `Hiring decision: ${input.outcome}`,
      },
      { transaction: t },
    );

    await t.commit();

    // 4. Audit outside the txn (best-effort; preserves prior decision + status).
    await recordAuditForUser(user, {
      action: `HIRING_DECISION_${input.outcome}`,
      entity_type: 'APPLICATION',
      entity_id: applicationId,
      old_values: {
        status: currentStatus,
        previous_decision: existing?.outcome ?? null,
      },
      new_values: { status: newStatus, outcome: input.outcome, decision_id: decision.id },
    });

    return decision;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/** The current decision for an application (null if none yet). */
export const getDecision = async (
  user: IAuthUser,
  applicationId: string,
): Promise<IHiringDecision | null> => {
  const application = await loadApplicationOrThrow(applicationId);
  await assertCanDecide(user, application);
  return hiringDecisionRepository.findByApplication(applicationId);
};

export const hiringDecisionServices = {
  makeDecision,
  getDecision,
};

export default hiringDecisionServices;
