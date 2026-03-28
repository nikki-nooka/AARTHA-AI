export type Page =
  | 'home'
  | 'welcome'
  | 'image-analysis'
  | 'prescription-analysis'
  | 'checkup'
  | 'mental-health'
  | 'symptom-checker'
  | 'about'
  | 'contact'
  | 'explore'
  | 'health-briefing'
  | 'activity-history'
  | 'profile'
  | 'admin-dashboard'
  | 'water-log'
  | 'partners';

export interface User {
  phone: string;
  name: string;
  email?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  place?: string | null;
  created_at?: string | null;
  last_login_at?: string | null;
  password?: string;
  isAdmin?: boolean;
}

export interface ActivityLogItem {
  id: string;
  timestamp: number;
  userPhone: string;
  type: 'image-analysis' | 'prescription-analysis' | 'mental-health' | 'symptom-checker' | 'login';
  title: string;
  data: any;
  language?: string;
}

export interface Hazard {
  hazard: string;
  description: string;
}

export interface Disease {
  name: string;
  cause: string;
  precautions: string[];
}

export interface AnalysisResult {
  hazards: Hazard[];
  diseases: Disease[];
  summary: string;
}

export interface LocationAnalysisResult extends AnalysisResult {
  locationName: string;
}

export interface Facility {
    name: string;
    type: 'Hospital' | 'Clinic' | 'Pharmacy';
    lat: number;
    lng: number;
    distance: string; // e.g., "1.2 km"
}

export type MapPoint = {
    lat: number;
    lng: number;
    name: string;
    kind: 'analysis_point' | 'facility';
    type?: Facility['type'];
};


export interface PrescriptionAnalysisResult {
    summary: string;
    medicines: {
        name: string;
        dosage: string;
    }[];
    precautions: string[];
}

export interface RiskFactor {
    name: string;
    level: 'Low' | 'Moderate' | 'High' | 'Very High';
    description: string;
}

export interface HealthForecast {
    locationName: string;
    summary: string;
    riskFactors: RiskFactor[];
    recommendations: string[];
}

export interface MentalHealthResult {
    summary: string;
    potentialConcerns: {
        name: string;
        explanation: string;
    }[];
    copingStrategies: {
        title: string;
        description: string;
    }[];
    recommendation: string;
}

export interface SymptomAnalysisResult {
    summary: string;
    triageRecommendation: string;
    triageLevel: 'emergency' | 'urgent' | 'routine' | 'home';
    potentialConditions: {
        name: string;
        description: string;
    }[];
    nextSteps: string[];
    disclaimer: string;
}

export interface BotCommandResponse {
  action: 'navigate' | 'speak';
  page?: Page;
  responseText: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

export interface AlertSource {
    uri: string;
    title: string;
}

// Added AlertCategory for public health warnings
export type AlertCategory = 'disease' | 'air' | 'heat' | 'environmental' | 'news' | 'weather' | 'traffic' | 'other';

// Added Alert interface used in LiveHealthAlerts and AlertsPage components
export interface Alert {
    id: string;
    title: string;
    location: string;
    country: string;
    category: AlertCategory;
    detailedInfo: string;
    threatAnalysis: string;
    severity?: 'low' | 'medium' | 'high';
    locationDetails?: string;
    lat?: number;
    lng?: number;
    fetchedAt: number;
    source: 'local' | 'global';
    sources?: AlertSource[];
}

export interface DiseaseReport {
    name: string;
    summary: string;
    reportedCases: string;
    affectedDemographics: string;
    trend: 'Increasing' | 'Stable' | 'Decreasing' | 'Unknown';
}

export interface CityHealthSnapshot {
    cityName: string;
    country: string;
    lastUpdated: string;
    overallSummary: string;
    diseases: DiseaseReport[];
    dataDisclaimer: string;
    sources: AlertSource[];
}

export interface WaterLogEntry {
  id: string;
  timestamp: number;
  amount: number; // in ml
}

export interface WaterLogSettings {
  goal: number; // in ml
  notifications: {
    enabled: boolean;
    startTime: string; // "HH:mm" format
    endTime: string;   // "HH:mm" format
    frequency: number; // in minutes
  };
}

export interface FeedbackItem {
  id: string;
  timestamp: number;
  userPhone: string;
  rating: number; // 1-5
  comment: string;
}

export interface MedicineRoute {
    id: string;
    name: string;
    time: string; // e.g. "15 mins"
    trafficCondition: string; // e.g. "Heavy", "Moderate", "Light"
    weatherCondition: string; // e.g. "Clear", "Rainy", "Cloudy"
    alertStatus: 'red' | 'green' | 'orange';
    description: string;
    isBest: boolean;
    delay?: string; // e.g. "5 mins"
    load?: string; // e.g. "High", "Low"
    distance: number; // in km
    duration: number; // in minutes
}

export interface MedicineRouteAnalysisResult {
    routes: MedicineRoute[];
    bestAnalysis: string;
}

export interface PartnerAnalytics {
    totalOrders: number;
    monthlyData: {
        month: string;
        orders: number;
        revenue?: number;
    }[];
}

export interface Partner {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    createdAt: string;
    analytics?: PartnerAnalytics;
}

export type DeliveryStatus = 'pending' | 'in-transit' | 'delivered' | 'delayed';

export interface Delivery {
    id: string;
    branchId: string;
    from: string;
    to: string;
    fromLat?: number;
    fromLng?: number;
    toLat?: number;
    toLng?: number;
    distance?: number; // in km
    duration?: number; // in minutes
    items: string[];
    status: DeliveryStatus;
    estimatedArrival: string;
    currentLocation?: string;
    lastUpdated: string;
    route?: MedicineRoute;
}

export interface Branch {
    id: string;
    partnerId: string;
    name: string;
    location: string;
    lat?: number;
    lng?: number;
    contact?: string;
    createdAt: string;
    analytics?: PartnerAnalytics;
    activeDeliveries?: Delivery[];
}
