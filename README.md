# CollegeScout 🎓

A full-stack web app for Indian engineering students to discover, compare, and shortlist colleges — built as a production-quality internship engineering trial project.

**[Live Demo](https://college-scout-five.vercel.app)**

---

## Features

- 🔍 **Search & Filter** — 22 colleges, full-text search, exam/fee/type filters, pagination
- ⚖️ **Compare** — Side-by-side comparison with live weight sliders (placement / fees / prestige)
- 🎯 **Rank Predictor** — Enter exam + rank + category → High / Medium / Low probability per college
- 🧮 **Decision Score Engine** — Weighted scoring API, normalised 0–100, fully deterministic
- 📝 **Review System** — Submit reviews (body ≥ 80 chars, quality gate), moderated admin approval
- 📋 **Shortlist** — Anonymous session-based shortlist (no login needed), session token via header
- 🔐 **Authentication** — Email/password with bcryptjs + NextAuth sessions
- 📈 **Career Trends** — Recruiter-level salary + industry + growth enrichment per college

---

## Tech Stack

| Component | Tech |
|-----------|------|
| Frontend  | Next.js 15 App Router, TypeScript, Tailwind CSS |
| Backend   | Next.js API Routes (App Router) |
| Database  | PostgreSQL (Neon serverless) |
| ORM       | Prisma 5 |
| Auth      | NextAuth.js v5 + bcryptjs |
| Deployment| Vercel |

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

   Create `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/college_scout
   NEXTAUTH_SECRET=your-32-char-secret
   NEXTAUTH_URL=http://localhost:3000
   ADMIN_API_KEY=your-admin-secret-key
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

## 📡 API Reference

> **Base URL (local):** `http://localhost:3000`  
> **Base URL (production):** `https://college-scout-five.vercel.app`

---

### Colleges

```
GET  /api/colleges
GET  /api/colleges/:id
POST /api/score
```

---

### 🧮 Decision Score Engine

**POST /api/score** — Rank colleges by personalised weighted score

```bash
curl -X POST http://localhost:3000/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "weights": { "placement": 0.6, "fees": 0.3, "location": 0.1 },
    "filters": { "stream": "Engineering", "city": "Mumbai" }
  }'
```

**Response:**
```json
{
  "results": [
    {
      "id": "clxx...",
      "name": "IIT Bombay",
      "score": 87.5,
      "dimensionScores": { "placement": 100, "fees": 45, "location": 100 }
    }
  ]
}
```

> Scoring is deterministic: same weights → same order, always.  
> Fees are inverted (lower fee = higher score). Score range: 0–100.

---

### 📝 Review System

**POST /api/colleges/:id/reviews** — Submit a review

```bash
curl -X POST http://localhost:3000/api/colleges/iit-bombay/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "authorName": "Rahul Sharma",
    "batchYear": 2023,
    "stream": "Computer Science",
    "ratingOverall": 4.5,
    "ratingPlacement": 5,
    "ratingFaculty": 4,
    "ratingInfra": 4.5,
    "body": "IIT Bombay is an exceptional institution. The placement season is intense with top global companies recruiting. Research infrastructure is world-class and the peer quality is unmatched in India."
  }'
```

**Validation rules (returns 422 with field-level errors if violated):**
- `body` ≥ 80 characters
- `batchYear` between 2010 and current year
- All 4 ratings required (1–5 scale)

**400 validation error response example:**
```json
{
  "error": "Validation failed",
  "fields": {
    "body": "Review must be at least 80 characters",
    "batchYear": "Batch year must be 2010 or later"
  }
}
```

---

**GET /api/colleges/:id/reviews** — Paginated approved reviews with live aggregates

```bash
# Default: page 1, limit 10
curl "http://localhost:3000/api/colleges/iit-bombay/reviews"

# Custom pagination
curl "http://localhost:3000/api/colleges/iit-bombay/reviews?page=2&limit=5"

# Offset-based pagination
curl "http://localhost:3000/api/colleges/iit-bombay/reviews?limit=10&offset=20"
```

**Response:**
```json
{
  "data": [
    {
      "id": "clxx...",
      "authorName": "Rahul Sharma",
      "batchYear": 2023,
      "stream": "Computer Science",
      "ratingOverall": 4.5,
      "ratingPlacement": 5.0,
      "ratingFaculty": 4.0,
      "ratingInfra": 4.5,
      "body": "IIT Bombay is an exceptional...",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 5,
  "aggregates": {
    "overall": 4.4,
    "placement": 4.7,
    "faculty": 4.1,
    "infra": 4.3,
    "count": 42
  }
}
```

> Only `APPROVED` reviews are returned. Reviews land as `PENDING` and require admin approval.

---

### 🔑 Admin Panel (API Key Protected)

All admin endpoints require the `x-admin-key` header matching `ADMIN_API_KEY` in `.env`.

**List pending reviews:**
```bash
curl http://localhost:3000/api/admin/reviews \
  -H "x-admin-key: your-admin-secret-key"

# Filter by status
curl "http://localhost:3000/api/admin/reviews?status=PENDING&limit=20&offset=0" \
  -H "x-admin-key: your-admin-secret-key"
```

**Approve a review:**
```bash
curl -X POST http://localhost:3000/api/admin/reviews/REVIEW_ID/approve \
  -H "x-admin-key: your-admin-secret-key"
```

**Reject a review:**
```bash
curl -X POST http://localhost:3000/api/admin/reviews/REVIEW_ID/reject \
  -H "x-admin-key: your-admin-secret-key"
```

**Unauthorized response (missing/wrong key):**
```json
{ "error": "Unauthorized" }
```
> HTTP 401 — no API key = no access. Static key in env, not a full auth system.

---

### 📋 Shortlist (Anonymous, Session-Based)

Session token passed via `x-session-id` header (or body fallback).

```bash
# Add to shortlist
curl -X POST http://localhost:3000/api/shortlist \
  -H "Content-Type: application/json" \
  -H "x-session-id: my-unique-session-token" \
  -d '{ "collegeId": "clxx..." }'

# Get shortlist
curl http://localhost:3000/api/shortlist/my-unique-session-token

# Remove from shortlist
curl -X DELETE http://localhost:3000/api/shortlist \
  -H "Content-Type: application/json" \
  -H "x-session-id: my-unique-session-token" \
  -d '{ "collegeId": "clxx..." }'
```

---

### 🎯 Admission Predictor

```bash
# General predictor — rank all colleges for your profile
curl "http://localhost:3000/api/predictor?exam=JEE%20Advanced&percentile=1000&category=General"

# Per-college prediction
curl "http://localhost:3000/api/predictor/iit-bombay?exam=JEE%20Advanced&percentile=1000&category=General"
```

**Response (per-college):**
```json
{
  "collegeId": "clxx...",
  "slug": "iit-bombay",
  "name": "IIT Bombay",
  "probability": "high",
  "cutoff_context": {
    "exam": "JEE Advanced",
    "category": "General",
    "avgCutoff": 3217,
    "yourScore": 1000,
    "dataPoints": [
      { "year": 2024, "value": 3200 },
      { "year": 2023, "value": 3050 },
      { "year": 2022, "value": 3400 }
    ],
    "isScoreBased": false
  }
}
```

> `probability` is `"high"` | `"medium"` | `"low"`.  
> Uses last closing rank per year (most accessible branch), not just CSE cutoff.

---

### 📈 Career Trends (Bonus)

```bash
curl http://localhost:3000/api/colleges/iit-bombay/careerTrends
```

**Response:**
```json
{
  "collegeId": "clxx...",
  "collegeName": "IIT Bombay",
  "placementYear": 2024,
  "topRecruiters": [
    {
      "name": "Google",
      "industry": "Technology",
      "salaryRange": { "min": 1500000, "max": 3500000 },
      "growth": "High Growth"
    }
  ],
  "roleClusters": [
    { "title": "Software Engineer", "count": 245, "avgSalary": 1200000 }
  ],
  "salaryBands": [
    { "min": 800000, "max": 1200000, "count": 456 }
  ],
  "growthDistribution": {
    "highGrowth": 4,
    "stable": 2,
    "declining": 0
  }
}
```

---

## 🧪 Scoring Engine Unit Tests

```bash
npx tsx src/lib/__tests__/scoring.test.ts
```

**5 edge cases tested:**
1. Equal weights (1/3 each) — deterministic ranked output
2. Single weight 100% placement — ranks by avg package only
3. Extreme fee range, 100% fees — cheapest college scores 100
4. Empty input — returns empty array
5. Weights > 1 — normalised correctly (6/3/1 = same as 0.6/0.3/0.1)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── colleges/[id]/reviews/     # POST + GET (paginated, approved only)
│   │   ├── colleges/[id]/careerTrends/# Career outcome enrichment
│   │   ├── admin/reviews/             # GET list (admin only)
│   │   ├── admin/reviews/[id]/approve # POST approve (admin only)
│   │   ├── admin/reviews/[id]/reject  # POST reject (admin only)
│   │   ├── score/                     # POST weighted scoring
│   │   ├── predictor/                 # GET general predictor
│   │   ├── predictor/[collegeId]/     # GET per-college predictor
│   │   └── shortlist/                 # POST + DELETE (session-based)
│   ├── colleges/[slug]/               # College detail page
│   ├── compare/                       # Compare page with weight sliders
│   └── predictor/                     # Predictor page
├── lib/
│   ├── scoring.ts                     # Weighted scoring engine
│   └── __tests__/scoring.test.ts      # 5 unit tests
prisma/
├── schema.prisma                      # Full relational schema
└── seed.ts                            # 22 colleges with multi-branch cutoffs
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon format) |
| `NEXTAUTH_SECRET` | Random 32-char string for session signing |
| `NEXTAUTH_URL` | App base URL |
| `ADMIN_API_KEY` | Static key for admin review moderation endpoints |

---

## 👨‍💻 Author

Built as a production-quality CollegeHunt engineering trial project.

**GitHub:** [@Padmin-12](https://github.com/Padmin-12)

---

<div align="center">

Made for Indian engineering students 🇮🇳

</div>
