/*
  Warnings:

  - Changed the type of `theme` on the `activities` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- Créer la table Sports
CREATE TABLE "sports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "themes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sports_name_key" ON "sports"("name");

-- Insérer le sport Ultimate Frisbee par défaut avec ses thèmes
INSERT INTO "sports" ("id", "name", "description", "themes", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'Ultimate Frisbee',
    'Sport collectif avec un frisbee',
    ARRAY['COMPETITION', 'STRENGTH_TRAINING', 'POSITIONING', 'THROWING', 'CATCHING', 'STRATEGY', 'ENDURANCE', 'TECHNIQUE', 'WARM_UP', 'COOL_DOWN'],
    NOW(),
    NOW()
);

-- Ajouter les colonnes sportId (optionnelles pour l'instant)
ALTER TABLE "groups" ADD COLUMN "sportId" TEXT;
ALTER TABLE "sessions" ADD COLUMN "sportId" TEXT;

-- Convertir l'enum ActivityTheme en TEXT en préservant les données
ALTER TABLE "activities" 
  ALTER COLUMN "theme" TYPE TEXT USING "theme"::TEXT;

-- Supprimer l'ancien enum
DROP TYPE "ActivityTheme";

-- Ajouter les foreign keys
ALTER TABLE "groups" ADD CONSTRAINT "groups_sportId_fkey" 
  FOREIGN KEY ("sportId") REFERENCES "sports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_sportId_fkey" 
  FOREIGN KEY ("sportId") REFERENCES "sports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
