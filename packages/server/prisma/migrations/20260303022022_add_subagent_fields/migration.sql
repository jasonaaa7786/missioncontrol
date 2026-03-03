-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workspace" TEXT NOT NULL,
    "agentDir" TEXT,
    "model" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSubagent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "soulContent" TEXT,
    "parentAgentId" TEXT,
    "projectIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Agent" ("agentDir", "createdAt", "id", "isActive", "model", "name", "updatedAt", "workspace") SELECT "agentDir", "createdAt", "id", "isActive", "model", "name", "updatedAt", "workspace" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
CREATE INDEX "Agent_isActive_idx" ON "Agent"("isActive");
CREATE INDEX "Agent_isSubagent_idx" ON "Agent"("isSubagent");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
