import dataSource from './data-source';

export async function requireMigrations(migrateCommand: string): Promise<void> {
  await dataSource.initialize();

  try {
    const [history]: { table: string | null }[] = await dataSource.query(
      `SELECT to_regclass('public.migrations') AS "table"`,
    );
    if (!history.table) {
      throw new Error(
        `Database migration history is missing. Run ${migrateCommand} before starting the API.`,
      );
    }

    const hasPendingMigrations = await dataSource.showMigrations();

    if (hasPendingMigrations) {
      throw new Error(
        `Database has unapplied migrations. Run ${migrateCommand} before starting the API.`,
      );
    }
  } finally {
    await dataSource.destroy();
  }
}
