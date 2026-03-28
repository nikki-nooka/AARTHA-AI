import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import type { Alert, AlertCategory, AnalysisResult, LocationAnalysisResult, Facility, PrescriptionAnalysisResult, HealthForecast, MentalHealthResult, SymptomAnalysisResult, Page, BotCommandResponse, AlertSource, CityHealthSnapshot, MedicineRouteAnalysisResult } from '../types';
import * as cache from './cacheService';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robust wrapper with exponential backoff to handle 429/500 errors.
 */
async function callGeminiWithRetry<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 4,
    initialDelay: number = 2000
): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCall();
        } catch (error: any) {
            const errStr = error.toString();
            const isRetryable = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('500') || errStr.includes('503');

            if (isRetryable && attempt < maxRetries - 1) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.warn(`Gemini Quota/Error hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
                await sleep(delay);
                attempt++;
            } else {
                throw error;
            }
        }
    }
    throw new Error('Exceeded maximum retries for Gemini API.');
}

const locationAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING },
        hazards: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    hazard: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["hazard", "description"]
            }
        },
        diseases: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    cause: { type: Type.STRING },
                    precautions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "cause", "precautions"]
            }
        },
        summary: { type: Type.STRING }
    },
    required: ["locationName", "hazards", "diseases", "summary"]
};

export const analyzeLocationByCoordinates = async (lat: number, lng: number, language: string, knownLocationName?: string): Promise<{ analysis: LocationAnalysisResult, imageUrl: string | null }> => {
    const cacheKey = `loc_v3_${lat.toFixed(4)}_${lng.toFixed(4)}_${language}`;
    const cached = cache.get<{ analysis: LocationAnalysisResult, imageUrl: string | null }>(cacheKey);
    if (cached) return cached;

    const contents = `Perform a forensic environmental health analysis for coordinates: latitude ${lat}, longitude ${lng}. 
    Location Context: ${knownLocationName || 'Unnamed area'}.
    Identify specific local hazards: water quality issues, industrial air pollutants, vector-borne disease clusters (e.g. Dengue, Malaria), and terrain risks.
    Provide actionable precautions in ${language}. Return JSON.`;

    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: locationAnalysisSchema,
            tools: [{ googleSearch: {} }]
        }
    }));

    const analysis = JSON.parse(response.text);
    const result = { analysis, imageUrl: null }; // Disabled expensive Imagen call to save credits
    cache.set(cacheKey, result, 1440); // Cache for 24 hours
    return result;
};

export const analyzeImage = async (base64ImageData: string, language: string): Promise<AnalysisResult> => {
    const prompt = `You are an Expert Forensic Environmental Health Analyst. 
    Analyze this image with extreme scrutiny for health risks.
    1. INDOOR RISKS: Look for signs of dampness/mold, poor ventilation (dust on vents), poor ergonomics, or indicators of lead paint/asbestos if applicable.
    2. OUTDOOR RISKS: Identify stagnant water (mosquito breeding), industrial smog/haze, waste mismanagement, or hazardous construction.
    3. CORRELATION: Map every identified hazard to specific environmental diseases (e.g., Dengue, Asthma, Cholera, Dermatitis).
    4. Provide detailed, specific preventive measures.
    The tone must be clinical and comprehensive. Response Language: ${language}. Return JSON.`;

    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64ImageData } }, { text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema: locationAnalysisSchema }
    }));

    return JSON.parse(response.text);
};

const facilitiesSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Hospital', 'Clinic', 'Pharmacy'] },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
        },
        required: ["name", "type", "lat", "lng"]
    }
};

export const findFacilitiesByCoordinates = async (coords: { lat: number; lng: number }): Promise<Omit<Facility, 'distance'>[]> => {
    const cacheKey = `hospitals_v4_${coords.lat.toFixed(3)}_${coords.lng.toFixed(3)}`;
    const cached = cache.get<Omit<Facility, 'distance'>[]>(cacheKey);
    if (cached) return cached;

    // Pass 1: Search for real-world places using Google Maps Grounding.
    const searchResponse = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `List the names and addresses of the 5 closest hospitals, clinics, and pharmacies to GPS coordinates ${coords.lat}, ${coords.lng}.`,
        config: { 
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude: coords.lat,
                        longitude: coords.lng
                    }
                }
            }
        }
    }));

    // Pass 2: Extract structured data. Using a very concise prompt to save tokens.
    const structureResponse = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Extract JSON array from: "${searchResponse.text}". Schema: name, type (Hospital/Clinic/Pharmacy), lat, lng.`,
        config: { 
            responseMimeType: "application/json", 
            responseSchema: facilitiesSchema 
        }
    }));

    try {
        const parsed = JSON.parse(structureResponse.text);
        const results = Array.isArray(parsed) ? parsed : [];
        cache.set(cacheKey, results, 10080); // Cache for 1 week
        return results;
    } catch {
        return [];
    }
};

export const analyzePrescription = async (base64ImageData: string, language: string): Promise<PrescriptionAnalysisResult> => {
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { 
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } }, 
                { text: `You are a highly accurate medical transcriptionist and clinical pharmacist. 
                Analyze this prescription image and extract the following information in ${language}:
                1. SUMMARY: A brief overview of the prescription.
                2. MEDICINES: A list of medicines, including their names and dosages.
                3. PRECAUTIONS: A list of specific precautions or instructions for the patient.
                
                Return the response as a JSON object matching the PrescriptionAnalysisResult schema.` }
            ] 
        },
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    medicines: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                dosage: { type: Type.STRING }
                            },
                            required: ["name", "dosage"]
                        }
                    },
                    precautions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["summary", "medicines", "precautions"]
            }
        }
    }));
    return JSON.parse(response.text);
};

export const getBotCommand = async (prompt: string, language: string, availablePages: Page[]): Promise<BotCommandResponse> => {
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the GeoSick Assistant, a helpful AI guide for a health and environmental analysis app.
        
        User Input: "${prompt}"
        Current Language: ${language}
        Available Pages for Navigation: ${availablePages.join(', ')}
        
        Page Descriptions:
        - welcome: The home/dashboard page.
        - image-analysis: Analyze environmental health from an image.
        - prescription-analysis: Scan and analyze medical prescriptions.
        - mental-health: Wellness and mental health check-in.
        - symptom-checker: Check symptoms and get triage advice.
        - checkup: Schedule a personalized in-person health check-up or visit.
        - water-log: Track daily water intake.
        - activity-history: View past health analyses and logs.
        - profile: User profile and settings.
        - about: Information about GeoSick.
        - contact: Contact support or the team.
        - explore: Interactive globe to explore health data.
        - partners: Information for health partners and branches.
        - admin-dashboard: Admin view for system activity.
        
        Your task is to determine the user's intent and return a JSON response with:
        1. action: 'navigate' or 'speak'
        2. page: the page to navigate to (if action is 'navigate')
        3. responseText: a helpful response in ${language} explaining what you are doing.
        
        Rules:
        - If the user wants to go somewhere (e.g., "schedule a check up", "check symptoms", "analyze image", "see history"), set action to 'navigate' and pick the most relevant page from the list above.
        - If the user asks a question or just wants to chat, set action to 'speak' and provide a helpful response.
        - Be concise and friendly.
        
        Return JSON matching the BotCommandResponse schema.`,
        config: { 
            responseMimeType: "application/json",
            systemInstruction: "You are GeoSick Assistant. Be extremely concise and helpful. Minimize token usage.",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    action: { type: Type.STRING, enum: ['navigate', 'speak'] },
                    page: { type: Type.STRING },
                    responseText: { type: Type.STRING }
                },
                required: ["action", "responseText"]
            }
        }
    }));
    return JSON.parse(response.text);
};

export const geocodeLocation = async (query: string): Promise<{ lat: number, lng: number, foundLocationName: string }> => {
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find the precise GPS coordinates (latitude and longitude) and the official name for the location: "${query}". 
        
        Return the response as a JSON object with:
        1. lat: latitude (number)
        2. lng: longitude (number)
        3. foundLocationName: the official name of the location found.
        
        Use Google Search to ensure accuracy.`,
        config: { 
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }],
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    lat: { type: Type.NUMBER },
                    lng: { type: Type.NUMBER },
                    foundLocationName: { type: Type.STRING }
                },
                required: ["lat", "lng", "foundLocationName"]
            }
        }
    }));
    return JSON.parse(response.text);
};

const healthForecastSchema = {
    type: Type.OBJECT,
    properties: {
        locationName: { type: Type.STRING },
        summary: { type: Type.STRING },
        riskFactors: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    level: { type: Type.STRING, enum: ['Low', 'Moderate', 'High', 'Very High'] },
                    description: { type: Type.STRING }
                },
                required: ["name", "level", "description"]
            }
        },
        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["locationName", "summary", "riskFactors", "recommendations"]
};

export const getHealthForecast = async (coords: { lat: number; lng: number }, language: string): Promise<HealthForecast> => {
    const cacheKey = `health_forecast_v4_${coords.lat.toFixed(2)}_${coords.lng.toFixed(2)}_${language}`;
    const cached = cache.get<HealthForecast>(cacheKey);
    if (cached) return cached;

    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Health briefing for GPS ${coords.lat}, ${coords.lng} in ${language}. Air Quality, UV, Pollen, Mosquito Activity. Use real-time data. Return JSON.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: healthForecastSchema,
            tools: [{ googleSearch: {} }]
        }
    }));
    const result = JSON.parse(response.text);
    cache.set(cacheKey, result, 360); // Cache for 6 hours
    return result;
};

const mentalHealthSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        potentialConcerns: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["name", "explanation"]
            }
        },
        copingStrategies: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["title", "description"]
            }
        },
        recommendation: { type: Type.STRING }
    },
    required: ["summary", "potentialConcerns", "copingStrategies", "recommendation"]
};

export const analyzeMentalHealth = async (answers: Record<string, string>, language: string): Promise<MentalHealthResult> => {
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a compassionate, non-clinical wellness assistant. 
        Analyze the following responses from a mental health check-in: ${JSON.stringify(answers)}.
        
        Your goal is to provide a supportive, reflective, and encouraging analysis in ${language}.
        
        Follow these rules:
        1. BE SUPPORTIVE: Use a warm, empathetic tone.
        2. NO DIAGNOSIS: Do not provide clinical diagnoses. Use terms like "potential concerns to reflect on".
        3. COPING STRATEGIES: Provide 3-5 practical, gentle coping strategies (e.g., mindfulness, journaling, light exercise).
        4. RECOMMENDATION: Provide a final encouraging recommendation, including a suggestion to talk to a professional if needed.
        
        Return the response as a JSON object matching the mentalHealthSchema.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: mentalHealthSchema
        }
    }));
    return JSON.parse(response.text);
};

const symptomAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        triageRecommendation: { type: Type.STRING },
        triageLevel: { type: Type.STRING, enum: ['emergency', 'urgent', 'routine', 'home'] },
        potentialConditions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["name", "description"]
            }
        },
        nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
        disclaimer: { type: Type.STRING }
    },
    required: ["summary", "triageRecommendation", "triageLevel", "potentialConditions", "nextSteps", "disclaimer"]
};

export const analyzeSymptoms = async (symptoms: string, language: string): Promise<SymptomAnalysisResult> => {
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert medical triage assistant with decades of experience in emergency medicine. 
        Analyze the following symptoms provided by a user: "${symptoms}".
        
        Your goal is to provide a highly accurate, cautious, and structured triage assessment in ${language}.
        
        Follow these strict clinical rules:
        1. BE EXTREMELY CAUTIOUS: Always prioritize safety. If there are any "red flags" (chest pain, severe difficulty breathing, sudden weakness, severe bleeding, etc.), categorize as 'emergency'.
        2. TRIAGE LEVELS:
           - 'emergency': Life-threatening or limb-threatening. Needs immediate ER/911.
           - 'urgent': Needs medical attention within 24 hours (Urgent Care or prompt GP visit).
           - 'routine': Needs medical attention but not immediately (scheduled appointment).
           - 'home': Can be managed with self-care and monitoring.
        3. TRIAGE RECOMMENDATION: A clear, concise instruction on where to go or what to do (e.g., "Go to the nearest Emergency Room immediately").
        4. POTENTIAL CONDITIONS: List 2-3 common conditions that might match these symptoms. State clearly that these are for discussion with a doctor and NOT a diagnosis.
        5. NEXT STEPS: Provide 3-5 clear, actionable, and safe steps.
        6. SUMMARY: A brief clinical summary of the reported symptoms.
        7. DISCLAIMER: A strong legal and medical disclaimer stating this is AI-generated and not a substitute for professional medical advice.
        
        Return the response as a JSON object matching the SymptomAnalysisResult schema.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: symptomAnalysisSchema
        }
    }));
    return JSON.parse(response.text);
};

export const getCityHealthSnapshot = async (cityName: string, country: string, language: string): Promise<CityHealthSnapshot> => {
    const cacheKey = `city_snapshot_v4_${cityName}_${language}`;
    const cached = cache.get<CityHealthSnapshot>(cacheKey);
    if (cached) return cached;

    // Combined search and structure in one pass to save credits
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Detailed public health report for ${cityName}, ${country} in ${language}. Use current news. Return as JSON following CityHealthSnapshot schema.`,
        config: { 
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
        }
    }));
    
    const result = JSON.parse(response.text);
    cache.set(cacheKey, result, 1440); // Cache for 24 hours
    return result;
};

// --- Added functions for Health Alerts to resolve component import errors ---

const alertsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            location: { type: Type.STRING },
            country: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['disease', 'air', 'heat', 'environmental', 'news', 'weather', 'traffic', 'other'] },
            detailedInfo: { type: Type.STRING },
            threatAnalysis: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
            locationDetails: { type: Type.STRING },
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            sources: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        uri: { type: Type.STRING },
                        title: { type: Type.STRING }
                    },
                    required: ["uri", "title"]
                }
            }
        },
        required: ["id", "title", "location", "country", "category", "detailedInfo", "threatAnalysis", "severity"]
    }
};

/**
 * Fetches real-time alerts (weather, news, traffic) for a specific location.
 */
export const getRealTimeAlertsByLocation = async (locationName: string, language: string): Promise<Alert[]> => {
    const cacheKey = `realtime_alerts_${locationName}_${language}`;
    const cached = cache.get<Alert[]>(cacheKey);
    if (cached) return cached;

    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify active real-time weather alerts, local news headlines, and traffic incidents for "${locationName}" in ${language}. 
        Focus on events that could impact health or travel. Return exactly 3-5 alerts as a JSON array.`,
        config: { 
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: alertsSchema
        }
    }));

    try {
        const parsed = JSON.parse(response.text);
        const alerts: Alert[] = (Array.isArray(parsed) ? parsed : []).map((a: any) => ({
            ...a,
            fetchedAt: Date.now(),
            source: 'local' as const
        }));
        cache.set(cacheKey, alerts, 30); // Cache for 30 minutes
        return alerts;
    } catch (e) {
        console.error("Real-time alert parsing failed:", e);
        return [];
    }
};

/**
 * Fetches global health alerts using a two-pass approach with Google Search grounding.
 */
export const getLiveHealthAlerts = async (isManualRefresh: boolean = false): Promise<Alert[]> => {
    const cacheKey = `global_alerts_v7`;
    if (!isManualRefresh) {
        const cached = cache.get<Alert[]>(cacheKey);
        if (cached) return cached;
    }

    // Combined search and structure in one pass to save credits
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "List the top 5 most urgent active global public health alerts or disease outbreaks currently in the news. Return as JSON array.",
        config: { 
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: alertsSchema
        }
    }));

    try {
        const parsed = JSON.parse(response.text);
        const alerts: Alert[] = (Array.isArray(parsed) ? parsed : []).map((a: any) => ({
            ...a,
            fetchedAt: Date.now(),
            source: 'global' as const
        }));
        cache.set(cacheKey, alerts, 360); // Cache for 6 hours
        return alerts;
    } catch (e) {
        console.error("Alert structure parsing failed:", e);
        return [];
    }
};

/**
 * Fetches local health alerts based on coordinates using Google Search grounding.
 */
export const getLocalHealthAlerts = async (lat: number, lng: number, isManualRefresh: boolean = false): Promise<Alert[]> => {
    const cacheKey = `local_alerts_v7_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    if (!isManualRefresh) {
        const cached = cache.get<Alert[]>(cacheKey);
        if (cached) return cached;
    }

    // Combined search and structure in one pass to save credits
    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify active public health alerts, air quality warnings, or disease clusters near latitude ${lat}, longitude ${lng} using local news sources. Return exactly 3 alerts as JSON array.`,
        config: { 
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: alertsSchema
        }
    }));

    try {
        const parsed = JSON.parse(response.text);
        const alerts: Alert[] = (Array.isArray(parsed) ? parsed : []).map((a: any) => ({
            ...a,
            fetchedAt: Date.now(),
            source: 'local' as const
        }));
        cache.set(cacheKey, alerts, 360); // Cache for 6 hours
        return alerts;
    } catch (e) {
        console.error("Local alert structure parsing failed:", e);
        return [];
    }
};

const medicineRouteSchema = {
    type: Type.OBJECT,
    properties: {
        routes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    time: { type: Type.STRING },
                    trafficCondition: { type: Type.STRING },
                    weatherCondition: { type: Type.STRING },
                    alertStatus: { type: Type.STRING, enum: ['red', 'green', 'orange'] },
                    description: { type: Type.STRING },
                    isBest: { type: Type.BOOLEAN },
                    delay: { type: Type.STRING },
                    load: { type: Type.STRING },
                    distance: { type: Type.NUMBER },
                    duration: { type: Type.NUMBER }
                },
                required: ["id", "name", "time", "trafficCondition", "weatherCondition", "alertStatus", "description", "isBest", "delay", "load", "distance", "duration"]
            }
        },
        bestAnalysis: { type: Type.STRING }
    },
    required: ["routes", "bestAnalysis"]
};

export const getMedicineRouteAnalysis = async (from: string, to: string, mode: 'land' | 'water' | 'air', language: string): Promise<MedicineRouteAnalysisResult> => {
    const cacheKey = `med_routes_v3_${from}_${to}_${mode}_${language}`;
    const cached = cache.get<MedicineRouteAnalysisResult>(cacheKey);
    if (cached) return cached;

    const response = await callGeminiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze 3 potential medicine delivery/emergency routes from "${from}" to "${to}" using ${mode} transport in ${language}. 
        
        CRITICAL: Provide realistic, accurate analysis based on real-world geography and typical conditions for this mode of transport.
        
        For each route, provide:
        - id: unique string
        - name: Route Name (e.g. "Main Highway", "Coastal Path", "Direct Air Corridor")
        - time: Estimated Time (e.g. "45 mins", "2 hours")
        - trafficCondition: Traffic/Congestion Condition (Heavy/Moderate/Light)
        - weatherCondition: Weather Condition impact
        - alertStatus: red (high risk/slow), orange (moderate), green (best/fastest)
        - description: Brief clinical description of why this route is rated this way.
        - isBest: boolean for the recommended route.
        - delay: Estimated delay due to traffic or weather (e.g. "10 mins", "None")
        - load: Current route load/congestion level (e.g. "High", "Medium", "Low")
        - distance: Accurate distance in kilometers (number)
        - duration: Accurate duration in minutes (number)
        
        Also provide a 'bestAnalysis' summary explaining why the best route was chosen considering the specific constraints of ${mode} transport, current typical traffic, and weather.
        
        Return as JSON.`,
        config: { 
            responseMimeType: "application/json",
            responseSchema: medicineRouteSchema,
            tools: [{ googleSearch: {} }]
        }
    }));
    
    const result = JSON.parse(response.text);
    cache.set(cacheKey, result, 60); // Cache for 1 hour
    return result;
};