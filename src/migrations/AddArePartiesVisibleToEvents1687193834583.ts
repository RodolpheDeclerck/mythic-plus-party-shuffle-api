import { MigrationInterface, QueryRunner } from "typeorm";

export class AddArePartiesVisibleToEvents1687193834583 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ajouter la colonne avec DEFAULT false
        await queryRunner.query(`
            ALTER TABLE "events" ADD "arePartiesVisible" boolean DEFAULT false;
        `);

        // 2. Mettre à jour les lignes existantes à true
        await queryRunner.query(`
            UPDATE "events" SET "arePartiesVisible" = true;
        `);

        // 3. Appliquer la contrainte NOT NULL
        await queryRunner.query(`
            ALTER TABLE "events" ALTER COLUMN "arePartiesVisible" SET NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer la colonne
        await queryRunner.query(`
            ALTER TABLE "events" DROP COLUMN "arePartiesVisible";
        `);
    }
}
