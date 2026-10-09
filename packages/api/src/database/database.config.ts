import 'dotenv/config';
import { join } from 'path';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export function getDatabaseOptions(): PostgresConnectionOptions {
  if (process.env.NODE_ENV === 'production') {
    return buildProdOptions();
  }

  return buildDevOptions();
}

function buildProdOptions(): PostgresConnectionOptions {
  return {
    ...buildBaseOptions(),
    synchronize: false,
    installExtensions: false,
  };
}

function buildDevOptions(): PostgresConnectionOptions {
  return {
    ...buildBaseOptions(),
    synchronize: true,
    installExtensions: true,
  };
}

function buildBaseOptions(): PostgresConnectionOptions {
  const required = [
    'DB_HOST',
    'DB_PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
  ];

  for (const name of required) {
    if (!process.env[name]?.trim()) {
      throw new Error(`${name} is required`);
    }
  }

  const port = Number(process.env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535');
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
    migrationsRun: false,
  };
}
