import Role from '../models/roleModel';
import { IRole } from '../interfaces';
import { RoleName } from '../enums';
import { plain } from '../utils';

/** Data-access layer for the `roles` table. */
class RoleRepository {
  async findByName(name: RoleName): Promise<IRole | null> {
    const role = await Role.findOne({ where: { name } });
    return role ? (plain(role) as IRole) : null;
  }

  async findById(id: string): Promise<IRole | null> {
    const role = await Role.findByPk(id);
    return role ? (plain(role) as IRole) : null;
  }

  async findAll(): Promise<IRole[]> {
    const roles = await Role.findAll({ order: [['name', 'ASC']] });
    return plain<IRole[]>(roles as unknown as Record<string, unknown>[]);
  }

  async findByIds(ids: string[]): Promise<IRole[]> {
    const roles = await Role.findAll({ where: { id: ids } });
    return plain<IRole[]>(roles as unknown as Record<string, unknown>[]);
  }

  async create(name: RoleName, description?: string): Promise<IRole> {
    const role = await Role.create({ name, description: description ?? null });
    return plain(role) as IRole;
  }
}

export default new RoleRepository();
