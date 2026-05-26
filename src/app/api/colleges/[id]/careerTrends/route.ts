// app/api/colleges/[id]/career-trends/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Static recruiter intelligence map
const RECRUITER_INTELLIGENCE: Record<
  string,
  {
    industry: string;
    avgSalaryMin: number;
    avgSalaryMax: number;
    growth: "High Growth" | "Stable" | "Declining";
  }
> = {
  // Tech Giants
  Google: {
    industry: "Technology",
    avgSalaryMin: 1500000,
    avgSalaryMax: 3500000,
    growth: "High Growth",
  },
  Microsoft: {
    industry: "Technology",
    avgSalaryMin: 1200000,
    avgSalaryMax: 3000000,
    growth: "High Growth",
  },
  Amazon: {
    industry: "Technology",
    avgSalaryMin: 1400000,
    avgSalaryMax: 3200000,
    growth: "High Growth",
  },
  Meta: {
    industry: "Technology",
    avgSalaryMin: 1600000,
    avgSalaryMax: 3800000,
    growth: "High Growth",
  },
  Apple: {
    industry: "Technology",
    avgSalaryMin: 1300000,
    avgSalaryMax: 3000000,
    growth: "Stable",
  },

  // Finance & Banking
  Goldman: {
    industry: "Finance",
    avgSalaryMin: 1000000,
    avgSalaryMax: 2500000,
    growth: "Stable",
  },
  JPMorgan: {
    industry: "Finance",
    avgSalaryMin: 900000,
    avgSalaryMax: 2200000,
    growth: "Stable",
  },
  McKinsey: {
    industry: "Consulting",
    avgSalaryMin: 1100000,
    avgSalaryMax: 2400000,
    growth: "Stable",
  },
  BCG: {
    industry: "Consulting",
    avgSalaryMin: 1050000,
    avgSalaryMax: 2300000,
    growth: "Stable",
  },

  // IT Services (High volume in India)
  TCS: {
    industry: "IT Services",
    avgSalaryMin: 400000,
    avgSalaryMax: 800000,
    growth: "Stable",
  },
  Infosys: {
    industry: "IT Services",
    avgSalaryMin: 380000,
    avgSalaryMax: 750000,
    growth: "Stable",
  },
  Wipro: {
    industry: "IT Services",
    avgSalaryMin: 360000,
    avgSalaryMax: 700000,
    growth: "Stable",
  },
  "HCL Technologies": {
    industry: "IT Services",
    avgSalaryMin: 350000,
    avgSalaryMax: 680000,
    growth: "Stable",
  },

  // Startups / High Growth
  Flipkart: {
    industry: "E-Commerce",
    avgSalaryMin: 700000,
    avgSalaryMax: 1800000,
    growth: "High Growth",
  },
  OYO: {
    industry: "Travel Tech",
    avgSalaryMin: 500000,
    avgSalaryMax: 1500000,
    growth: "High Growth",
  },
  Paytm: {
    industry: "FinTech",
    avgSalaryMin: 600000,
    avgSalaryMax: 1600000,
    growth: "High Growth",
  },

  // Manufacturing / Hardware
  Samsung: {
    industry: "Electronics",
    avgSalaryMin: 500000,
    avgSalaryMax: 1200000,
    growth: "Stable",
  },
  Siemens: {
    industry: "Industrial",
    avgSalaryMin: 450000,
    avgSalaryMax: 1000000,
    growth: "Stable",
  },
};

interface RoleCluster {
  title: string;
  count: number;
  avgSalary: number;
}

interface SalaryBand {
  min: number;
  max: number;
  count: number;
}

interface CareerTrendResponse {
  collegeId: string;
  collegeName: string;
  placementYear: number;
  topRecruiters: Array<{
    name: string;
    industry: string;
    salaryRange: {
      min: number;
      max: number;
    };
    growth: string;
  }>;
  roleClusters: RoleCluster[];
  salaryBands: SalaryBand[];
  growthDistribution: {
    highGrowth: number;
    stable: number;
    declining: number;
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find college by id or slug
    const college = await prisma.college.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true, name: true },
    });

    if (!college) {
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      );
    }

    // Get latest placement stats with recruiters
    const placementStats = await prisma.placementStat.findFirst({
      where: { collegeId: college.id },
      orderBy: { year: "desc" },
    });

    if (!placementStats || !placementStats.topRecruiters || placementStats.topRecruiters.length === 0) {
      return NextResponse.json(
        {
          error: "No placement data available for this college",
        },
        { status: 404 }
      );
    }

    const recruiters = placementStats.topRecruiters as string[];
    const enrichedRecruiters = recruiters
      .slice(0, 10) // Top 10
      .map((name) => ({
        name,
        ...(RECRUITER_INTELLIGENCE[name] || {
          industry: "Other",
          avgSalaryMin: 500000,
          avgSalaryMax: 1200000,
          growth: "Stable" as const,
        }),
      }));

    // Build role clusters (mock data - in real scenario would extract from placement data)
    const roleClusters: RoleCluster[] = [
      { title: "Software Engineer", count: 245, avgSalary: 1200000 },
      { title: "Product Manager", count: 87, avgSalary: 1500000 },
      { title: "Data Analyst", count: 156, avgSalary: 1100000 },
      { title: "Business Analyst", count: 124, avgSalary: 900000 },
      { title: "DevOps Engineer", count: 98, avgSalary: 1400000 },
    ];

    // Build salary bands
    const salaryBands: SalaryBand[] = [
      { min: 300000, max: 500000, count: 125 },
      { min: 500000, max: 800000, count: 287 },
      { min: 800000, max: 1200000, count: 456 },
      { min: 1200000, max: 1800000, count: 234 },
      { min: 1800000, max: 3000000, count: 98 },
    ];

    // Calculate growth distribution
    const growthCounts = enrichedRecruiters.reduce(
      (acc, r) => {
        if (r.growth === "High Growth") acc.highGrowth++;
        else if (r.growth === "Declining") acc.declining++;
        else acc.stable++;
        return acc;
      },
      { highGrowth: 0, stable: 0, declining: 0 }
    );

    const response: CareerTrendResponse = {
      collegeId: college.id,
      collegeName: college.name,
      placementYear: placementStats.year,
      topRecruiters: enrichedRecruiters.map((r) => ({
        name:        r.name,
        industry:    r.industry,
        salaryRange: { min: r.avgSalaryMin, max: r.avgSalaryMax },
        growth:      r.growth,
      })),
      roleClusters,
      salaryBands,
      growthDistribution: {
        highGrowth: growthCounts.highGrowth,
        stable: growthCounts.stable,
        declining: growthCounts.declining,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/colleges/[id]/career-trends]", error);
    return NextResponse.json(
      { error: "Failed to fetch career trends" },
      { status: 500 }
    );
  }
}