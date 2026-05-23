import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.college.createMany({
    data: [
      {
        name: "VJTI Mumbai",
        location: "Mumbai",
        fees: 85000,
        rating: 4.5,
        placements: "18 LPA Avg",
        description: "Premier engineering institute in Maharashtra.",
        courses: "CS, IT, EXTC,  Mechanical, Textile",
        image: "https://images.unsplash.com/photo-1562774053-701939374585",
      },
      {
        name: "COEP Pune",
        location: "Pune",
        fees: 95000,
        rating: 4.4,
        placements: "16 LPA Avg",
        description: "Historic engineering college with strong placements.",
        courses: "CS, Mechanical, Electrical",
        image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1",
      },
      {
        name: "IIT Bombay",
        location: "Mumbai",
        fees: 220000,
        rating: 4.9,
        placements: "32 LPA Avg",
        description: "Top-ranked engineering institute in India.",
        courses: "CS, Aerospace, Electrical",
        image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
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