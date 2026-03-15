-- CreateTable
CREATE TABLE "ArtistSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artistName" TEXT NOT NULL,
    "spotifyId" TEXT,
    "youtubeChannelId" TEXT,
    "imageUrl" TEXT,
    "spotifyFollowers" INTEGER,
    "spotifyPopularity" INTEGER,
    "youtubeSubscribers" INTEGER,
    "youtubeViews" TEXT,
    "instagramFollowers" INTEGER,
    "tiktokFollowers" INTEGER,
    "tiktokLikes" INTEGER,
    "facebookPageLikes" INTEGER,
    "snapshotAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ArtistShow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artistName" TEXT NOT NULL,
    "eventDate" DATETIME,
    "venueName" TEXT,
    "venueCity" TEXT,
    "venueCountry" TEXT,
    "showType" TEXT,
    "capacity" INTEGER,
    "source" TEXT,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "ArtistSnapshot_artistName_idx" ON "ArtistSnapshot"("artistName");

-- CreateIndex
CREATE INDEX "ArtistSnapshot_snapshotAt_idx" ON "ArtistSnapshot"("snapshotAt");

-- CreateIndex
CREATE INDEX "ArtistShow_artistName_idx" ON "ArtistShow"("artistName");
