import { Sequelize, Options } from 'sequelize';
import { env } from './env';

/**
 * Sequelize singleton.
 *
 * One connection pool is shared across the whole process. The instance is
 * created lazily so importing config never has side effects (useful in tests).
 */
let instance: Sequelize | null = null;

const buildOptions = (): Options => ({
  dialect: 'postgres',
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.password,
  logging: env.db.logging ? console.log : false,
  define: {
    // We manage timestamps explicitly in migrations; keep Sequelize's defaults
    // aligned with our conventions.
    timestamps: true,
    underscored: true, // created_at / updated_at instead of createdAt / updatedAt
    paranoid: false,
    freezeTableName: true, // do not pluralize table names
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: env.db.ssl
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : {},
});

export const getSequelize = (): Sequelize => {
  if (!instance) {
    instance = new Sequelize(buildOptions());
  }
  return instance;
};

export const connection = async (): Promise<Sequelize> => {
  const sequelize = getSequelize();
  await sequelize.authenticate();
  return sequelize;
};

export const closeConnection = async (): Promise<void> => {
  if (instance) {
    await instance.close();
    instance = null;
  }
};

export { Sequelize };
