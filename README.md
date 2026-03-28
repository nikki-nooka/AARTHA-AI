# Artha: AI-Powered Environmental Health Intelligence

**Translating complex environmental data into clear, actionable health intelligence to empower communities and preempt public health threats.**

---

## 🌍 Overview

Artha is a sophisticated, AI-driven web application designed to bridge the critical gap between environmental factors and public health. By leveraging Google's **Gemini 3 Flash** and **Imagen 4** models, Artha provides users with real-time, location-specific health insights, proactive hazard detection, and personalized wellness tools.

The platform operates on a hybrid architecture using **Local Storage** for rapid prototyping and **Firebase** for cloud-ready data persistence and security rules.

---

## 🚀 Key Features

### 1. Interactive 3D Globe Explorer
*   **Visual Exploration:** A high-fidelity 3D globe (`react-globe.gl`) allowing users to explore any point on Earth.
*   **City Health Snapshots:** Click on major cities to generate a real-time public health report derived from current web data (using **Google Search Grounding**). Includes disease trends, case estimates, and summaries.
*   **Location Analysis:** Click any coordinate to generate a localized environmental hazard report and a synthetic satellite visualization of that specific biome using **Imagen 4.0**.
*   **Geocoding:** Integrated search bar to fly to specific locations instantly with high-accuracy coordinates.

### 2. AI Analysis Suite
*   **🩺 Advanced Symptom Checker:** A voice-enabled interface with a sophisticated **4-Level Triage System** (Emergency, Urgent, Routine, Home Care). Provides color-coded visual feedback, potential conditions for discussion, and actionable next steps.
*   **📸 Area Scan (Image Analysis):** Upload photos of your surroundings. The AI identifies potential health hazards (e.g., stagnant water, pollution) and suggests preventive measures.
*   **📜 Prescription Reader:** Powered by a "Clinical Pharmacist" persona, it extracts medicine names, dosages, and precautions from images into a legible summary.
*   **🧠 Mental Wellness Check-in:** A compassionate, non-clinical wellness assistant that provides supportive reflection and coping strategies based on user responses.
*   **🏥 Personalized Health Visit:** A dedicated checkup interface featuring an integrated health assessment form for personalized medical consultations.

### 3. Real-Time Health Intelligence
*   **HealthCast:** A daily, location-based health forecast analyzing risk factors like Air Quality, UV Index, Pollen, and Mosquito activity using real-time data.
*   **Live Health Alerts:** Aggregates and displays significant global and local disease outbreaks or environmental threats using **Google Search Grounding**.
*   **Facility Finder:** Automatically locates the 5 closest Hospitals, Clinics, and Pharmacies based on the user's precise GPS coordinates using **Google Maps Grounding**.

### 4. Personal Health Utilities
*   **💧 Water Log:** A hydration tracker with customizable goals and browser-based push notifications for drink reminders.
*   **Activity History:** A local log of all AI analyses performed by the user for future reference.
*   **Profile Management:** Manage personal details and change passwords locally.

### 5. Advanced UI/UX
*   **AI Chatbot:** A persistent, voice-capable assistant that can answer health questions and **navigate the app** via voice commands (e.g., "Take me to the symptom checker").
    *   **Voice-First Responsiveness:** Features auto-send on silence detection, smart voice output (always speaks back to voice input), and visual "speaking" indicators.
*   **Admin Dashboard:** A comprehensive dashboard for viewing all registered users and global activity logs. *Note: For the current demo phase, all signed-up users are granted admin access.*
*   **Multilingual Support:** Full UI and AI response support for **15+ languages**, including major Indic languages (Hindi, Telugu, Bengali, Tamil, etc.).

---

## 🛠 Supabase Integration (New)

The app is now integrated with Supabase for centralized data storage and "pin-to-pinpoint" action tracking.

### Setup Instructions

1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com) and create a new project.
2.  **Run SQL in Supabase SQL Editor:**
    ```sql
    -- 1. Create users table
    CREATE TABLE IF NOT EXISTS users (
        phone TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        password TEXT NOT NULL,
        date_of_birth TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE,
        is_admin BOOLEAN DEFAULT FALSE
    );

    -- 2. Create activity_history table
    CREATE TABLE IF NOT EXISTS activity_history (
        id BIGSERIAL PRIMARY KEY,
        user_phone TEXT REFERENCES users(phone),
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        data JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 3. Create water_log table
    CREATE TABLE IF NOT EXISTS water_log (
        id BIGSERIAL PRIMARY KEY,
        user_phone TEXT REFERENCES users(phone),
        amount INTEGER NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 4. Enable Row Level Security (RLS)
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE activity_history ENABLE ROW LEVEL SECURITY;
    ALTER TABLE water_log ENABLE ROW LEVEL SECURITY;

    -- 5. Create Policies (Allow all for simplicity)
    CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);
    CREATE POLICY "Allow all access to activity_history" ON activity_history FOR ALL USING (true);
    CREATE POLICY "Allow all access to water_log" ON water_log FOR ALL USING (true);
    ```
3.  **Environment Variables:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your `.env` file (see `.env.example`).

Artha is built with a modern, performance-oriented stack:

*   **Frontend Framework:** React 19 with TypeScript.
*   **Build Tool:** Vite.
*   **Styling:** Tailwind CSS with custom animations.
*   **Artificial Intelligence:**
    *   **SDK:** `@google/genai`
    *   **Text & Multimodal:** `gemini-3-flash-preview` (Used for analysis, chat, and search grounding).
    *   **Image Generation:** `imagen-4.0-generate-001` (Used for location visualization).
    *   **Search Grounding:** Integrated `googleSearch` and `googleMaps` tools for retrieving real-time world events and health data.
*   **Visualization:** `react-globe.gl` and `three.js`.
*   **Backend & Security:**
    *   **Firebase:** Configured for Firestore database and Authentication.
    *   **Security Rules:** Prototype rules implemented to protect user data and manage roles.
    *   **Local Storage:** Used for rapid client-side data handling and session management.
*   **Browser APIs:** Web Speech API (Voice Input/Output), Geolocation API, Notification API.

---

## 📦 Installation & Setup

Follow these steps to run Artha locally.

### Prerequisites
*   Node.js (v18 or higher)
*   npm or yarn
*   A Google Gemini API Key

### Steps

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/artha.git
    cd artha
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory and add your API key.
    ```env
    API_KEY=your_actual_google_gemini_api_key
    ```
    *Note: Ensure your API key has access to Gemini Flash and Imagen models via Google AI Studio.*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000`.

---

## 🔐 User & Admin Access (Demo Mode)

**Default Admin Account:**
*   **Email:** `likhithapacha4@gmail.com`
*   **Password:** `mahadev`

*Log in with these credentials or create a new account to access the **Admin Dashboard** in the sidebar.*

---

## ⚠️ Medical Disclaimer

**Artha is an informational tool powered by Artificial Intelligence.**

*   It is **NOT** a substitute for professional medical advice, diagnosis, or treatment.
*   Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
*   Never disregard professional medical advice or delay in seeking it because of something you have read on this application.
*   In case of a medical emergency, call your local emergency services immediately.

---

## 📄 License

This project is open-source and available under the **MIT License**.
