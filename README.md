# Leadsverse AI - Open Source CRM Platform

![Leadsverse AI Header](https://via.placeholder.com/1200x400/121212/d9ff54?text=Leadsverse+AI)

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
