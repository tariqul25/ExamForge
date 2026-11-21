# 🎓 ExamForge — Smart Competitive Exam & Job Preparation Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-2.5_Flash-orange?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-Mongoose-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Netlify](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://examforge-live.netlify.app)

> **Live Demo:** [https://examforge-live.netlify.app](https://examforge-live.netlify.app)

---

## 📖 Overview

**ExamForge** is an AI-powered study and examination platform designed for candidates preparing for competitive exams (such as BCS, Bank Recruitment, PSC, University Admissions, and Job Tests). 

Learners can generate authentic, curriculum-aligned **MCQ and Written Examinations** simply by uploading photos of textbook pages and notes, or by entering any syllabus topic. The platform provides timer-based test sessions, instant scoring with negative marking, step-by-step bilingual explanations, LaTeX math rendering, and long-term revision tracking.

---

## ✨ Key Features

### 🧠 1. AI-Powered Exam Generation (Multimodal)
- **Document & Note Extraction:** Upload high-resolution photos or scans of textbooks and handwritten lecture notes.
- **Topic-Based Generation:** Create custom exams for any topic across **Bangla**, **English**, **Mathematics**, **General Knowledge (Bangladesh & International)**, and **ICT**.
- **Adjustable Difficulty & Mix:** Easy, Medium, or Job-Exam Standard with customizable question volume and negative marking rules.

### 📝 2. Dual Examination Modes
- **Interactive MCQ Engine:** Realistic exam simulation with real-time countdown timer, progress tracker, and immediate review with detailed answer explanations.
- **Written Exam Platform:** Descriptive questions with comprehensive model answers, key scoring points, and self-assessment scoring rubrics.
- **LaTeX Math Rendering:** Complete support for complex mathematical formulas, equations, and fractions powered by KaTeX.

### 🔄 3. Smart Revision & Study Hub
- **Bookmark & Review:** Automatically or manually save challenging questions to your personal Revision Hub.
- **Mastery Tracker:** Mark questions as reviewed or master them over time to ensure retention.

### 📊 4. Performance Analytics Dashboard
- Track completed exams, overall accuracy rates, average scores, and subject proficiency charts built with **Recharts**.

### 🔒 5. Enterprise-Grade Security & Authentication
- **Dual Authentication:** Fast Google Sign-In popup (Firebase Auth) or traditional email/password login.
- **Zero Secret Exposure:** All API keys, database connection strings, and admin credentials are strictly confined to environment variables (`.env.local`) and excluded from Git.
- **Hardened Cookies:** Session cookies configured with `httpOnly: true`, `sameSite: 'lax'`, and `secure` in production to prevent XSS and CSRF attacks.
- **Protected Administration:** Administrative settings and data reset tools are restricted to authorized admin accounts.

### 🌓 6. Adaptive Night-Study Theme
- Eye-comfort Dark Mode and high-contrast Light Mode with instant theme persistence.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Server-Side Rendering, API Routes) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS with custom Dark Mode support |
| **Artificial Intelligence** | Google Gemini API (`@google/genai`) |
| **Database** | MongoDB Atlas with Mongoose ODM (with automatic resilient In-Memory fallback) |
| **Authentication** | Firebase Authentication (Google OAuth) + Custom JWT/Session Cookie |
| **Math Engine** | KaTeX |
| **Icons & Charts** | Lucide React & Recharts |
| **Hosting & CDN** | Netlify (via Netlify Functions & Blobs) |

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18.17+ or v20+
- [Git](https://git-scm.com/)
- (Optional) Free API Key from [Google AI Studio](https://aistudio.google.com/)
- (Optional) Free Cluster from [MongoDB Atlas](https://cloud.mongodb.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/ExamForge.git
   cd ExamForge
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API credentials:
   ```env
   # Google Gemini AI Key
   GEMINI_API_KEY="your_gemini_api_key"

   # MongoDB Connection
   MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/examforge?retryWrites=true&w=majority"

   # Firebase Auth Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.firebasestorage.app"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
   NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

   # Admin & Security
   ADMIN_EMAIL="admin@examforge.com"
   ADMIN_PASSWORD="your_secure_admin_password"
   AUTH_SECRET="your_random_secret_string"
   ```

4. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment on Netlify

This project includes pre-configured [netlify.toml](./netlify.toml) settings for Netlify's Next.js Runtime:

1. **Log in to Netlify CLI:**
   ```bash
   npx netlify login
   ```
2. **Build and deploy:**
   ```bash
   npx netlify deploy --prod
   ```
3. **Import Environment Variables:**
   ```bash
   npx netlify env:import .env.local
   ```

---

## 🔐 Security & Privacy Policy

- **No Secrets in Source:** Secret tokens and keys are never committed to version control.
- **Restricted Access:** Administrative endpoints (`/api/backup`, Settings) require verified administrator credentials.
- **Database Safety:** Passwords are encrypted using SHA-256 with custom environment salts (`AUTH_SECRET`).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
