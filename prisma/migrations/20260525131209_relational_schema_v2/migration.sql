-- CreateEnum
CREATE TYPE "CollegeType" AS ENUM ('GOVT', 'PRIVATE', 'DEEMED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "type" "CollegeType" NOT NULL,
    "streams" TEXT[],
    "nirfRank" INTEGER,
    "established" INTEGER NOT NULL,
    "website" TEXT,
    "accreditation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseFee" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "annualFee" INTEGER NOT NULL,

    CONSTRAINT "CourseFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementStat" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "avgPackage" DOUBLE PRECISION NOT NULL,
    "maxPackage" DOUBLE PRECISION NOT NULL,
    "placementPct" DOUBLE PRECISION NOT NULL,
    "topRecruiters" TEXT[],

    CONSTRAINT "PlacementStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionCutoff" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "exam" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "cutoffValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AdmissionCutoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "batchYear" INTEGER NOT NULL,
    "stream" TEXT NOT NULL,
    "ratingOverall" DOUBLE PRECISION NOT NULL,
    "ratingPlacement" DOUBLE PRECISION NOT NULL,
    "ratingFaculty" DOUBLE PRECISION NOT NULL,
    "ratingInfra" DOUBLE PRECISION NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shortlist" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shortlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCollege" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCollege_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "College_slug_key" ON "College"("slug");

-- CreateIndex
CREATE INDEX "CourseFee_collegeId_idx" ON "CourseFee"("collegeId");

-- CreateIndex
CREATE INDEX "PlacementStat_collegeId_idx" ON "PlacementStat"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementStat_collegeId_year_key" ON "PlacementStat"("collegeId", "year");

-- CreateIndex
CREATE INDEX "AdmissionCutoff_collegeId_idx" ON "AdmissionCutoff"("collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionCutoff_collegeId_exam_year_category_key" ON "AdmissionCutoff"("collegeId", "exam", "year", "category");

-- CreateIndex
CREATE INDEX "Review_collegeId_status_idx" ON "Review"("collegeId", "status");

-- CreateIndex
CREATE INDEX "Shortlist_sessionId_idx" ON "Shortlist"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Shortlist_sessionId_collegeId_key" ON "Shortlist"("sessionId", "collegeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCollege_userId_collegeId_key" ON "SavedCollege"("userId", "collegeId");

-- AddForeignKey
ALTER TABLE "CourseFee" ADD CONSTRAINT "CourseFee_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementStat" ADD CONSTRAINT "PlacementStat_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionCutoff" ADD CONSTRAINT "AdmissionCutoff_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCollege" ADD CONSTRAINT "SavedCollege_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCollege" ADD CONSTRAINT "SavedCollege_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;
