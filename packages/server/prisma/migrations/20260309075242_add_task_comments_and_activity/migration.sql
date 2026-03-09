-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "agentId" TEXT,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "mentions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "agentId" TEXT,
    "taskId" TEXT,
    "projectId" TEXT,
    "message" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inbox',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assignedAgent" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "position" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assignedAgent", "completedAt", "createdAt", "description", "dueAt", "id", "position", "priority", "projectId", "status", "title", "updatedAt") SELECT "assignedAgent", "completedAt", "createdAt", "description", "dueAt", "id", "position", "priority", "projectId", "status", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_assignedAgent_idx" ON "Task"("assignedAgent");
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "TaskComment_taskId_createdAt_idx" ON "TaskComment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_agentId_idx" ON "Activity"("agentId");

-- CreateIndex
CREATE INDEX "Activity_taskId_idx" ON "Activity"("taskId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");
