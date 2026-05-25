import { PrismaClient, CollegeType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Wipe existing data in dependency order
  await prisma.savedCollege.deleteMany();
  await prisma.shortlist.deleteMany();
  await prisma.review.deleteMany();
  await prisma.admissionCutoff.deleteMany();
  await prisma.placementStat.deleteMany();
  await prisma.courseFee.deleteMany();
  await prisma.college.deleteMany();

  // ─── College Data ───────────────────────────────────────────────────────────

  type CollegeSeed = {
    slug: string;
    name: string;
    city: string;
    state: string;
    type: CollegeType;
    streams: string[];
    nirfRank: number | null;
    established: number;
    website: string;
    accreditation: string;
    courses: { course: string; degree: string; annualFee: number }[];
    placements: { year: number; avgPackage: number; maxPackage: number; placementPct: number; topRecruiters: string[] }[];
    cutoffs: { exam: string; year: number; category: string; cutoffValue: number }[];
  };

  const colleges: CollegeSeed[] = [
    {
      slug: "iit-bombay",
      name: "IIT Bombay",
      city: "Mumbai",
      state: "Maharashtra",
      type: CollegeType.GOVT,
      streams: ["Engineering", "Sciences", "Management"],
      nirfRank: 3,
      established: 1958,
      website: "https://www.iitb.ac.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 220000 },
        { course: "Electrical Engineering", degree: "B.Tech", annualFee: 220000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 220000 },
        { course: "Aerospace Engineering", degree: "B.Tech", annualFee: 220000 },
        { course: "Chemical Engineering", degree: "B.Tech", annualFee: 220000 },
      ],
      placements: [
        { year: 2024, avgPackage: 27.5, maxPackage: 210, placementPct: 95, topRecruiters: ["Google", "Microsoft", "Amazon", "Goldman Sachs", "McKinsey", "Apple"] },
        { year: 2023, avgPackage: 25.8, maxPackage: 195, placementPct: 94, topRecruiters: ["Google", "Uber", "Flipkart", "D.E. Shaw", "Two Sigma"] },
        { year: 2022, avgPackage: 23.1, maxPackage: 180, placementPct: 93, topRecruiters: ["Microsoft", "Amazon", "Morgan Stanley", "Qualcomm", "DE Shaw"] },
      ],
      cutoffs: [
        { exam: "JEE Advanced", year: 2024, category: "General", cutoffValue: 67 },
        { exam: "JEE Advanced", year: 2024, category: "OBC", cutoffValue: 212 },
        { exam: "JEE Advanced", year: 2024, category: "SC", cutoffValue: 621 },
        { exam: "JEE Advanced", year: 2023, category: "General", cutoffValue: 54 },
        { exam: "JEE Advanced", year: 2023, category: "OBC", cutoffValue: 178 },
        { exam: "JEE Advanced", year: 2022, category: "General", cutoffValue: 80 },
      ],
    },
    {
      slug: "iit-delhi",
      name: "IIT Delhi",
      city: "Delhi",
      state: "Delhi",
      type: CollegeType.GOVT,
      streams: ["Engineering", "Sciences", "Management"],
      nirfRank: 2,
      established: 1961,
      website: "https://home.iitd.ac.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 215000 },
        { course: "Electrical Engineering", degree: "B.Tech", annualFee: 215000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 215000 },
        { course: "Chemical Engineering", degree: "B.Tech", annualFee: 215000 },
      ],
      placements: [
        { year: 2024, avgPackage: 26.2, maxPackage: 200, placementPct: 94, topRecruiters: ["Flipkart", "Adobe", "Qualcomm", "Intel", "BCG", "Google"] },
        { year: 2023, avgPackage: 24.0, maxPackage: 180, placementPct: 93, topRecruiters: ["Amazon", "Microsoft", "Goldman Sachs", "Samsung", "Nvidia"] },
        { year: 2022, avgPackage: 21.5, maxPackage: 160, placementPct: 92, topRecruiters: ["Google", "Morgan Stanley", "Apple", "Adobe", "Walmart"] },
      ],
      cutoffs: [
        { exam: "JEE Advanced", year: 2024, category: "General", cutoffValue: 118 },
        { exam: "JEE Advanced", year: 2024, category: "OBC", cutoffValue: 350 },
        { exam: "JEE Advanced", year: 2024, category: "SC", cutoffValue: 890 },
        { exam: "JEE Advanced", year: 2023, category: "General", cutoffValue: 98 },
        { exam: "JEE Advanced", year: 2022, category: "General", cutoffValue: 135 },
      ],
    },
    {
      slug: "iit-madras",
      name: "IIT Madras",
      city: "Chennai",
      state: "Tamil Nadu",
      type: CollegeType.GOVT,
      streams: ["Engineering", "Sciences"],
      nirfRank: 1,
      established: 1959,
      website: "https://www.iitm.ac.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 210000 },
        { course: "Electrical Engineering", degree: "B.Tech", annualFee: 210000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 210000 },
        { course: "Aerospace Engineering", degree: "B.Tech", annualFee: 210000 },
      ],
      placements: [
        { year: 2024, avgPackage: 24.5, maxPackage: 190, placementPct: 94, topRecruiters: ["Samsung", "Nvidia", "Apple", "Morgan Stanley", "D.E. Shaw"] },
        { year: 2023, avgPackage: 22.8, maxPackage: 175, placementPct: 93, topRecruiters: ["Google", "Microsoft", "Amazon", "Qualcomm", "Two Sigma"] },
        { year: 2022, avgPackage: 20.2, maxPackage: 158, placementPct: 91, topRecruiters: ["Adobe", "Intel", "Flipkart", "Goldman Sachs", "Walmart"] },
      ],
      cutoffs: [
        { exam: "JEE Advanced", year: 2024, category: "General", cutoffValue: 145 },
        { exam: "JEE Advanced", year: 2024, category: "OBC", cutoffValue: 420 },
        { exam: "JEE Advanced", year: 2023, category: "General", cutoffValue: 130 },
        { exam: "JEE Advanced", year: 2022, category: "General", cutoffValue: 155 },
      ],
    },
    {
      slug: "iit-kharagpur",
      name: "IIT Kharagpur",
      city: "Kharagpur",
      state: "West Bengal",
      type: CollegeType.GOVT,
      streams: ["Engineering", "Sciences", "Law", "Management"],
      nirfRank: 5,
      established: 1951,
      website: "https://www.iitkgp.ac.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 195000 },
        { course: "Electrical Engineering", degree: "B.Tech", annualFee: 195000 },
        { course: "Mining Engineering", degree: "B.Tech", annualFee: 195000 },
        { course: "Agricultural Engineering", degree: "B.Tech", annualFee: 195000 },
      ],
      placements: [
        { year: 2024, avgPackage: 21.0, maxPackage: 175, placementPct: 90, topRecruiters: ["Microsoft", "Facebook", "Oracle", "TCS", "L&T"] },
        { year: 2023, avgPackage: 19.5, maxPackage: 158, placementPct: 89, topRecruiters: ["Amazon", "Google", "ISRO", "Infosys", "Honeywell"] },
        { year: 2022, avgPackage: 17.8, maxPackage: 142, placementPct: 88, topRecruiters: ["Samsung", "Qualcomm", "IBM", "Wipro", "Deloitte"] },
      ],
      cutoffs: [
        { exam: "JEE Advanced", year: 2024, category: "General", cutoffValue: 420 },
        { exam: "JEE Advanced", year: 2024, category: "OBC", cutoffValue: 890 },
        { exam: "JEE Advanced", year: 2023, category: "General", cutoffValue: 390 },
        { exam: "JEE Advanced", year: 2022, category: "General", cutoffValue: 450 },
      ],
    },
    {
      slug: "nit-trichy",
      name: "NIT Trichy",
      city: "Tiruchirappalli",
      state: "Tamil Nadu",
      type: CollegeType.GOVT,
      streams: ["Engineering"],
      nirfRank: 8,
      established: 1964,
      website: "https://www.nitt.edu",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 155000 },
        { course: "Electronics & Communication Engineering", degree: "B.Tech", annualFee: 155000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 155000 },
        { course: "Civil Engineering", degree: "B.Tech", annualFee: 155000 },
        { course: "Chemical Engineering", degree: "B.Tech", annualFee: 155000 },
      ],
      placements: [
        { year: 2024, avgPackage: 15.2, maxPackage: 52, placementPct: 87, topRecruiters: ["Zoho", "PayPal", "Infosys", "Wipro", "TCS"] },
        { year: 2023, avgPackage: 14.1, maxPackage: 47, placementPct: 86, topRecruiters: ["Amazon", "Samsung", "Cognizant", "Deloitte", "HCL"] },
        { year: 2022, avgPackage: 12.8, maxPackage: 44, placementPct: 85, topRecruiters: ["TCS", "Infosys", "Wipro", "L&T", "BHEL"] },
      ],
      cutoffs: [
        { exam: "JEE Mains", year: 2024, category: "General", cutoffValue: 4820 },
        { exam: "JEE Mains", year: 2024, category: "OBC", cutoffValue: 12500 },
        { exam: "JEE Mains", year: 2024, category: "SC", cutoffValue: 28000 },
        { exam: "JEE Mains", year: 2023, category: "General", cutoffValue: 4500 },
        { exam: "JEE Mains", year: 2022, category: "General", cutoffValue: 5100 },
      ],
    },
    {
      slug: "nit-warangal",
      name: "NIT Warangal",
      city: "Warangal",
      state: "Telangana",
      type: CollegeType.GOVT,
      streams: ["Engineering"],
      nirfRank: 26,
      established: 1959,
      website: "https://www.nitw.ac.in",
      accreditation: "NAAC A",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 148000 },
        { course: "Electronics & Communication Engineering", degree: "B.Tech", annualFee: 148000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 148000 },
        { course: "Biotechnology", degree: "B.Tech", annualFee: 148000 },
      ],
      placements: [
        { year: 2024, avgPackage: 14.0, maxPackage: 48, placementPct: 85, topRecruiters: ["Amazon", "Deloitte", "Cognizant", "HSBC", "Samsung"] },
        { year: 2023, avgPackage: 12.8, maxPackage: 45, placementPct: 84, topRecruiters: ["Microsoft", "Infosys", "Wipro", "TCS", "Capgemini"] },
        { year: 2022, avgPackage: 11.5, maxPackage: 40, placementPct: 82, topRecruiters: ["TCS", "Wipro", "HCL", "L&T", "DRDO"] },
      ],
      cutoffs: [
        { exam: "JEE Mains", year: 2024, category: "General", cutoffValue: 7800 },
        { exam: "JEE Mains", year: 2024, category: "OBC", cutoffValue: 18500 },
        { exam: "JEE Mains", year: 2023, category: "General", cutoffValue: 7200 },
        { exam: "JEE Mains", year: 2022, category: "General", cutoffValue: 8400 },
      ],
    },
    {
      slug: "bits-pilani",
      name: "BITS Pilani",
      city: "Pilani",
      state: "Rajasthan",
      type: CollegeType.DEEMED,
      streams: ["Engineering", "Sciences"],
      nirfRank: 24,
      established: 1964,
      website: "https://www.bits-pilani.ac.in",
      accreditation: "NAAC A",
      courses: [
        { course: "Computer Science", degree: "B.E.", annualFee: 580000 },
        { course: "Electronics & Instrumentation", degree: "B.E.", annualFee: 580000 },
        { course: "Mechanical Engineering", degree: "B.E.", annualFee: 580000 },
        { course: "Chemical Engineering", degree: "B.E.", annualFee: 580000 },
        { course: "Economics", degree: "B.Sc.", annualFee: 500000 },
      ],
      placements: [
        { year: 2024, avgPackage: 21.5, maxPackage: 115, placementPct: 92, topRecruiters: ["Google", "Uber", "Goldman Sachs", "Ola", "Razorpay"] },
        { year: 2023, avgPackage: 19.8, maxPackage: 105, placementPct: 91, topRecruiters: ["Microsoft", "Amazon", "JPMorgan", "Flipkart", "Sprinklr"] },
        { year: 2022, avgPackage: 17.2, maxPackage: 95, placementPct: 90, topRecruiters: ["Adobe", "Qualcomm", "Samsung", "Walmart", "Nutanix"] },
      ],
      cutoffs: [
        { exam: "BITSAT", year: 2024, category: "General", cutoffValue: 363 },
        { exam: "BITSAT", year: 2023, category: "General", cutoffValue: 355 },
        { exam: "BITSAT", year: 2022, category: "General", cutoffValue: 348 },
      ],
    },
    {
      slug: "vjti-mumbai",
      name: "VJTI Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      type: CollegeType.GOVT,
      streams: ["Engineering"],
      nirfRank: 43,
      established: 1887,
      website: "https://vjti.ac.in",
      accreditation: "NAAC A+",
      courses: [
        { course: "Computer Engineering", degree: "B.Tech", annualFee: 85000 },
        { course: "Information Technology", degree: "B.Tech", annualFee: 85000 },
        { course: "Electronics & Telecommunication", degree: "B.Tech", annualFee: 85000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 85000 },
      ],
      placements: [
        { year: 2024, avgPackage: 12.5, maxPackage: 75, placementPct: 84, topRecruiters: ["DE Shaw", "JP Morgan", "Oracle", "Barclays", "Deutsche Bank"] },
        { year: 2023, avgPackage: 11.2, maxPackage: 72, placementPct: 83, topRecruiters: ["Goldman Sachs", "Citi", "Amazon", "Accenture", "Capgemini"] },
        { year: 2022, avgPackage: 9.8, maxPackage: 60, placementPct: 81, topRecruiters: ["TCS", "Infosys", "Wipro", "L&T", "TATA"] },
      ],
      cutoffs: [
        { exam: "MHT-CET", year: 2024, category: "General", cutoffValue: 1850 },
        { exam: "MHT-CET", year: 2024, category: "OBC", cutoffValue: 4200 },
        { exam: "MHT-CET", year: 2023, category: "General", cutoffValue: 1700 },
        { exam: "MHT-CET", year: 2022, category: "General", cutoffValue: 2100 },
      ],
    },
    {
      slug: "coep-pune",
      name: "COEP Pune",
      city: "Pune",
      state: "Maharashtra",
      type: CollegeType.GOVT,
      streams: ["Engineering"],
      nirfRank: 52,
      established: 1854,
      website: "https://www.coep.org.in",
      accreditation: "NAAC A+",
      courses: [
        { course: "Computer Engineering", degree: "B.Tech", annualFee: 95000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 95000 },
        { course: "Electrical Engineering", degree: "B.Tech", annualFee: 95000 },
        { course: "Instrumentation & Control", degree: "B.Tech", annualFee: 95000 },
      ],
      placements: [
        { year: 2024, avgPackage: 11.0, maxPackage: 26, placementPct: 80, topRecruiters: ["BNY Mellon", "Bajaj", "Barclays", "Cummins", "KPIT"] },
        { year: 2023, avgPackage: 10.2, maxPackage: 24, placementPct: 79, topRecruiters: ["Persistent", "Syntel", "Infosys", "TCS", "Wipro"] },
        { year: 2022, avgPackage: 9.0, maxPackage: 22, placementPct: 77, topRecruiters: ["Capgemini", "Accenture", "HCL", "Zensar", "TATA"] },
      ],
      cutoffs: [
        { exam: "MHT-CET", year: 2024, category: "General", cutoffValue: 2900 },
        { exam: "MHT-CET", year: 2023, category: "General", cutoffValue: 2700 },
        { exam: "MHT-CET", year: 2022, category: "General", cutoffValue: 3100 },
      ],
    },
    {
      slug: "dtu-delhi",
      name: "DTU Delhi",
      city: "Delhi",
      state: "Delhi",
      type: CollegeType.GOVT,
      streams: ["Engineering"],
      nirfRank: 36,
      established: 1941,
      website: "https://dtu.ac.in",
      accreditation: "NAAC A+",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 175000 },
        { course: "Electronics & Communication Engineering", degree: "B.Tech", annualFee: 175000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 175000 },
        { course: "Biotechnology", degree: "B.Tech", annualFee: 175000 },
      ],
      placements: [
        { year: 2024, avgPackage: 14.5, maxPackage: 68, placementPct: 85, topRecruiters: ["Samsung", "Adobe", "Amazon", "Zomato", "Snapdeal"] },
        { year: 2023, avgPackage: 13.2, maxPackage: 65, placementPct: 84, topRecruiters: ["Microsoft", "Paytm", "Ola", "Google", "Swiggy"] },
        { year: 2022, avgPackage: 11.8, maxPackage: 58, placementPct: 83, topRecruiters: ["Flipkart", "PhonePe", "Razorpay", "CRED", "Dunzo"] },
      ],
      cutoffs: [
        { exam: "JEE Mains", year: 2024, category: "General", cutoffValue: 14200 },
        { exam: "JEE Mains", year: 2023, category: "General", cutoffValue: 13500 },
        { exam: "JEE Mains", year: 2022, category: "General", cutoffValue: 15800 },
      ],
    },
    {
      slug: "nsut-delhi",
      name: "NSUT Delhi",
      city: "Delhi",
      state: "Delhi",
      type: CollegeType.GOVT,
      streams: ["Engineering"],
      nirfRank: 61,
      established: 1983,
      website: "https://nsut.ac.in",
      accreditation: "NAAC A",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 120000 },
        { course: "Electronics & Communication Engineering", degree: "B.Tech", annualFee: 120000 },
        { course: "Information Technology", degree: "B.Tech", annualFee: 120000 },
        { course: "Instrumentation Engineering", degree: "B.Tech", annualFee: 120000 },
      ],
      placements: [
        { year: 2024, avgPackage: 13.0, maxPackage: 55, placementPct: 83, topRecruiters: ["Google", "Microsoft", "Paytm", "Ola", "Nykaa"] },
        { year: 2023, avgPackage: 12.0, maxPackage: 52, placementPct: 82, topRecruiters: ["Amazon", "Flipkart", "Samsung", "Adobe", "Zomato"] },
        { year: 2022, avgPackage: 10.5, maxPackage: 46, placementPct: 80, topRecruiters: ["Infosys", "Wipro", "HCL", "Cognizant", "Capgemini"] },
      ],
      cutoffs: [
        { exam: "JEE Mains", year: 2024, category: "General", cutoffValue: 19500 },
        { exam: "JEE Mains", year: 2023, category: "General", cutoffValue: 18200 },
        { exam: "JEE Mains", year: 2022, category: "General", cutoffValue: 21000 },
      ],
    },
    {
      slug: "rvce-bangalore",
      name: "RVCE Bangalore",
      city: "Bangalore",
      state: "Karnataka",
      type: CollegeType.PRIVATE,
      streams: ["Engineering"],
      nirfRank: 75,
      established: 1963,
      website: "https://www.rvce.edu.in",
      accreditation: "NAAC A+",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.E.", annualFee: 175000 },
        { course: "Electronics & Communication Engineering", degree: "B.E.", annualFee: 175000 },
        { course: "Information Science & Engineering", degree: "B.E.", annualFee: 175000 },
        { course: "Mechanical Engineering", degree: "B.E.", annualFee: 175000 },
      ],
      placements: [
        { year: 2024, avgPackage: 10.5, maxPackage: 42, placementPct: 82, topRecruiters: ["Amazon", "Accenture", "Wipro", "Bosch", "SAP Labs"] },
        { year: 2023, avgPackage: 9.8, maxPackage: 38, placementPct: 80, topRecruiters: ["Infosys", "TCS", "HCL", "Capgemini", "Cisco"] },
        { year: 2022, avgPackage: 8.5, maxPackage: 35, placementPct: 78, topRecruiters: ["Mindtree", "Mphasis", "Persistent", "Oracle", "Samsung"] },
      ],
      cutoffs: [
        { exam: "KCET", year: 2024, category: "General", cutoffValue: 4200 },
        { exam: "KCET", year: 2023, category: "General", cutoffValue: 3900 },
        { exam: "KCET", year: 2022, category: "General", cutoffValue: 4500 },
      ],
    },
    {
      slug: "pes-university",
      name: "PES University",
      city: "Bangalore",
      state: "Karnataka",
      type: CollegeType.PRIVATE,
      streams: ["Engineering", "Management"],
      nirfRank: 95,
      established: 1972,
      website: "https://pes.edu",
      accreditation: "NAAC A+",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 295000 },
        { course: "Electronics & Communication Engineering", degree: "B.Tech", annualFee: 295000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 295000 },
        { course: "Biotechnology", degree: "B.Tech", annualFee: 295000 },
      ],
      placements: [
        { year: 2024, avgPackage: 9.5, maxPackage: 44, placementPct: 78, topRecruiters: ["Microsoft", "Flipkart", "Oracle", "Honeywell", "Cisco"] },
        { year: 2023, avgPackage: 8.8, maxPackage: 42, placementPct: 76, topRecruiters: ["Amazon", "Infosys", "Wipro", "Accenture", "IBM"] },
        { year: 2022, avgPackage: 7.8, maxPackage: 38, placementPct: 75, topRecruiters: ["TCS", "HCL", "Capgemini", "Mphasis", "Bosch"] },
      ],
      cutoffs: [
        { exam: "KCET", year: 2024, category: "General", cutoffValue: 9500 },
        { exam: "KCET", year: 2023, category: "General", cutoffValue: 8800 },
        { exam: "KCET", year: 2022, category: "General", cutoffValue: 10200 },
      ],
    },
    {
      slug: "vit-vellore",
      name: "VIT Vellore",
      city: "Vellore",
      state: "Tamil Nadu",
      type: CollegeType.DEEMED,
      streams: ["Engineering", "Sciences"],
      nirfRank: 11,
      established: 1984,
      website: "https://vit.ac.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 320000 },
        { course: "Electronics & Communication Engineering", degree: "B.Tech", annualFee: 320000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 320000 },
        { course: "Biomedical Engineering", degree: "B.Tech", annualFee: 310000 },
        { course: "Chemical Engineering", degree: "B.Tech", annualFee: 310000 },
      ],
      placements: [
        { year: 2024, avgPackage: 8.5, maxPackage: 46, placementPct: 82, topRecruiters: ["TCS", "Infosys", "Wipro", "Cognizant", "Capgemini"] },
        { year: 2023, avgPackage: 7.8, maxPackage: 44, placementPct: 80, topRecruiters: ["Accenture", "HCL", "Tech Mahindra", "Zoho", "MindTree"] },
        { year: 2022, avgPackage: 7.0, maxPackage: 40, placementPct: 78, topRecruiters: ["IBM", "Oracle", "Samsung", "Bosch", "L&T"] },
      ],
      cutoffs: [
        { exam: "VITEEE", year: 2024, category: "General", cutoffValue: 5000 },
        { exam: "VITEEE", year: 2023, category: "General", cutoffValue: 5500 },
        { exam: "VITEEE", year: 2022, category: "General", cutoffValue: 6000 },
      ],
    },
    {
      slug: "srm-chennai",
      name: "SRM Institute Chennai",
      city: "Chennai",
      state: "Tamil Nadu",
      type: CollegeType.DEEMED,
      streams: ["Engineering", "Sciences", "Management"],
      nirfRank: 30,
      established: 1985,
      website: "https://www.srmist.edu.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 295000 },
        { course: "Electronics & Communication Engineering", degree: "B.Tech", annualFee: 295000 },
        { course: "Information Technology", degree: "B.Tech", annualFee: 295000 },
        { course: "Biomedical Engineering", degree: "B.Tech", annualFee: 280000 },
      ],
      placements: [
        { year: 2024, avgPackage: 7.2, maxPackage: 38, placementPct: 75, topRecruiters: ["TCS", "Infosys", "Wipro", "CTS", "Zoho"] },
        { year: 2023, avgPackage: 6.5, maxPackage: 36, placementPct: 73, topRecruiters: ["HCL", "Accenture", "Tech Mahindra", "Capgemini", "IBM"] },
        { year: 2022, avgPackage: 6.0, maxPackage: 32, placementPct: 71, topRecruiters: ["L&T", "Samsung", "Amazon", "Oracle", "Mindtree"] },
      ],
      cutoffs: [
        { exam: "SRMJEEE", year: 2024, category: "General", cutoffValue: 10000 },
        { exam: "SRMJEEE", year: 2023, category: "General", cutoffValue: 11000 },
        { exam: "SRMJEEE", year: 2022, category: "General", cutoffValue: 12000 },
      ],
    },
    {
      slug: "jadavpur-university",
      name: "Jadavpur University",
      city: "Kolkata",
      state: "West Bengal",
      type: CollegeType.GOVT,
      streams: ["Engineering", "Sciences"],
      nirfRank: 12,
      established: 1955,
      website: "https://jadavpuruniversity.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.E.", annualFee: 25000 },
        { course: "Electronics & Communication Engineering", degree: "B.E.", annualFee: 25000 },
        { course: "Mechanical Engineering", degree: "B.E.", annualFee: 25000 },
        { course: "Civil Engineering", degree: "B.E.", annualFee: 25000 },
        { course: "Chemical Engineering", degree: "B.E.", annualFee: 25000 },
      ],
      placements: [
        { year: 2024, avgPackage: 12.5, maxPackage: 58, placementPct: 85, topRecruiters: ["TCS", "IBM", "Wipro", "L&T", "Tata Motors"] },
        { year: 2023, avgPackage: 11.2, maxPackage: 55, placementPct: 83, topRecruiters: ["Infosys", "HCL", "Cognizant", "Accenture", "Deloitte"] },
        { year: 2022, avgPackage: 9.8, maxPackage: 48, placementPct: 81, topRecruiters: ["Samsung", "Amazon", "Adobe", "Oracle", "Capgemini"] },
      ],
      cutoffs: [
        { exam: "WBJEE", year: 2024, category: "General", cutoffValue: 920 },
        { exam: "WBJEE", year: 2023, category: "General", cutoffValue: 850 },
        { exam: "WBJEE", year: 2022, category: "General", cutoffValue: 1050 },
      ],
    },
    {
      slug: "iiest-shibpur",
      name: "IIEST Shibpur",
      city: "Howrah",
      state: "West Bengal",
      type: CollegeType.GOVT,
      streams: ["Engineering"],
      nirfRank: 48,
      established: 1856,
      website: "https://www.iiest.ac.in",
      accreditation: "NAAC A",
      courses: [
        { course: "Computer Science & Technology", degree: "B.E.", annualFee: 55000 },
        { course: "Electronics & Telecommunication Engineering", degree: "B.E.", annualFee: 55000 },
        { course: "Mechanical Engineering", degree: "B.E.", annualFee: 55000 },
        { course: "Civil Engineering", degree: "B.E.", annualFee: 55000 },
      ],
      placements: [
        { year: 2024, avgPackage: 10.0, maxPackage: 30, placementPct: 78, topRecruiters: ["Tata Steel", "L&T", "Wipro", "Infosys", "SAIL"] },
        { year: 2023, avgPackage: 9.0, maxPackage: 28, placementPct: 76, topRecruiters: ["TCS", "HCL", "Cognizant", "IBM", "Deloitte"] },
        { year: 2022, avgPackage: 8.2, maxPackage: 25, placementPct: 74, topRecruiters: ["Accenture", "Samsung", "Oracle", "Capgemini", "Infosys"] },
      ],
      cutoffs: [
        { exam: "WBJEE", year: 2024, category: "General", cutoffValue: 2800 },
        { exam: "WBJEE", year: 2023, category: "General", cutoffValue: 2600 },
        { exam: "WBJEE", year: 2022, category: "General", cutoffValue: 3100 },
      ],
    },
    {
      slug: "pict-pune",
      name: "PICT Pune",
      city: "Pune",
      state: "Maharashtra",
      type: CollegeType.PRIVATE,
      streams: ["Engineering"],
      nirfRank: null,
      established: 1983,
      website: "https://pict.edu",
      accreditation: "NAAC A",
      courses: [
        { course: "Computer Engineering", degree: "B.E.", annualFee: 135000 },
        { course: "Information Technology", degree: "B.E.", annualFee: 135000 },
        { course: "Electronics & Telecommunication", degree: "B.E.", annualFee: 135000 },
      ],
      placements: [
        { year: 2024, avgPackage: 9.0, maxPackage: 22, placementPct: 80, topRecruiters: ["Infosys", "Persistent Systems", "Tech Mahindra", "Cognizant", "TCS"] },
        { year: 2023, avgPackage: 8.2, maxPackage: 20, placementPct: 78, topRecruiters: ["Wipro", "HCL", "Capgemini", "Accenture", "Oracle"] },
        { year: 2022, avgPackage: 7.5, maxPackage: 18, placementPct: 76, topRecruiters: ["Zensar", "KPIT", "Syntel", "Mphasis", "IBM"] },
      ],
      cutoffs: [
        { exam: "MHT-CET", year: 2024, category: "General", cutoffValue: 7500 },
        { exam: "MHT-CET", year: 2023, category: "General", cutoffValue: 7000 },
        { exam: "MHT-CET", year: 2022, category: "General", cutoffValue: 8100 },
      ],
    },
    {
      slug: "nit-surathkal",
      name: "NIT Surathkal",
      city: "Mangalore",
      state: "Karnataka",
      type: CollegeType.GOVT,
      streams: ["Engineering"],
      nirfRank: 18,
      established: 1960,
      website: "https://www.nitk.ac.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 152000 },
        { course: "Electronics & Communication Engineering", degree: "B.Tech", annualFee: 152000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 152000 },
        { course: "Chemical Engineering", degree: "B.Tech", annualFee: 152000 },
      ],
      placements: [
        { year: 2024, avgPackage: 14.8, maxPackage: 50, placementPct: 86, topRecruiters: ["Amazon", "Microsoft", "Infosys", "Wipro", "Qualcomm"] },
        { year: 2023, avgPackage: 13.5, maxPackage: 48, placementPct: 85, topRecruiters: ["Samsung", "Google", "TCS", "Deloitte", "Oracle"] },
        { year: 2022, avgPackage: 12.0, maxPackage: 44, placementPct: 83, topRecruiters: ["HCL", "Accenture", "Capgemini", "Cognizant", "IBM"] },
      ],
      cutoffs: [
        { exam: "JEE Mains", year: 2024, category: "General", cutoffValue: 6500 },
        { exam: "JEE Mains", year: 2023, category: "General", cutoffValue: 6100 },
        { exam: "JEE Mains", year: 2022, category: "General", cutoffValue: 7000 },
      ],
    },
    {
      slug: "iit-roorkee",
      name: "IIT Roorkee",
      city: "Roorkee",
      state: "Uttarakhand",
      type: CollegeType.GOVT,
      streams: ["Engineering", "Sciences", "Management"],
      nirfRank: 7,
      established: 1847,
      website: "https://www.iitr.ac.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 205000 },
        { course: "Electrical Engineering", degree: "B.Tech", annualFee: 205000 },
        { course: "Civil Engineering", degree: "B.Tech", annualFee: 205000 },
        { course: "Metallurgical & Materials Engineering", degree: "B.Tech", annualFee: 205000 },
      ],
      placements: [
        { year: 2024, avgPackage: 22.0, maxPackage: 165, placementPct: 91, topRecruiters: ["Google", "Microsoft", "Amazon", "Qualcomm", "NVIDIA"] },
        { year: 2023, avgPackage: 20.5, maxPackage: 148, placementPct: 90, topRecruiters: ["Samsung", "Intel", "Apple", "D.E. Shaw", "Goldman Sachs"] },
        { year: 2022, avgPackage: 18.2, maxPackage: 130, placementPct: 89, topRecruiters: ["Adobe", "Flipkart", "Walmart", "Uber", "Morgan Stanley"] },
      ],
      cutoffs: [
        { exam: "JEE Advanced", year: 2024, category: "General", cutoffValue: 580 },
        { exam: "JEE Advanced", year: 2024, category: "OBC", cutoffValue: 1250 },
        { exam: "JEE Advanced", year: 2023, category: "General", cutoffValue: 530 },
        { exam: "JEE Advanced", year: 2022, category: "General", cutoffValue: 620 },
      ],
    },
    {
      slug: "iit-kanpur",
      name: "IIT Kanpur",
      city: "Kanpur",
      state: "Uttar Pradesh",
      type: CollegeType.GOVT,
      streams: ["Engineering", "Sciences", "Management"],
      nirfRank: 4,
      established: 1959,
      website: "https://www.iitk.ac.in",
      accreditation: "NAAC A++",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 218000 },
        { course: "Electrical Engineering", degree: "B.Tech", annualFee: 218000 },
        { course: "Aerospace Engineering", degree: "B.Tech", annualFee: 218000 },
        { course: "Materials Science & Engineering", degree: "B.Tech", annualFee: 218000 },
      ],
      placements: [
        { year: 2024, avgPackage: 25.0, maxPackage: 185, placementPct: 93, topRecruiters: ["Google", "Microsoft", "Two Sigma", "DE Shaw", "Amazon"] },
        { year: 2023, avgPackage: 23.2, maxPackage: 168, placementPct: 92, topRecruiters: ["Apple", "Facebook", "Goldman Sachs", "McKinsey", "Uber"] },
        { year: 2022, avgPackage: 21.0, maxPackage: 152, placementPct: 91, topRecruiters: ["Qualcomm", "Samsung", "Intel", "Oracle", "Flipkart"] },
      ],
      cutoffs: [
        { exam: "JEE Advanced", year: 2024, category: "General", cutoffValue: 195 },
        { exam: "JEE Advanced", year: 2024, category: "OBC", cutoffValue: 520 },
        { exam: "JEE Advanced", year: 2023, category: "General", cutoffValue: 175 },
        { exam: "JEE Advanced", year: 2022, category: "General", cutoffValue: 210 },
      ],
    },
    {
      slug: "manipal-institute",
      name: "Manipal Institute of Technology",
      city: "Manipal",
      state: "Karnataka",
      type: CollegeType.DEEMED,
      streams: ["Engineering", "Sciences"],
      nirfRank: 49,
      established: 1957,
      website: "https://manipal.edu/mit.html",
      accreditation: "NAAC A+",
      courses: [
        { course: "Computer Science & Engineering", degree: "B.Tech", annualFee: 420000 },
        { course: "Electronics & Communication Engineering", degree: "B.Tech", annualFee: 420000 },
        { course: "Mechanical Engineering", degree: "B.Tech", annualFee: 420000 },
        { course: "Aeronautical Engineering", degree: "B.Tech", annualFee: 450000 },
      ],
      placements: [
        { year: 2024, avgPackage: 11.5, maxPackage: 48, placementPct: 80, topRecruiters: ["Infosys", "Wipro", "TCS", "Capgemini", "Accenture"] },
        { year: 2023, avgPackage: 10.5, maxPackage: 45, placementPct: 78, topRecruiters: ["Amazon", "Oracle", "Samsung", "HCL", "Deloitte"] },
        { year: 2022, avgPackage: 9.2, maxPackage: 40, placementPct: 76, topRecruiters: ["IBM", "Mindtree", "Mphasis", "KPIT", "Persistent"] },
      ],
      cutoffs: [
        { exam: "MET", year: 2024, category: "General", cutoffValue: 15000 },
        { exam: "MET", year: 2023, category: "General", cutoffValue: 16500 },
        { exam: "MET", year: 2022, category: "General", cutoffValue: 18000 },
      ],
    },
  ];

  // ─── Insert colleges with all relations ─────────────────────────────────────

  for (const college of colleges) {
    const { courses, placements, cutoffs, ...collegeData } = college;

    const created = await prisma.college.create({
      data: {
        ...collegeData,
        courseFees: {
          create: courses,
        },
        placementStats: {
          create: placements.map((p) => ({
            year: p.year,
            avgPackage: p.avgPackage,
            maxPackage: p.maxPackage,
            placementPct: p.placementPct,
            topRecruiters: p.topRecruiters,
          })),
        },
        admissionCutoffs: {
          create: cutoffs,
        },
      },
    });

    console.log(`  ✓ ${created.name}`);
  }

  // ─── Seed approved reviews for a few colleges ────────────────────────────────

  const iitb = await prisma.college.findUnique({ where: { slug: "iit-bombay" } });
  const nitTrichy = await prisma.college.findUnique({ where: { slug: "nit-trichy" } });
  const bits = await prisma.college.findUnique({ where: { slug: "bits-pilani" } });

  if (iitb) {
    await prisma.review.createMany({
      data: [
        {
          collegeId: iitb.id,
          authorName: "Arjun Mehta",
          batchYear: 2023,
          stream: "Computer Science",
          ratingOverall: 5,
          ratingPlacement: 5,
          ratingFaculty: 4.5,
          ratingInfra: 5,
          body: "Absolutely world-class institution. The research opportunities, faculty quality, and placement support are unmatched in India. The Powai campus is stunning and the peer group here is exceptional. Every resource you need to excel is available.",
          status: "APPROVED",
        },
        {
          collegeId: iitb.id,
          authorName: "Priya Nair",
          batchYear: 2022,
          stream: "Electrical Engineering",
          ratingOverall: 4.5,
          ratingPlacement: 5,
          ratingFaculty: 4,
          ratingInfra: 4.5,
          body: "The placement season at IIT Bombay is intense but incredibly rewarding. Top companies from around the globe come here. The faculty is brilliant and research opportunities are phenomenal. My only minor gripe is the competitive pressure, but that is expected at this level.",
          status: "APPROVED",
        },
      ],
    });
  }

  if (nitTrichy) {
    await prisma.review.createMany({
      data: [
        {
          collegeId: nitTrichy.id,
          authorName: "Karthik Subramanian",
          batchYear: 2024,
          stream: "Computer Science",
          ratingOverall: 4.5,
          ratingPlacement: 4.5,
          ratingFaculty: 4,
          ratingInfra: 4,
          body: "NIT Trichy lives up to its reputation as the top NIT. The CS placements are excellent with consistent packages from top product companies. Campus life is vibrant with strong cultural and technical fests. The professors are experienced and approachable.",
          status: "APPROVED",
        },
      ],
    });
  }

  if (bits) {
    await prisma.review.createMany({
      data: [
        {
          collegeId: bits.id,
          authorName: "Rahul Sharma",
          batchYear: 2023,
          stream: "Computer Science",
          ratingOverall: 5,
          ratingPlacement: 5,
          ratingFaculty: 4,
          ratingInfra: 4.5,
          body: "The Practice School program at BITS Pilani is the single best feature of any engineering college in India. You get 6-month industry stints at top companies before graduation. The campus culture of freedom and intellectual curiosity is unique. Placements are consistently excellent.",
          status: "APPROVED",
        },
      ],
    });
  }

  console.log(`\n✅ Seeded ${colleges.length} colleges with full relational data`);
  console.log("✅ Seeded approved reviews");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });