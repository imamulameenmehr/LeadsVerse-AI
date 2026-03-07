# Leadsverse AI - Open Source CRM Platform

![Leadsverse AI Dashboard](https://drive.google.com/uc?export=view&id=1RWht1rAS9LIp-iQ7ExTtePBj5Kx9fchX)

**Leadsverse AI** is a cutting-edge, open-source Customer Relationship Management (CRM) platform designed to supercharge your sales teams. It combines a sleek, premium dark-mode interface with intelligent AI-driven outreach capabilities, allowing your Extractors and Closers to focus entirely on converting leads into revenue without the pain of manual data entry.

> **Note:** This platform is proudly **Open Source**. You are free to fork, clone, and deploy it for your own business or agency!

---

## 🚀 Key Features

### 1. **AI-Powered Outreach Engine**
Leadsverse AI isn't just a database; it thinks for you. By leveraging the **Google Gemini API**, you can instantly generate hyper-personalized outreach messages (Email, LinkedIn, Instagram, WhatsApp) tailored perfectly to a Lead's industry, company size, and specific pain points.

### 2. **Roles & Collaboration**
Built-in Role-Based Access Control (RBAC):
- **Admins:** Full control over users, leads, data, and workspace settings.
- **Extractors:** Responsible for mining and adding high-quality leads into the system. Can track their own activities.
- **Closers:** Focus exclusively on engaging leads, logging calls, writing notes, and advancing the sales pipeline.

### 3. **Premium UI/UX Design**
Built from the ground up to look like a modern, expensive SaaS tool.
- Fully responsive Dashboard with analytical widgets.
- Glassmorphism & Neon accenting (`#d9ff54`) specifically tailored for dark mode.
- Blazing-fast Global Search and instant filter mechanics.

### 4. **Granular Lead Tracking**
Track over 20+ specific data points per lead, including:
- Firmographics (Industry, Revenue, Company Size).
- Budgets (Client Budget vs. Quoted Price).
- Stage Progression (New -> Contacted -> Demo Scheduled -> Closed Won).
- `Next Follow-Up` and historical Activity Timelines.

### 5. **Safe Data Management**
- Secure User Profiles handling (change names, cities, phone numbers).
- **Graceful Deletion**: Deleting staff members does *not* corrupt your historical data. Their logged activities and assigned leads are safely detached and preserved.
- Custom toast notifications (`react-hot-toast`) and secure destructive confirmation modals instead of boring browser alerts.

---

## 📸 Application Gallery

<details>
<summary><b>Click to View Extensive UI Screenshots</b></summary>

### 📊 Main Dashboard
![Dashboard](https://drive.google.com/uc?export=view&id=1RWht1rAS9LIp-iQ7ExTtePBj5Kx9fchX)

### 👥 All Leads Board
![All Leads](https://drive.google.com/uc?export=view&id=1sSjKgIEcBMeCPTUFaYMs6tL3Y4pzjNzT)

### 📈 Sales Pipeline
![Pipeline](https://drive.google.com/uc?export=view&id=1gPPwnPUPp7VBhhT_HX5YubY1eLmdGA4_)

### 📉 Analytics & Metrics
![Analytics](https://drive.google.com/uc?export=view&id=10PAPSw8V9nSfXKS9gEz-O0pnNnmCpbol)

### 🔍 Lead 360° View (Info Tab)
![Lead Info](https://drive.google.com/uc?export=view&id=1IQcjfjburVdClQ9QAjtJJ03z2PpUz_S9)

### ⚡ Lead Activity Feed & AI Logging
![Lead Activity](https://drive.google.com/uc?export=view&id=188r8RZiPrwij2W2U258lg8Pu8_-E5aai)

### 🤖 AI Outreach Personalization
![AI Outreach](https://drive.google.com/uc?export=view&id=1Qo_qhkDqRFtLDo7t1_G5BCjvNDfK7Y_m)

### 💰 Lead Financials & Quotations
![Lead Financials](https://drive.google.com/uc?export=view&id=16K6TrS1dddOpXrPqtk-hmP0_TanwcZuz)

### 📓 Lead Notes Hub
![Lead Notes](https://drive.google.com/uc?export=view&id=1rU7-JD5OKek4bl-nibAxBN42eX_Vb1WP)

### ➕ Pipeline Data Entry (New Lead)
![New Lead Form](https://drive.google.com/uc?export=view&id=1uSiTCF5R2dsLF8nojnXkdv90tYqbQtPp)

### 📝 Editing Real-Time Lead Data
![Lead Edit](https://drive.google.com/uc?export=view&id=12lOnkjRlYx78Uxtvg-J67nyrZjCUhyDi)

### ⚙️ Workspace Administration & Settings
![Settings](https://drive.google.com/uc?export=view&id=1aZ4moyqLP4mh7X7bhgxE65Fu_qYNw9kR)

### 👨‍💻 User Profile Management
![User Profile](https://drive.google.com/uc?export=view&id=14319Uh4u8FFSkbYdhdNjkqrqW-fYLPmD)

</details>

---

## 🛠️ Tech Stack

- **Frontend Configuration:** [Next.js 15 (App Router)](https://nextjs.org/) & React 19
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & Lucide React Icons
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL & Auth)
- **AI Integration:** Google Generative AI (`@google/genai`)
- **Deployment:** Vercel

---

## 🌐 Getting Started (Deploy Your Own)

Since this project is open-source, launching your own instance is incredibly simple.

### Prerequisites
1. A free **Supabase** account.
2. A free **Google Gemini** API Key.
3. Node.js (v18+)

### 1. Clone the Repository
```bash
git clone https://github.com/imamulameenmehr/LeadsVerse-AI.git
cd LeadsVerse-AI
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase and Gemini credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Required for AI Outreach functionality
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Locally
```bash
npm run dev
```
Navigate to `http://localhost:3000` to start exploring your CRM.

### 4. Database Setup
To match the repository code, run the following SQL snippet inside your Supabase **SQL Editor** to structure your remote database properly:
```sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['call'::text, 'sms'::text, 'email'::text, 'note'::text, 'stage_change'::text, 'whatsapp'::text, 'instagram_dm'::text, 'linkedin_dm'::text, 'facebook_dm'::text, 'twitter_dm'::text, 'tiktok_dm'::text, 'meeting'::text, 'demo'::text, 'voicemail'::text, 'no_answer'::text, 'follow_up'::text])),
  outcome text,
  follow_up_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  owner_name text,
  phone_primary text,
  phone_secondary text,
  email_primary text,
  email_secondary text,
  website text,
  city text,
  state text,
  address text,
  rating numeric,
  total_reviews integer,
  client_type text,
  lead_source text,
  lead_score integer DEFAULT 0,
  pain_point text,
  notes text,
  assigned_to uuid,
  stage text NOT NULL DEFAULT 'new'::text CHECK (stage = ANY (ARRAY['new'::text, 'contacted'::text, 'decision_maker'::text, 'interested'::text, 'demo_scheduled'::text, 'proposal_sent'::text, 'closed_won'::text, 'closed_lost'::text])),
  proposed_solution text,
  quoted_price numeric DEFAULT 0,
  client_budget numeric DEFAULT 0,
  probability_percent integer DEFAULT 0 CHECK (probability_percent >= 0 AND probability_percent <= 100),
  expected_mrr numeric DEFAULT round(((quoted_price * (probability_percent)::numeric) / 100.0), 2),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_activity_at timestamp with time zone,
  next_follow_up_at timestamp with time zone,
  emails jsonb DEFAULT '[]'::jsonb,
  phones jsonb DEFAULT '[]'::jsonb,
  social_links jsonb DEFAULT '[]'::jsonb,
  industry text,
  company_size text,
  annual_revenue text,
  lead_status text,
  priority text,
  expected_close_date date,
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'closer'::text CHECK (role = ANY (ARRAY['admin'::text, 'closer'::text, 'extractor'::text])),
  created_at timestamp with time zone DEFAULT now(),
  phone text,
  city text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

---

## ☁️ Deploying to Vercel

The quickest way to host your own instance of Leadsverse AI is via Vercel.

1. Push your cloned code to your own GitHub repository.
2. Go to [Vercel](https://vercel.com/) and "Add New Project".
3. Import your GitHub repository.
4. Add the **Environment Variables** listed above into the Vercel Build settings.
5. Click **Deploy**.

Within minutes, your custom CRM will be live globally!

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/imamulameenmehr/LeadsVerse-AI/issues) if you want to contribute.

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
