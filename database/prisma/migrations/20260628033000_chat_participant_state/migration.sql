-- CreateTable
CREATE TABLE "ChatParticipantState" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mutedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3),
    "lastDeliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatParticipantState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatParticipantState_matchId_userId_key" ON "ChatParticipantState"("matchId", "userId");

-- CreateIndex
CREATE INDEX "ChatParticipantState_userId_archivedAt_updatedAt_idx" ON "ChatParticipantState"("userId", "archivedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "Message_replyToId_idx" ON "Message"("replyToId");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipantState" ADD CONSTRAINT "ChatParticipantState_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParticipantState" ADD CONSTRAINT "ChatParticipantState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
