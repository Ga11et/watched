import { MigrationInterface, QueryRunner } from 'typeorm';
import { GUEST_USER_ID } from '../../users/users.types';

export class GuestAccount1793042069400 implements MigrationInterface {
  name = 'GuestAccount1793042069400';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "user" ("id", "username", "email", "passwordHash", "name", "role", "isActive")
       VALUES ($1, 'guest', NULL, '!', 'Гость', 'GUEST', true)`,
      [GUEST_USER_ID],
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "user" WHERE "id" = $1`, [
      GUEST_USER_ID,
    ]);
  }
}
