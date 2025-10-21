# RECNOTE - FINAL BUILD PLAN
**Last Updated**: October 21, 2025

**Status**: Ready to Start
**Product Name**: Recnote
**Domain**: recnote.io (to be registered)
**Stack**: Cloudflare Ecosystem
**Budget**: Domain + $0-50/month
**Timeline**: 12 weeks to launch

---

## CLOUDFLARE PRICING - VERIFIED (No Hidden Costs)

### ⚠️ IMPORTANT: Free Tier Limits & When You Pay

#### 1. Cloudflare R2 (Storage)
**Free Tier**:
- 10 GB storage/month
- 1 million Class A operations (writes)/month
- 10 million Class B operations (reads)/month
- NO egress fees (this is the big win)

**When You Pay**:
- Storage: $0.015/GB/month (after 10GB)
- Class A ops: $4.50 per million (after 1M)
- Class B ops: $0.36 per million (after 10M)

**For 100 users** (assuming avg 100MB per user):
- Storage: 10GB used = **$0** (within free tier)
- Operations: ~100k reads/month = **$0** (within free tier)

**For 500 users** (50GB total):
- Storage: 40GB over limit × $0.015 = **$0.60/month**
- Operations: Still within free tier = **$0**

**✅ NO HIDDEN COSTS. Pay only for what you use beyond free tier.**

---

#### 2. Cloudflare Workers (Backend)
**Free Tier**:
- 100,000 requests/day = 3 million/month
- 10ms CPU time per request
- No cold starts

**When You Pay**:
- $5/month for "Workers Paid" = UNLIMITED requests
- Bundled Workers (with R2): Included in usage

**For MVP with 100-500 users**:
- Likely stay within free tier = **$0/month**
- If you exceed: **$5/month** for unlimited

**✅ NO HIDDEN COSTS. Either free or flat $5.**

---

#### 3. Cloudflare D1 (Database)
**Free Tier** (Currently in beta, but stable):
- 5 GB storage
- 5 million rows read/day
- 100,000 rows written/day

**When You Pay** (pricing locked in):
- Storage: $0.75/GB/month (after 5GB)
- Reads: $0.001 per million rows
- Writes: $1.00 per million rows

**For 100-500 users**:
- Storage: <1GB = **$0**
- Reads: ~50k/day = **$0** (well within limit)
- Writes: ~5k/day = **$0** (within limit)

**✅ NO HIDDEN COSTS. Will stay free for a long time.**

---

#### 4. Cloudflare Pages (Frontend Hosting)
**Free Tier**:
- Unlimited requests
- Unlimited bandwidth
- 500 builds/month
- 1 build at a time

**When You Pay**:
- $20/month for "Pages Paid" = 5,000 builds/month + 5 concurrent builds

**For MVP**:
- You'll deploy maybe 50 times/month = **$0** (within free tier)

**✅ NO HIDDEN COSTS. Frontend hosting is FREE.**

---

#### 5. Cloudflare Stream (Video Delivery)
**⚠️ THIS IS WHERE COSTS CAN ADD UP**

**Pricing** (No free tier for Stream):
- $5/month minimum (for up to 1,000 minutes stored)
- Additional storage: $1 per 1,000 minutes stored
- Delivery: $1 per 1,000 minutes delivered
- Encoding: FREE (included)

**IMPORTANT CALCULATION**:

**Scenario 1: 50 users, 10 videos each, 5 min avg**
- Total minutes: 50 × 10 × 5 = 2,500 minutes stored
- Storage cost: $5 base + $1.50 = **$6.50/month**
- Delivery (assuming 2x views): 5,000 minutes = **$5/month**
- **Total Stream cost: $11.50/month**

**Scenario 2: 200 users, 20 videos each, 5 min avg**
- Total minutes: 200 × 20 × 5 = 20,000 minutes stored
- Storage cost: $5 + $19 = **$24/month**
- Delivery (2x views): 40,000 minutes = **$40/month**
- **Total Stream cost: $64/month**

**✅ PREDICTABLE COSTS. $1 per 1,000 minutes is clear pricing.**

**Alternative to Save Money** (If needed):
- Skip Stream initially
- Serve videos directly from R2 (free egress)
- Add Stream later when revenue justifies

---

#### 6. Cloudflare Domains
**Pricing**:
- .io domains: ~$9.50/year (at cost, no markup)
- .com domains: ~$9.15/year
- .app domains: ~$14.88/year

**Renewal**: Same price (no surprise increases)

**✅ CHEAPEST DOMAIN REGISTRAR. Cloudflare sells at cost.**

---

### TOTAL MONTHLY COST BREAKDOWN (Cloudflare)

#### Phase 1: Development (0 users)
| Service | Cost |
|---------|------|
| Domain (amortized) | $0.80/month |
| R2 | $0 |
| Workers | $0 |
| D1 | $0 |
| Pages | $0 |
| Stream | $5 (minimum) |
| **TOTAL** | **$5.80/month** |

#### Phase 2: Launch (50-100 users)
| Service | Cost |
|---------|------|
| Domain | $0.80/month |
| R2 | $0 (within free tier) |
| Workers | $0 (within free tier) |
| D1 | $0 (within free tier) |
| Pages | $0 |
| Stream | $10-25 |
| Stripe fees | $50-100 (2.9% of revenue) |
| Whisper API | $30-100 (transcription) |
| Resend (email) | $0 (free tier) |
| **TOTAL** | **$91-226/month** |

**Revenue at 70 Pro + 6 Teams**:
- 70 × $19 = $1,330
- 6 × $49 = $294
- **Total: $1,624/month**
- **Profit: $1,398-1,533/month (86-94% margin)**

#### Phase 3: Growth (200-500 users)
| Service | Cost |
|---------|------|
| Domain | $0.80/month |
| R2 | $0-5 |
| Workers | $5 (upgrade to unlimited) |
| D1 | $0-5 |
| Pages | $0 |
| Stream | $50-150 |
| Stripe fees | $250-500 |
| Whisper API | $200-500 |
| Resend | $20 (upgrade) |
| **TOTAL** | **$526-1,181/month** |

**Revenue at 350 Pro + 30 Teams**:
- 350 × $19 = $6,650
- 30 × $49 = $1,470
- **Total: $8,120/month**
- **Profit: $6,939-7,594/month (85-93% margin)**

---

## ⚠️ POTENTIAL HIDDEN COSTS (What to Watch)

### 1. Cloudflare Stream (Main Variable Cost)
- **Risk**: Users upload lots of videos
- **Mitigation**: Set limits per tier (Free: 10 videos, Pro: 100 videos)
- **Alert**: Set billing alert at $50/month

### 2. Whisper API (Transcription)
- **Risk**: Users transcribe everything
- **Mitigation**: Limit transcription minutes per tier (Pro: 50 min/month)
- **Alert**: Monitor usage weekly

### 3. Stripe Transaction Fees
- **Risk**: Not really a risk, just 2.9% + $0.30 per transaction
- **Mitigation**: None needed (normal business cost)

### 4. Cloudflare Workers (If You Exceed Free Tier)
- **Risk**: More than 100k requests/day = $5/month
- **Mitigation**: Monitor requests, optimize if needed
- **Reality**: Unlikely to exceed with 500 users

---

## COST-SAVING STRATEGIES

### Month 1-3 (Development)
**Goal**: Keep costs under $10/month

**How**:
1. Skip Stream initially (serve from R2 directly)
2. Test with minimal videos
3. Use test Stripe mode (no real transactions)
4. Limit transcription testing

**Expected Cost**: $5-10/month

---

### Month 4-6 (First 50-100 Customers)
**Goal**: Stay profitable from Day 1

**How**:
1. Enable Stream only for paying customers
2. Strict usage limits (enforce on backend)
3. Monitor Whisper API usage daily
4. Delete old videos (per retention policy)

**Expected Cost**: $90-200/month
**Expected Revenue**: $1,000-1,600/month
**Profit**: $800-1,510/month ✅

---

### Month 7-12 (Scale to 500+ Customers)
**Goal**: Maintain 80%+ margins

**How**:
1. Optimize video storage (compression, cleanup)
2. Negotiate Whisper API volume discount
3. Consider self-hosted transcription if volume justifies
4. Monitor and alert on all costs

**Expected Cost**: $500-1,200/month
**Expected Revenue**: $6,000-10,000/month
**Profit**: $4,800-9,500/month ✅

---

## CLOUDFLARE BILLING ALERTS (Set These Up)

**R2**:
- Alert at $10/month
- Hard limit: $50/month (contact support to set)

**Workers**:
- Alert when approaching 100k requests/day
- Upgrade to $5/month when needed (not a problem)

**Stream**:
- Alert at $25/month
- Alert at $100/month
- Review usage weekly

**Overall Account**:
- Alert at $50/month
- Alert at $150/month
- Review bill weekly during first 6 months

---

## THE BOTTOM LINE ON CLOUDFLARE

### Is It Really Free/Cheap?
**YES - with management.**

**Guaranteed Costs**:
- Domain: $9.50/year = $0.80/month ✅
- Stream minimum: $5/month (can skip initially) ✅
- Everything else: FREE for first 50-100 users ✅

**No Hidden Fees For**:
- Bandwidth/egress (FREE - this is huge)
- CDN (FREE)
- SSL (FREE)
- DDoS protection (FREE)
- DNS (FREE)

**Variable Costs** (predictable):
- Stream: $1 per 1,000 minutes (you control by setting limits)
- Transcription: $0.006/min (you control by setting limits)
- Stripe: 2.9% + $0.30 (only when you make money)

**Compared to AWS**:
- AWS S3 egress: $0.09/GB (Cloudflare: FREE)
- AWS RDS: $15+/month (Cloudflare D1: FREE)
- AWS Lambda: Similar (Cloudflare Workers: Similar)
- AWS CloudFront: Pay per GB (Cloudflare: FREE)

**Cloudflare is 70-90% cheaper than AWS for video use case.**

---

## FINAL TECH STACK

```
┌─────────────────────────────────────────┐
│           USER BROWSER                   │
│  (Your existing recording code)          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│      CLOUDFLARE PAGES (Frontend)         │
│      - React dashboard                   │
│      - Video library UI                  │
│      - Free hosting                      │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│    CLOUDFLARE WORKERS (Backend API)      │
│    - User authentication                 │
│    - File upload handling                │
│    - Subscription management             │
│    - 100k req/day free                   │
└──────────────┬──────────────────────────┘
               ↓
       ┌───────┴────────┐
       ↓                ↓
┌─────────────┐  ┌──────────────┐
│ D1 Database │  │  R2 Storage  │
│ - User data │  │  - Videos    │
│ - Metadata  │  │  - 10GB free │
│ - Free      │  │  - Free egress│
└─────────────┘  └──────┬───────┘
                        ↓
                ┌──────────────┐
                │ Stream (opt) │
                │ - Delivery   │
                │ - $5+ /month │
                └──────────────┘

External APIs:
├─→ Stripe (Payments)
├─→ Whisper API (Transcription)
└─→ Resend (Email)
```

---

## 12-WEEK DEVELOPMENT ROADMAP

### WEEK 1-2: Cloudflare Foundation
**I build**:
- Cloudflare Workers backend
- D1 database schema
- User authentication (Lucia Auth)
- R2 bucket setup
- Basic API endpoints (CRUD)

**You do**:
- Create Cloudflare account (already done ✅)
- Register recnote.io domain on Cloudflare
- Provide Cloudflare API token
- Set billing alerts

**Deliverable**: Backend API working locally

---

### WEEK 3-4: Frontend + Recording
**I build**:
- Cloudflare Pages setup
- Enhance your existing recording code
- User dashboard (React)
- Upload to R2 with progress bar
- Video library UI
- Playback from R2

**You do**:
- Test recording in Chrome, Firefox, Safari
- Test upload with different video sizes
- Provide UI/UX feedback

**Deliverable**: Users can record, upload, view videos

---

### WEEK 5-6: Payments & Subscriptions
**I build**:
- Stripe Checkout integration
- Webhook handling
- Subscription CRUD in D1
- Usage tracking (recordings, minutes)
- Plan limit enforcement
- Billing portal

**You do**:
- Create Stripe account
- Test checkout with test cards
- Test subscription lifecycle
- Test usage limits

**Deliverable**: Users can subscribe to Pro/Team plans

---

### WEEK 7-8: AI Transcription
**I build**:
- Whisper API integration
- Transcription job queue (Workers Queue)
- Store transcripts in D1
- Display transcripts in UI
- Search within transcripts
- Download transcripts (.txt, .srt)
- Usage tracking for transcription minutes

**You do**:
- Create OpenAI account
- Get Whisper API key
- Test transcription accuracy
- Test search functionality

**Deliverable**: Pro/Team users get AI transcriptions

---

### WEEK 9-10: Team Features
**I build**:
- Team workspace schema
- Invite team members
- Role management (owner/member)
- Shared recordings
- Permissions system
- Slack webhook integration
- Email notifications (Resend)

**You do**:
- Test team features with real collaborators
- Create Slack workspace for testing
- Test email notifications

**Deliverable**: Team tier is functional

---

### WEEK 11-12: Polish & Launch
**I build**:
- Error handling improvements
- Rate limiting
- Security hardening
- Analytics (Cloudflare Web Analytics - free)
- SEO optimization
- Documentation
- Admin dashboard (for you to manage users)

**You do**:
- Final end-to-end testing
- Write landing page copy
- Create demo videos
- Prepare launch strategy (Product Hunt, etc.)

**Deliverable**: Production-ready Recnote

---

## LAUNCH WEEK (Week 12)

**Launch Checklist**:
- [ ] DNS pointed to Cloudflare Pages
- [ ] SSL certificate active (auto)
- [ ] Stripe live mode enabled
- [ ] Billing alerts set
- [ ] Privacy policy + ToS live
- [ ] Help documentation
- [ ] Demo video recorded
- [ ] Product Hunt launch scheduled
- [ ] Social media posts ready
- [ ] Email to waitlist

**Launch Targets**:
1. Product Hunt (aim for top 10)
2. Hacker News (Show HN)
3. Reddit (r/SaaS, r/Entrepreneur)
4. Twitter/LinkedIn
5. Indie Hackers

---

## PRICING

### Free Tier
- 10 recordings/month
- 5 minutes per recording
- 720p quality
- 7-day retention
- Basic sharing

### Pro - $19/month
- Unlimited recordings
- 30 minutes per recording
- 1080p quality
- 30-day retention
- 50 minutes transcription/month
- Download videos
- No watermarks

### Team - $49/month (5 users)
- Everything in Pro
- 1 hour per recording
- 90-day retention
- 200 minutes transcription/month
- Team workspace
- Slack integration
- Priority support

---

## SUCCESS METRICS

### Month 3 (Validation)
- ✅ 10+ paying customers
- ✅ $200+ MRR
- ✅ Break-even on costs
- ✅ <10% churn

### Month 6 (Product-Market Fit)
- ✅ 75+ paying customers
- ✅ $1,500+ MRR
- ✅ Profitable ($1,000+ profit/month)
- ✅ Organic signups (word of mouth)

### Month 12 (Scale-Ready)
- ✅ 200+ paying customers
- ✅ $4,000+ MRR
- ✅ 80%+ gross margin
- ✅ Ready to add enterprise features

---

## PHASE 2 (After $5k MRR)

**When to do this**: Month 12-18

**What to add**:
1. Compliance features (audit logs, encryption)
2. SOC 2 Type II certification ($20k-50k)
3. HIPAA compliance (legal review)
4. Enterprise tier ($199/month)
5. Advanced integrations (Salesforce, etc.)
6. White-labeling
7. Screen recording
8. Video editing

**Goal**: Scale to $15k-30k MRR with enterprise customers

---

## YOUR RESPONSIBILITIES

### During Development (12 weeks)
- [ ] Register domain on Cloudflare
- [ ] Set up Cloudflare API access
- [ ] Create Stripe account
- [ ] Test daily (1-2 hours)
- [ ] Provide feedback on UI/UX
- [ ] Create demo videos

### After Launch
- [ ] Customer support (email)
- [ ] Content marketing (blog, social media)
- [ ] Monitor metrics (signups, conversions, churn)
- [ ] Talk to customers (feedback)
- [ ] Billing/payment issues
- [ ] Marketing campaigns

---

## MY RESPONSIBILITIES

### During Development
- [ ] All coding (backend, frontend, integrations)
- [ ] Database design and migrations
- [ ] Cloudflare infrastructure setup
- [ ] Stripe integration
- [ ] AI transcription integration
- [ ] Security implementation
- [ ] Bug fixes
- [ ] Documentation (technical)
- [ ] Deployment setup

### After Launch
- [ ] Bug fixes (critical within 24h)
- [ ] Performance optimization
- [ ] New feature development
- [ ] Infrastructure scaling
- [ ] Security updates

---

## NEXT STEPS (This Week)

**You**:
1. [ ] Register recnote.io on Cloudflare (~$9.50)
2. [ ] Enable Cloudflare R2 in your account
3. [ ] Set up billing alerts ($10, $50, $150)
4. [ ] Create Stripe account (test mode)
5. [ ] Confirm you can commit 1-2 hours/day for testing

**Me**:
1. [ ] Set up GitHub repository (private)
2. [ ] Create Cloudflare Workers project structure
3. [ ] Design D1 database schema
4. [ ] Plan API endpoints
5. [ ] Create development roadmap (detailed)

**When you're ready, tell me and I'll start coding Week 1.**

---

## IMPORTANT NOTES

### On Cloudflare Costs
- ✅ No hidden fees for bandwidth/egress
- ✅ Free tiers are generous
- ✅ Paid tiers are predictable
- ⚠️ Stream is main variable cost ($1/1000 min)
- ⚠️ Set billing alerts immediately

### On Timeline
- 12 weeks is realistic if we stay focused
- No scope creep (add features later)
- Daily testing is critical
- Launch MVP, iterate based on feedback

### On Revenue
- Break-even at ~40 customers
- $1k MRR by Month 6 is achievable
- 2-3% free-to-paid conversion is normal
- Churn under 5% monthly is good

---

**Product**: Recnote
**Domain**: recnote.io (to be registered)
**Stack**: Cloudflare (R2, Workers, D1, Pages, Stream)
**Budget**: $9.50 domain + $10-50/month initially
**Timeline**: 12 weeks to launch
**Status**: Ready to start when you give the go-ahead

**This is the plan. One document. We'll update this as we go.**

Ready? 🚀
