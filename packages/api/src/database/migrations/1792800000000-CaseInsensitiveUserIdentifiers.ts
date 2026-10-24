import { MigrationInterface, QueryRunner } from 'typeorm';

export class CaseInsensitiveUserIdentifiers1792800000000 implements MigrationInterface {
  name = 'CaseInsensitiveUserIdentifiers1792800000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" DROP CONSTRAINT "user_username_key";
      ALTER TABLE "user" DROP CONSTRAINT "user_email_key";
      CREATE UNIQUE INDEX "user_username_lower_uq" ON "user" (LOWER("username"));
      CREATE UNIQUE INDEX "user_email_lower_uq" ON "user" (LOWER("email"));
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD CONSTRAINT "user_username_key" UNIQUE ("username");
      ALTER TABLE "user" ADD CONSTRAINT "user_email_key" UNIQUE ("email");
      DROP INDEX "user_username_lower_uq";
      DROP INDEX "user_email_lower_uq";
    `);
  }
}
