import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKeystoneLevelToCharacter1687193834584 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ajouter la colonne keystoneMinLevel avec DEFAULT 2
        await queryRunner.query(`
            ALTER TABLE "character" ADD "keystoneMinLevel" integer DEFAULT 2;
        `);

        // 2. Ajouter la colonne keystoneMaxLevel avec DEFAULT 99
        await queryRunner.query(`
            ALTER TABLE "character" ADD "keystoneMaxLevel" integer DEFAULT 99;
        `);

        // 3. Appliquer les contraintes NOT NULL sur les deux colonnes
        await queryRunner.query(`
            ALTER TABLE "character" ALTER COLUMN "keystoneMinLevel" SET NOT NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE "character" ALTER COLUMN "keystoneMaxLevel" SET NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer les colonnes keystoneMinLevel et keystoneMaxLevel
        await queryRunner.query(`
            ALTER TABLE "character" DROP COLUMN "keystoneMaxLevel";
        `);
        await queryRunner.query(`
            ALTER TABLE "character" DROP COLUMN "keystoneMinLevel";
        `);
    }
}
