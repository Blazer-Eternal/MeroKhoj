import { Op } from 'sequelize';
import User from '../../models/user/userModel';
import Role from '../../models/administration/roleModel';
import { IUser, IUserCreation, IUserPublic } from '../../interfaces';
import { UserStatus, RoleName } from '../../enums';
import { plain, IPaginationParams, buildPaginationMeta } from '../../utils';

/**
 * Data-access layer for `users` and `user_roles`.
 *
 * Repositories contain no business rules — only queries. Orchestration and
 * validation live in the service layer.
 */
class UserRepository {
  /** Fetch a user including the password hash (for login only). */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    const user = await User.scope('withPassword').findOne({
      where: { email: email.toLowerCase() },
    });
    return user ? (plain(user) as IUser) : null;
  }

  /** Fetch a user by id (never includes password hash). */
  async findById(id: string): Promise<IUser | null> {
    const user = await User.findByPk(id);
    return user ? (plain(user) as IUser) : null;
  }

  /** Fetch a user by id together with its roles. */
  async findByIdWithRoles(id: string): Promise<(IUser & { roles: RoleName[] }) | null> {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'roles', attributes: ['name'] }],
    });
    if (!user) return null;
    const data = plain(user) as unknown as IUser & { roles: RoleName[] };
    data.roles = Array.isArray(user.roles)
      ? (user.roles as unknown as Role[]).map((r) => r.name)
      : [];
    return data;
  }

  /** Create a new user account. */
  async create(payload: IUserCreation): Promise<IUser> {
    const user = await User.create({
      ...payload,
      email: payload.email.toLowerCase(),
    });
    return plain(user) as IUser;
  }

  /** Update a user's mutable fields. */
  async update(id: string, payload: Partial<IUser>): Promise<IUser | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update(payload);
    return plain(user) as IUser;
  }

  /** Stamp last_login_at on successful authentication. */
  async updateLastLogin(id: string): Promise<void> {
    await User.update({ last_login_at: new Date() }, { where: { id } });
  }

  /** Check whether an email is already registered. */
  async emailExists(email: string): Promise<boolean> {
    const count = await User.count({ where: { email: email.toLowerCase() } });
    return count > 0;
  }

  /** Check whether a phone number is already registered. */
  async phoneExists(phone: string): Promise<boolean> {
    const count = await User.count({ where: { phone } });
    return count > 0;
  }

  /** Set the account status (e.g. suspend / deactivate). */
  async setStatus(id: string, status: UserStatus): Promise<void> {
    await User.update({ status }, { where: { id } });
  }

  // ---- Role assignment ------------------------------------------------

  /** Attach a role to a user (idempotent thanks to the unique constraint). */
  async addRole(userId: string, roleName: RoleName): Promise<void> {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) throw new Error(`Role ${roleName} not found — was it seeded?`);
    const user = await User.findByPk(userId);
    if (user) {
      await (user as unknown as { addRole: (r: Role, o: unknown) => Promise<void> }).addRole(role, {
        through: { created_at: new Date() },
      });
    }
  }

  /** Remove a role from a user. */
  async removeRole(userId: string, roleName: RoleName): Promise<void> {
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) return;
    const user = await User.findByPk(userId);
    if (user) {
      await (user as unknown as { removeRole: (r: Role) => Promise<void> }).removeRole(role);
    }
  }

  /** List a user's role names. */
  async getRoleNames(userId: string): Promise<RoleName[]> {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'roles', attributes: ['name'] }],
    });
    if (!user || !Array.isArray(user.roles)) return [];
    return (user.roles as unknown as Role[]).map((r) => r.name);
  }

  /** Public projection — safe to return over the API. */
  toPublic(user: IUser): IUserPublic {
    const clone: Record<string, unknown> = {
      ...(user as unknown as Record<string, unknown>),
    };
    delete clone.password_hash;
    return clone as unknown as IUserPublic;
  }

  /**
   * Admin: paginated account directory with role names attached.
   * `q` matches email / first / last name; `role` narrows to holders of one
   * role (required include filters the parent rows to matching users).
   */
  async listForAdmin(
    filters: { q?: string; role?: RoleName; status?: UserStatus },
    pagination: IPaginationParams,
  ): Promise<{
    data: Array<IUserPublic & { roles: RoleName[] }>;
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const where: Record<string, unknown> = {};
    if (filters.q) {
      const term = `%${filters.q}%`;
      where[Op.or as unknown as string] = [
        { email: { [Op.iLike]: term } },
        { first_name: { [Op.iLike]: term } },
        { last_name: { [Op.iLike]: term } },
      ];
    }
    if (filters.status) where.status = filters.status;

    const { rows, count } = await User.findAndCountAll({
      where,
      distinct: true,
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['name'],
          required: Boolean(filters.role),
          ...(filters.role ? { where: { name: filters.role } } : {}),
        },
      ],
      order: [['created_at', 'DESC']],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const data = rows.map((row) => {
      const user = plain(row) as unknown as IUser & { roles?: Role[] };
      const roles = Array.isArray(user.roles)
        ? user.roles.map((r) => r.name as RoleName)
        : [];
      delete user.roles;
      return { ...this.toPublic(user), roles };
    });

    return { data, meta: buildPaginationMeta(count, pagination.page, pagination.perPage) };
  }
}

export default new UserRepository();
