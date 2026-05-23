import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.college.deleteMany();
  await prisma.college.createMany({
    data: [
      {
        name: "VJTI Mumbai",
        location: "Mumbai",
        fees: 85000,
        rating: 4.5,
        placements: "11 LPA Avg",
        description: "Premier engineering institute in Maharashtra.",
        courses: "CS, IT, EXTC,  Mechanical, Textile",
        highestPackage: "72 LPA",
        topRecruiters: "DE Shaw, JP Morgan, Oracle",
        facilities: "Hostel, Gymkhana, Labs",
        examCutoff: "MHT-CET Rank under 2000",
        image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",      },
      {
        name: "COEP Pune",
        location: "Pune",
        fees: 95000,
        rating: 4.4,
        placements: "10 LPA Avg",
        description: "Historic engineering college with strong placements.",
        courses: "CS, Mechanical, Electrical",
        highestPackage: "24 LPA",
        topRecruiters: "BNY, Bajaj, Barclays",
        facilities: "Hostel, Library, Sports",
        examCutoff: "MHT-CET Rank under 3000",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "IIT Bombay",
        location: "Mumbai",
        fees: 220000,
        rating: 4.9,
        placements: "26 LPA Avg",
        description: "Top-ranked engineering institute in India.",
        courses: "CS, Aerospace, Electrical",
        highestPackage: "2 CPA",
        topRecruiters: "Google, Microsoft, Amazon",
        facilities: "Hostel, Library, Sports Complex",
        examCutoff: "JEE Rank under 1000",
        image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop",
      }
    ],
  });

  console.log("Seed data inserted");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });