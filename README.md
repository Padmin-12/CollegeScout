# CollegeScout 🎓

A full-stack web app for Indian engineering students to discover, compare, and shortlist colleges.

**[Live Demo](https://college-scout-five.vercel.app)**

---

## Features

- 🔍 **Search & Filter** — Browse 18+ colleges with full-text search, exam filters (JEE, MHT-CET, KCET, etc.), and fee ranges
- ⚖️ **Compare** — Side-by-side college comparison with highlighted best values
- 🚀 **Rank Predictor** — Enter your exam score and get eligible colleges instantly
- 💾 **Save Colleges** — Create a personal shortlist (requires login)
- 📱 **Responsive Design** — Works on mobile, tablet, and desktop
- 🔐 **Authentication** — Register, login, and manage your shortlist securely

---

## Tech Stack

| Component | Tech |
|-----------|------|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | NextAuth.js v5 + bcryptjs |
| Deployment | Vercel |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (local or [Neon](https://neon.tech))

### Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/Padmin-12/CollegeScout.git
   cd CollegeScout
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/college_scout
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Setup Database**
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deployment (Vercel + Neon)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Add environment variables:
     ```
     DATABASE_URL=postgresql://...neon-connection-string...?sslmode=require
     NEXTAUTH_SECRET=your-secret
     NEXTAUTH_URL=https://your-app.vercel.app
     ```
   - Click Deploy

3. **Initialize Database**
   ```bash
   npx prisma db push --skip-generate
   npx tsx prisma/seed.ts
   ```

---

## 📡 API Endpoints

### Colleges
```
GET /api/colleges?search=IIT&exam=JEE&minRating=4.0&maxFees=500000&page=1
GET /api/colleges/:id
GET /api/compare?id1=college_1&id2=college_2
GET /api/predictor?exam=JEE&rank=250&branch=CSE
```

### Auth & Saved
```
POST /api/auth/register
GET  /api/saved          (requires login)
POST /api/saved          (requires login)
DELETE /api/saved        (requires login)
```

---

## 📁 Project Structure

```
src/
├── app/api/           # API routes (colleges, auth, compare, etc.)
├── app/               # Pages (home, college/:id, compare, predictor, saved, login)
├── components/        # React components (CollegeCard, Navbar, etc.)
└── lib/               # Auth config, Prisma client
prisma/
├── schema.prisma      # Database schema
└── seed.ts            # Sample data
```

---

## ✨ Key Features Explained

**🔍 Search & Filter**  
Search by college name/location + filter by exam type, fees, and ratings. Server-side pagination with 9 colleges per page.

**🚀 Rank Predictor**  
Input your exam (JEE Mains, MHT-CET, etc.), rank/score, and preferred branch. Get colleges you're eligible for based on cutoffs stored in the database.

**⚖️ Compare**  
Select 2 colleges and compare all metrics side-by-side. Better values are highlighted in green.

**💾 Shortlist**  
Save colleges to your personal shortlist. Data is stored in PostgreSQL, not localStorage — persists across devices and sessions.

**🔐 Authentication**  
Email/password signup and login with bcryptjs password hashing. Session-based auth with NextAuth.

---

## ⚠️ Known Tradeoffs

- Rank cutoffs are parsed from text strings (e.g., "JEE Mains Rank under 500"). A structured `rankCutoff` field would be cleaner for scale.
- No email verification on signup (fine for demo, production would add this).
- Ratings are a single float field. A User Reviews model would be more realistic.

---

## 🔮 Future Ideas

- [ ] 🔑 Google/GitHub OAuth
- [ ] ⭐ User-submitted reviews
- [ ] ♾️ Infinite scroll pagination
- [ ] 🖼️ College image uploads
- [ ] 📧 Email notifications for deadlines
- [ ] 🛠️ Admin dashboard for college management

---

## 👨‍💻 Author

Built as a production-oriented full-stack project.

**GitHub:** [@Padmin-12](https://github.com/Padmin-12)

---

<div align="center">

Made for Indian engineering students 🇮🇳

</div>
