# CollegeScout 🎓

A full-stack college discovery and decision-making platform for Indian engineering students. Built to simulate a production-oriented MVP under realistic intern project constraints.

---

## Features

| Feature | Description |
|---------|-------------|
| **College Discovery** | Browse 18+ Indian engineering colleges with rich detail pages |
| **Advanced Search & Filters** | Filter by exam (JEE/MHT-CET/KCET/WBJEE/BITSAT), fees range, and rating |
| **Pagination** | Server-side paginated listings — 9 colleges per page |
| **Compare Tool** | Side-by-side comparison table with highlighted "better" metrics |
| **Rank Predictor** | DB-driven predictor — matches colleges based on your exam and rank/score |
| **Shortlist / Save** | Save colleges to a personal shortlist, manage from a dedicated page |
| **Authentication** | Email/password auth via NextAuth v5 — register, login, session persistence |
| **Responsive UI** | Mobile-first design with hamburger nav and adaptive layouts |
| **Loading States** | Skeleton loaders, error handling, and toast notifications |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS v4 |
| ORM | Prisma 5 |
| Database | PostgreSQL (local / Neon for production) |
| Auth | NextAuth.js v5 (Credentials provider) |
| Password Hashing | bcryptjs |
| Deployment | Vercel + Neon |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts   # NextAuth handler
│   │   │   └── register/route.ts        # User registration
│   │   ├── colleges/
│   │   │   ├── route.ts                 # GET /api/colleges (filter + paginate)
│   │   │   └── [id]/route.ts            # GET /api/colleges/:id
│   │   ├── compare/route.ts             # GET /api/compare
│   │   ├── predictor/route.ts           # GET /api/predictor
│   │   └── saved/route.ts              # GET/POST/DELETE /api/saved
│   ├── college/[id]/page.tsx            # College detail page (Server Component)
│   ├── compare/page.tsx                 # Compare page
│   ├── login/page.tsx                   # Login / Register
│   ├── predictor/page.tsx               # Rank predictor
│   ├── saved/page.tsx                   # Saved colleges (auth-protected)
│   ├── layout.tsx
│   └── page.tsx                         # Home page
├── components/
│   ├── CollegeCard.tsx                  # Card with save/compare actions
│   ├── Navbar.tsx                       # Responsive navbar with session state
│   ├── SessionWrapper.tsx               # Client SessionProvider wrapper
│   ├── SkeletonCard.tsx                 # Loading skeleton
│   └── Toast.tsx                        # Lightweight toast notification
└── lib/
    ├── auth.ts                          # NextAuth config
    └── prisma.ts                        # Prisma client singleton
prisma/
├── schema.prisma                        # College, User, SavedCollege models
└── seed.ts                              # 18 realistic Indian engineering colleges
```

---

## Database Schema

```prisma
model College {
  id             String         @id @default(cuid())
  name           String
  location       String
  fees           Int
  rating         Float
  placements     String
  description    String
  courses        String
  highestPackage String
  topRecruiters  String
  facilities     String
  examCutoff     String
  image          String
  savedBy        SavedCollege[]
}

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  passwordHash  String
  savedColleges SavedCollege[]
}

model SavedCollege {
  userId    String
  collegeId String
  user      User    @relation(...)
  college   College @relation(...)
  @@unique([userId, collegeId])
}
```

---

## API Endpoints

### Colleges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/colleges` | List colleges with filtering + pagination |
| GET | `/api/colleges/:id` | Get single college |
| GET | `/api/compare?id1=&id2=` | Compare two colleges |
| GET | `/api/predictor?exam=&rank=&branch=` | DB-driven college predictor |

**Colleges query params:**
- `search` — full-text search (name, location, courses)
- `exam` — filter by exam type (JEE, MHT-CET, KCET, WBJEE, BITSAT, SRMJEE)
- `minRating` — minimum rating (e.g. `4.0`)
- `maxFees` — maximum annual fees in INR
- `page` — page number (default: 1)
- `limit` — per page (default: 9, max: 50)

**Response shape:**
```json
{
  "data": [...],
  "total": 18,
  "page": 1,
  "totalPages": 2
}
```

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account (`email`, `password`, `name?`) |
| POST | `/api/auth/signin` | NextAuth credentials signin |

### Saved Colleges (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/saved` | List saved colleges for current user |
| POST | `/api/saved` | Save a college (`{ collegeId }`) |
| DELETE | `/api/saved` | Unsave a college (`{ collegeId }`) |

---

## Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL running locally

### Steps

```bash
# 1. Clone and install
git clone <repo-url>
cd college-discovery-platform
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 3. Push schema to DB
npx prisma db push

# 4. Seed 18 colleges
npx tsx prisma/seed.ts

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel + Neon)

1. **Database**: Create a project on [Neon](https://neon.tech) → copy the connection string
2. **Vercel**: Import this repo → add environment variables:
   ```
   DATABASE_URL=postgresql://...your-neon-url...?sslmode=require
   NEXTAUTH_SECRET=<output of: openssl rand -base64 32>
   NEXTAUTH_URL=https://your-app.vercel.app
   ```
3. **Post-deploy**: Run `npx prisma db push` + seed via Vercel CLI or Neon SQL editor
4. Deploy — Vercel auto-detects Next.js

> **Note:** `NEXTAUTH_URL` is required in production. Without it, redirects after login/logout will fail.

---

## Architecture Decisions

### Why localStorage → DB for saves?
Saved colleges are immediately DB-backed via the `/api/saved` endpoint using the authenticated session. No localStorage is used — this keeps the data consistent across devices.

### Why Credentials auth over OAuth?
For an intern project context, credentials auth demonstrates understanding of password hashing, session management, and JWT — without requiring external OAuth app setup. Easily extensible with Google/GitHub providers.

### Why `prisma db push` over `migrate dev`?
`migrate dev` requires interactive TTY input. `db push` is simpler for development and fully compatible with Neon for production schema sync.

### Predictor approach
Colleges store exam cutoff as a human-readable string (e.g., `"JEE Advanced Rank under 100"`). The predictor API parses these strings server-side to determine eligibility. This avoids schema over-engineering while enabling DB-driven filtering.

### College detail page as Server Component
The detail page queries Prisma directly — no HTTP fetch needed. This eliminates the `localhost:3000` hardcoding issue and is the correct Next.js App Router pattern.

---

## Known Tradeoffs

- **Cutoff parsing is heuristic**: Rank thresholds are extracted via regex from text strings. A normalized `rankCutoff: Int` column would be cleaner for scale.
- **No email verification**: Registration is open — suitable for demo; production would need email confirmation.
- **Simple rating model**: Rating is a flat float field. A full `Review` model with user-submitted ratings would be more realistic.
- **Fees as integer**: Fees don't account for hostel/mess charges or category-wise differences.

---

## Future Improvements

- [ ] Google/GitHub OAuth providers
- [ ] User-submitted college reviews with `Review` model
- [ ] Normalized `RankCutoff` model per exam per branch
- [ ] Infinite scroll alternative to pagination
- [ ] College image upload / Cloudflare Images integration
- [ ] Comparison history saved to DB
- [ ] Email notifications for application deadlines
- [ ] Admin panel for college data management

---

## Author

Built as a full-stack intern project demonstrating Next.js App Router, Prisma, PostgreSQL, NextAuth, and production-grade API design.
