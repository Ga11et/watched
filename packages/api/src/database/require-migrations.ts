import dataSource from './data-source';

export async function requireMigrations(): Promise<void> {
  await dataSource.initialize();

  try {
    const [history]: { table: string | null }[] = await dataSource.query(
      `SELECT to_regclass('public.migrations') AS "table"`,
    );
    if (!history.table) {
      throw new Error(
        'Database migration history is missing. Run pnpm prod:migrate before starting the production API.',
      );
    }

    const hasPendingMigrations = await dataSource.showMigrations();

    if (hasPendingMigrations) {
      throw new Error(
        'Database has unapplied migrations. Run pnpm prod:migrate before starting the production API.',
      );
    }
  } finally {
    await dataSource.destroy();
  }
}
