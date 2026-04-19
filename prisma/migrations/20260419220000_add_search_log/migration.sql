-- CreateTable
CREATE TABLE "search_queries" (
    "id" TEXT NOT NULL,
    "query" VARCHAR(200) NOT NULL,
    "normalizedQuery" VARCHAR(200) NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_queries_normalizedQuery_createdAt_idx" ON "search_queries"("normalizedQuery", "createdAt");

-- CreateIndex
CREATE INDEX "search_queries_createdAt_idx" ON "search_queries"("createdAt");
