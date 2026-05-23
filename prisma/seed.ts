import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.college.deleteMany();

  await prisma.college.createMany({
    data: [
      {
        name: "IIT Bombay",
        location: "Mumbai",
        fees: 220000,
        rating: 4.9,
        placements: "26 LPA Avg",
        description:
          "India's premier engineering institution, IIT Bombay is consistently ranked among the top universities in Asia. Located on the scenic Powai campus, it offers world-class infrastructure, cutting-edge research labs, and unmatched industry connections.",
        courses: "CS, Electrical, Mechanical, Aerospace, Chemical, Civil",
        highestPackage: "2 CPA (International)",
        topRecruiters: "Google, Microsoft, Amazon, Goldman Sachs, McKinsey",
        facilities: "Hostel, Library, Olympic-size pool, Gymkhana, Research Labs",
        examCutoff: "JEE Advanced Rank under 100",
        image:
          "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "IIT Delhi",
        location: "Delhi",
        fees: 215000,
        rating: 4.8,
        placements: "24 LPA Avg",
        description:
          "IIT Delhi is one of the oldest and most prestigious engineering institutions in India, located in Hauz Khas, South Delhi. Renowned for its strong alumni network and proximity to India's capital city, it attracts top recruiters from across the globe.",
        courses: "CS, Electrical, Mechanical, Chemical, Civil, Textile",
        highestPackage: "1.5 CPA (International)",
        topRecruiters: "Flipkart, Adobe, Qualcomm, Intel, Boston Consulting Group",
        facilities: "Hostel, Library, Sports Complex, Innovation Lab",
        examCutoff: "JEE Advanced Rank under 200",
        image:
          "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "IIT Madras",
        location: "Chennai",
        fees: 210000,
        rating: 4.8,
        placements: "22 LPA Avg",
        description:
          "Nestled inside a lush forest in Chennai, IIT Madras is home to a thriving deer population and a world-class research ecosystem. It houses India's first IIT-affiliated startup incubator and is a hub for deep-tech innovation.",
        courses: "CS, Electrical, Mechanical, Aerospace, Naval Architecture",
        highestPackage: "1.2 CPA (International)",
        topRecruiters: "Samsung, Nvidia, Apple, Morgan Stanley, D.E. Shaw",
        facilities: "Hostel, Library, Research Parks, Sports Club",
        examCutoff: "JEE Advanced Rank under 300",
        image:
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "IIT Kharagpur",
        location: "Kharagpur",
        fees: 195000,
        rating: 4.7,
        placements: "20 LPA Avg",
        description:
          "The oldest and largest IIT, IIT Kharagpur sprawls over 2,100 acres with 22 academic departments. Its alumni include some of India's most celebrated engineers, entrepreneurs, and scientists.",
        courses: "CS, Electrical, Mechanical, Mining, Agricultural Engineering",
        highestPackage: "1.1 CPA (International)",
        topRecruiters: "Microsoft, Facebook, Oracle, Tata Consultancy Services",
        facilities: "Hostel, Hospitals, Cinema, Shopping Complex, Stadium",
        examCutoff: "JEE Advanced Rank under 500",
        image:
          "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "NIT Trichy",
        location: "Tiruchirappalli",
        fees: 155000,
        rating: 4.5,
        placements: "14 LPA Avg",
        description:
          "NIT Trichy is consistently ranked as the top NIT in India. Located in Tamil Nadu, it offers a rigorous academic environment with strong industry ties, especially in core engineering and IT sectors.",
        courses: "CS, ECE, Mechanical, Civil, Chemical, Production",
        highestPackage: "47 LPA",
        topRecruiters: "Infosys, Wipro, TCS, Zoho, PayPal",
        facilities: "Hostel, Library, Sports Ground, Seminar Halls",
        examCutoff: "JEE Mains Rank under 5000",
        image:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "NIT Warangal",
        location: "Warangal",
        fees: 148000,
        rating: 4.4,
        placements: "13 LPA Avg",
        description:
          "One of the oldest NITs in India, NIT Warangal is known for its disciplined academic culture and strong placements in core engineering. Located in Telangana, it maintains consistent placement records across CS and ECE.",
        courses: "CS, ECE, Mechanical, Civil, Biotechnology",
        highestPackage: "45 LPA",
        topRecruiters: "Samsung, Amazon, Deloitte, Cognizant, HSBC",
        facilities: "Hostel, Canteen, Sports Facilities, Labs",
        examCutoff: "JEE Mains Rank under 8000",
        image:
          "https://images.unsplash.com/photo-1568792923760-d70635a89fdc?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "VJTI Mumbai",
        location: "Mumbai",
        fees: 85000,
        rating: 4.5,
        placements: "11 LPA Avg",
        description:
          "Veermata Jijabai Technological Institute is one of the oldest and most respected engineering colleges in Maharashtra. Established in 1887, it offers state-funded education with strong placement outcomes in Mumbai's tech and finance ecosystem.",
        courses: "CS, IT, EXTC, Mechanical, Textile, Electronics",
        highestPackage: "72 LPA",
        topRecruiters: "DE Shaw, JP Morgan, Oracle, Barclays, Deutsche Bank",
        facilities: "Hostel, Gymkhana, Research Labs, Library",
        examCutoff: "MHT-CET Rank under 2000",
        image:
          "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "COEP Pune",
        location: "Pune",
        fees: 95000,
        rating: 4.4,
        placements: "10 LPA Avg",
        description:
          "College of Engineering Pune (COEP) is one of the oldest engineering institutes in Asia, established in 1854. It is a government-autonomous institute under Savitribai Phule Pune University with a strong reputation in engineering and technology.",
        courses: "CS, Mechanical, Electrical, Instrumentation, Civil",
        highestPackage: "24 LPA",
        topRecruiters: "BNY Mellon, Bajaj, Barclays, Cummins, KPIT",
        facilities: "Hostel, Library, Sports Ground, Design Studio",
        examCutoff: "MHT-CET Rank under 3000",
        image:
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "PICT Pune",
        location: "Pune",
        fees: 135000,
        rating: 4.1,
        placements: "8 LPA Avg",
        description:
          "Pune Institute of Computer Technology is a well-regarded autonomous institute affiliated with Savitribai Phule Pune University. Known primarily for its CS and IT programs, it maintains consistent placement records in Pune's IT industry.",
        courses: "CS, IT, ENTC, Mechanical",
        highestPackage: "18 LPA",
        topRecruiters: "Infosys, Persistent Systems, Tech Mahindra, Cognizant",
        facilities: "Library, Labs, Canteen, Sports Ground",
        examCutoff: "MHT-CET Rank under 8000",
        image:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "BITS Pilani",
        location: "Pilani",
        fees: 580000,
        rating: 4.7,
        placements: "19 LPA Avg",
        description:
          "BITS Pilani is India's leading private engineering university known for its unique dual-degree programs and Practice School (PS) industry internship model. It has a fiercely loyal and successful alumni network across Silicon Valley and India's startup ecosystem.",
        courses: "CS, Electronics, Mechanical, Chemical, Pharmacy, Economics",
        highestPackage: "1.1 CPA (International)",
        topRecruiters: "Google, Uber, Goldman Sachs, Ola, Razorpay",
        facilities: "Hostel, Medical Center, Shopping Complex, Stadium",
        examCutoff: "BITSAT Score above 350",
        image:
          "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "RVCE Bangalore",
        location: "Bangalore",
        fees: 175000,
        rating: 4.2,
        placements: "9 LPA Avg",
        description:
          "RV College of Engineering in Bangalore is one of Karnataka's top engineering institutions, affiliated with VTU. Its location in India's Silicon Valley gives students exceptional internship and placement opportunities in the tech industry.",
        courses: "CS, ECE, Mechanical, Civil, Biotechnology, ISE",
        highestPackage: "38 LPA",
        topRecruiters: "Amazon, Accenture, Wipro, Bosch, SAP Labs",
        facilities: "Hostel, Library, Innovation Center, Sports Complex",
        examCutoff: "KCET Rank under 5000",
        image:
          "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "PES University",
        location: "Bangalore",
        fees: 295000,
        rating: 4.0,
        placements: "8.5 LPA Avg",
        description:
          "PES University is a top-ranked private university in Bangalore, known for strong CS and ECE programs and a tight-knit alumni network in the Bangalore tech ecosystem. Its Ring Road campus houses excellent infrastructure.",
        courses: "CS, ECE, Mechanical, Civil, Biotechnology",
        highestPackage: "42 LPA",
        topRecruiters: "Microsoft, Flipkart, Oracle, Honeywell, Cisco",
        facilities: "Hostel, Library, Maker Space, Sports Courts",
        examCutoff: "KCET Rank under 10000 or Management Quota",
        image:
          "https://images.unsplash.com/photo-1568792923760-d70635a89fdc?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "DTU Delhi",
        location: "Delhi",
        fees: 175000,
        rating: 4.3,
        placements: "13 LPA Avg",
        description:
          "Delhi Technological University, formerly Delhi College of Engineering, is a state government university and one of Delhi's top engineering colleges. It benefits from its location in the national capital with access to top recruiters and startup ecosystems.",
        courses: "CS, ECE, Mechanical, Civil, Biotechnology, Environmental",
        highestPackage: "65 LPA",
        topRecruiters: "Samsung, Adobe, Amazon, Snapdeal, Zomato",
        facilities: "Hostel, Library, Robotics Lab, Sports Complex",
        examCutoff: "JEE Mains Rank under 15000",
        image:
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "NSIT Delhi",
        location: "Delhi",
        fees: 120000,
        rating: 4.2,
        placements: "12 LPA Avg",
        description:
          "Netaji Subhas University of Technology (formerly NSIT) is a Delhi government-funded university with a strong CS and ECE tradition. Its alumni include many successful tech entrepreneurs and engineers at top global firms.",
        courses: "CS, ECE, IT, Mechanical, Instrumentation",
        highestPackage: "52 LPA",
        topRecruiters: "Google, Microsoft, Paytm, Ola, Nykaa",
        facilities: "Hostel, Labs, Library, Sports Ground",
        examCutoff: "JEE Mains Rank under 20000",
        image:
          "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "VIT Vellore",
        location: "Vellore",
        fees: 320000,
        rating: 4.0,
        placements: "7.5 LPA Avg",
        description:
          "VIT University is one of India's largest private engineering universities with a massive campus, international collaborations, and a global student body. It is known for its VITEEE entrance exam and offers a wide range of engineering specializations.",
        courses: "CS, ECE, Mechanical, Biomedical, Chemical, Civil",
        highestPackage: "44 LPA",
        topRecruiters: "TCS, Infosys, Wipro, Cognizant, Capgemini",
        facilities: "Hostel, Shopping Mall, Hospital, Sports Stadium",
        examCutoff: "VITEEE Score above 100 or JEE Mains",
        image:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "SRM Chennai",
        location: "Chennai",
        fees: 295000,
        rating: 3.9,
        placements: "6.5 LPA Avg",
        description:
          "SRM Institute of Science and Technology is one of India's largest private universities with multiple campuses. Its Kattankulathur campus houses over 20,000 students and offers diverse engineering programs with industry-linked curriculum.",
        courses: "CS, ECE, Mechanical, Biomedical, IT, Civil",
        highestPackage: "36 LPA",
        topRecruiters: "TCS, Infosys, Wipro, CTS, Zoho",
        facilities: "Hostel, Hospital, Shopping Zone, Sports Complex",
        examCutoff: "SRMJEE Score above 80 or JEE Mains",
        image:
          "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "Jadavpur University",
        location: "Kolkata",
        fees: 25000,
        rating: 4.4,
        placements: "11 LPA Avg",
        description:
          "Jadavpur University is West Bengal's premier engineering institution and one of the most affordable and reputed government engineering colleges in India. Known for its strong academic culture, it punches well above its weight in research and placements.",
        courses: "CS, ECE, Mechanical, Electrical, Chemical, Civil",
        highestPackage: "55 LPA",
        topRecruiters: "TCS, Wipro, IBM, Tata Motors, Larsen & Toubro",
        facilities: "Hostel, Library, Research Centers, Sports Ground",
        examCutoff: "WBJEE Rank under 1000",
        image:
          "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop",
      },
      {
        name: "IIEST Shibpur",
        location: "Kolkata",
        fees: 55000,
        rating: 4.1,
        placements: "9 LPA Avg",
        description:
          "Indian Institute of Engineering Science and Technology, Shibpur is one of the oldest technical institutions in Asia, established in 1856. A government-funded institute, it provides quality engineering education with an emphasis on core engineering disciplines.",
        courses: "CS, ECE, Mechanical, Civil, Mining, Printing",
        highestPackage: "28 LPA",
        topRecruiters: "Tata Steel, L&T, Wipro, Infosys, SAIL",
        facilities: "Hostel, Library, Sports Ground, Workshops",
        examCutoff: "WBJEE Rank under 3000 or JEE Mains",
        image:
          "https://images.unsplash.com/photo-1568792923760-d70635a89fdc?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  });

  console.log("✅ Seed data inserted: 18 colleges");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });