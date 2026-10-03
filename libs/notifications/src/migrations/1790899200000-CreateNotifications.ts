import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1790899200000 implements MigrationInterface {
  name = 'CreateNotifications1790899200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`notifications\` (
        \`id\` varchar(36) NOT NULL,
        \`recipient\` varchar(255) NOT NULL,
        \`type\` enum('EMAIL') NOT NULL,
        \`subject\` varchar(255) NOT NULL,
        \`message\` text NOT NULL,
        \`status\` enum('PENDING', 'PROCESSING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`processed_at\` datetime(6) NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `notifications`');
  }
}
