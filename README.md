# Artha: AI-Powered Environmental Health Intelligence 🌍

**Artha** (also known as **GeoSick**) is a sophisticated, AI-driven web application designed to bridge the critical gap between environmental factors and public health. By leveraging Google's **Gemini 3 Flash** and **Imagen 4** models, Artha provides users with real-time, location-specific health insights, proactive hazard detection, and personalized wellness tools.

---

## 🚀 Key Features

### 1. Interactive 3D Globe Explorer
*   **Visual Exploration:** A high-fidelity 3D globe (`react-globe.gl`) allowing users to explore any point on Earth with smooth animations and interactive markers.
*   **City Health Snapshots:** Click on major cities to generate a real-time public health report derived from current web data (using **Google Search Grounding**). Includes disease trends, case estimates, and summaries.
*   **Location Analysis:** Click any coordinate to generate a localized environmental hazard report and a synthetic satellite visualization of that specific biome using **Imagen 4.0**.
*   **Facility Finder:** Automatically locates the 5 closest Hospitals, Clinics, and Pharmacies based on the user's precise GPS coordinates using **Google Maps Grounding**.
*   **Geocoding:** Integrated search bar to fly to specific locations instantly with high-accuracy coordinates.

### 2. AI Analysis Suite
*   **🩺 Advanced Symptom Checker:** A voice-enabled interface with a sophisticated **4-Level Triage System** (Emergency, Urgent, Routine, Home Care). Provides color-coded visual feedback, potential conditions for discussion, and actionable next steps.
*   **📸 Area Scan (Image Analysis):** Upload photos of your surroundings. The AI identifies potential health hazards (e.g., stagnant water, pollution) and suggests preventive measures.
*   **📜 Prescription Reader:** Powered by a "Clinical Pharmacist" persona, it extracts medicine names, dosages, and precautions from images into a legible summary.
*   **🧠 Mental Wellness Check-in:** A compassionate, non-clinical wellness assistant that provides supportive reflection and coping strategies based on user responses.
*   **🏥 Personalized Health Visit:** A dedicated checkup interface featuring an integrated health assessment form for personalized medical consultations.

### 3. Medical Network & Logistics (New)
*   **🏥 Medical Network:** A centralized hub to connect with medical partners and healthcare providers. View partner analytics, manage connections, and expand your health ecosystem.
*   **🚚 Smart Logistics:** AI-powered medicine route analysis. Enter origin and destination to get the best delivery routes, estimated times, and expert logistics analysis.
*   **📦 Delivery Tracking:** Real-time tracking interface for medical supplies and prescriptions, ensuring transparency in the health supply chain.

### 4. Real-Time Health Intelligence
*   **HealthCast:** A daily, location-based health forecast analyzing risk factors like Air Quality, UV Index, Pollen, and Mosquito activity using real-time data.
*   **Live Health Alerts:** Aggregates and displays significant global and local disease outbreaks or environmental threats using **Google Search Grounding**.

### 5. Personal Health Utilities
*   **💧 Water Log:** A hydration tracker with customizable goals and browser-based push notifications for drink reminders.
*   **📊 Activity Dashboard:** Visual widgets for tracking weekly activity trends and hydration progress at a glance.
*   **Activity History:** A cloud-synced log of all AI analyses performed by the user for future reference.
*   **Profile Management:** Manage personal details, gender, and location preferences.

### 6. Advanced UI/UX
*   **AI Chatbot:** A persistent, voice-capable assistant that can answer health questions and **navigate the app** via voice commands (e.g., "Take me to the symptom checker").
*   **Admin Dashboard:** A comprehensive dashboard for viewing all registered users and global activity logs, with "Sync All" capabilities to Supabase.
*   **Multilingual Support:** Full UI and AI response support for **15+ languages**, including Hindi, Telugu, Bengali, Tamil, and more.

---

## 🛠 Tech Stack

*   **Frontend:** React 19, TypeScript, Vite.
*   **Styling:** Tailwind CSS (v4), Lucide Icons.
*   **Animations:** Motion (Framer Motion).
*   **AI Models:** 
    *   **Gemini 3 Flash:** Core reasoning, chat, and search grounding.
    *   **Imagen 4.0:** Biome visualization.
*   **Database & Backend:** 
    *   **Supabase:** Cloud-sync for users, activity logs, and water data.
    *   **Local Storage:** Primary data store for offline-first responsiveness.
*   **APIs:** Google Search Grounding, Google Maps Grounding, Web Speech API.

---

## 📦 Installation & Setup

### 1. Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key (from [AI Studio](https://aistudio.google.com/))
*   A Supabase Project (from [Supabase](https://supabase.com/))

### 2. Clone and Install
```bash
git clone <your-repo-url>
cd artha
npm install
```

### 3. Environment Variables
Create a `.env` file or update your AI Studio settings:
```env
# Google Gemini API
VITE_GEMINI_API_KEY=your_gemini_key

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Supabase Database Setup
Run this SQL in your Supabase SQL Editor to create the necessary tables:

```sql
-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    date_of_birth TEXT,
    gender TEXT,
    place TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_admin BOOLEAN DEFAULT FALSE
);

-- 2. Create activity_history table
CREATE TABLE IF NOT EXISTS activity_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_phone TEXT REFERENCES users(phone),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create water_log table
CREATE TABLE IF NOT EXISTS water_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_phone TEXT REFERENCES users(phone),
    amount INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS and Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON activity_history FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON water_log FOR ALL USING (true) WITH CHECK (true);
```

### 5. Run the App
```bash
npm run dev
```

---

## 🔐 Admin Access
*   **Default Admin:** `likhithapacha4@gmail.com` / `mahadev`
*   All new signups are currently granted admin access for demo purposes.

---

## ⚠️ Medical Disclaimer
Artha is an informational tool powered by AI. It is **NOT** a substitute for professional medical advice, diagnosis, or treatment. In case of a medical emergency, call your local emergency services immediately.

---

## 📄 License
This project is licensed under the **MIT License**.
