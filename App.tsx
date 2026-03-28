import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { WelcomePage } from './components/WelcomePage';
import { GlobePage } from './components/GlobePage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { ChatBot } from './components/ChatBot';
import { ImageAnalysisPage } from './components/ImageAnalysisPage';
import { CheckupPage } from './components/CheckupPage';
import { PrescriptionAnalysisPage } from './components/PrescriptionAnalysisPage';
import { MentalHealthPage } from './components/MentalHealthPage';
import { SymptomCheckerPage } from './components/SymptomCheckerPage';
import { AuthPage } from './components/AuthPage';
import { ActivityHistoryPage } from './components/ActivityHistoryPage';
import type { User, ActivityLogItem, Page } from './types';
import { HealthForecast } from './components/HealthForecast';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { ProfilePage } from './components/ProfilePage';
import { Sidebar } from './components/Sidebar';
import { WaterLogPage } from './components/WaterLogPage';
import { PartnersPage } from './components/PartnersPage';
import { Bars3Icon, GlobeIcon } from './components/icons';
import { FeedbackModal } from './components/FeedbackModal';
import { I18nProvider } from './components/I18n';
import { supabase } from './src/lib/supabase';

const ACTIVITY_HISTORY_KEY = 'artha_activity_history';
const GLOBAL_ACTIVITY_HISTORY_KEY = 'artha_global_activity_history';
const USERS_KEY = 'artha_users';
const SESSION_KEY = 'artha_session_phone';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activityHistory, setActivityHistory] = useState<ActivityLogItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const syncUserWithSupabase = async (userData: User) => {
    try {
        console.log("Supabase Sync: Attempting to sync user:", userData.phone);
        
        const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
            return Promise.race([
                promise,
                new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Supabase request timed out")), timeoutMs))
            ]);
        };

        const { data, error } = await withTimeout(supabase
            .from('users')
            .upsert({
                phone: userData.phone,
                name: userData.name,
                email: userData.email,
                password: userData.password,
                date_of_birth: userData.date_of_birth,
                gender: userData.gender,
                place: userData.place,
                is_admin: userData.isAdmin,
                last_login_at: userData.last_login_at || new Date().toISOString()
            }, { onConflict: 'phone' })
            .select());
        
        if (error) {
            console.error("Supabase Sync Error:", error.message, error.details, error.hint);
            if (error.message.includes("Invalid API key")) {
                console.error("HINT: The Supabase Anon Key is invalid. Please check your Supabase Dashboard -> Settings -> API for the correct 'anon' public key. It should be a long JWT starting with 'eyJhbGci...'");
            }
            if (error.code === '42501') {
                console.error("HINT: Row Level Security (RLS) is likely blocking this request. Please add an 'INSERT' and 'UPDATE' policy for 'anon' or 'authenticated' roles on the 'users' table.");
            }
        } else {
            console.log("Supabase Sync Success:", data);
        }
    } catch (e) {
        console.error("Supabase Sync Exception:", e);
    }
  };

  useEffect(() => {
    // Test Supabase connection
    const testSupabase = async () => {
        try {
            const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
            if (error) {
                console.warn("Supabase connection test warning:", error.message);
            } else {
                console.log("Supabase connection test successful.");
            }
        } catch (e) {
            console.error("Supabase connection test failed:", e);
        }
    };
    testSupabase();

    // Ensure admin user exists on first load
    try {
        const allUsers: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const adminEmail = 'likhithapacha4@gmail.com';
        const adminExists = allUsers.some(u => u.email === adminEmail);

        if (!adminExists) {
            const adminUser: User = {
                name: 'Admin',
                phone: '0000000000',
                email: adminEmail,
                password: 'mahadev',
                date_of_birth: '2000-01-01',
                created_at: new Date().toISOString(),
                isAdmin: true,
            };
            allUsers.push(adminUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
        }
    } catch (error) {
        console.error("Failed to create admin user:", error);
    }

    // Check for a logged-in user in localStorage
    const checkSession = async () => {
        try {
            const loggedInUserPhone = localStorage.getItem(SESSION_KEY);
            if (loggedInUserPhone) {
                const allUsers: any[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
                const currentUser = allUsers.find(u => u.phone === loggedInUserPhone);
                if (currentUser) {
                    const { password, ...userDetails } = currentUser;
                    const isUserAdmin = true; // Temporary: Grant admin access to all users
                    setUser({ ...userDetails, isAdmin: isUserAdmin });
                    setCurrentPage('welcome');
                    
                    // Sync with Supabase on session check
                    await syncUserWithSupabase(currentUser);
                } else {
                    localStorage.removeItem(SESSION_KEY);
                }
            }
        } catch (error) {
            console.error("Session validation failed:", error);
            localStorage.removeItem(SESSION_KEY);
        }
    };
    checkSession();
      
    // Load personal activity history
    try {
      const storedHistory = localStorage.getItem(ACTIVITY_HISTORY_KEY);
      if (storedHistory) {
          const parsed = JSON.parse(storedHistory);
          setActivityHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
        console.error("Could not load activity history from localStorage:", error);
        localStorage.removeItem(ACTIVITY_HISTORY_KEY);
    }
  }, []);

  const addGlobalActivityToHistory = async (item: ActivityLogItem) => {
      try {
          const stored = localStorage.getItem(GLOBAL_ACTIVITY_HISTORY_KEY);
          const globalHistory: ActivityLogItem[] = stored ? JSON.parse(stored) : [];
          const newGlobalHistory = [item, ...(Array.isArray(globalHistory) ? globalHistory : [])];
          localStorage.setItem(GLOBAL_ACTIVITY_HISTORY_KEY, JSON.stringify(newGlobalHistory));
          
          // Sync with Supabase
          const { error } = await supabase
              .from('activity_history')
              .insert({
                  user_phone: item.userPhone,
                  type: item.type,
                  title: item.title,
                  data: item.data,
                  timestamp: new Date(item.timestamp).toISOString()
              });
          
          if (error) console.error("Supabase activity sync error:", error);
      } catch (error) {
           console.error("Could not save global activity to localStorage:", error);
      }
  };

  const addActivityToHistory = (item: Omit<ActivityLogItem, 'id' | 'timestamp' | 'userPhone'>) => {
      if (!user) return;
      const newActivity: ActivityLogItem = {
          ...item,
          id: new Date().toISOString() + Math.random(),
          timestamp: Date.now(),
          userPhone: user.phone,
      };

      setActivityHistory(prevHistory => {
          const newHistory = [newActivity, ...prevHistory];
          try {
            localStorage.setItem(ACTIVITY_HISTORY_KEY, JSON.stringify(newHistory));
          } catch (error) {
              console.error("Could not save activity history to localStorage:", error);
          }
          return newHistory;
      });

      addGlobalActivityToHistory(newActivity);
  };
  
  const handleUpdateUser = async (updatedDetails: Partial<User>) => {
    if (!user) return false;
    
    try {
        const allUsers: any[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const userIndex = allUsers.findIndex(u => u.phone === user.phone);

        if (userIndex !== -1) {
            const updatedUser = { ...allUsers[userIndex], ...updatedDetails };
            allUsers[userIndex] = updatedUser;
            localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
            
            const { password, ...userDetails } = updatedUser;
            setUser(userDetails);

            // Sync with Supabase using the shared function
            await syncUserWithSupabase(updatedUser);

            return true;
        }
        return false;
    } catch (error) {
        console.error("Failed to update user:", error);
        return false;
    }
  };


  const handleAuthSuccess = async (authedUser: User) => {
    // Update last_login_at for the user who just logged in.
    let userWithTimestamp = { ...authedUser };
    const now = new Date().toISOString();
    
    try {
        const allUsers: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const userIndex = allUsers.findIndex(u => u.phone === authedUser.phone);
        
        if (userIndex !== -1) {
            allUsers[userIndex].last_login_at = now;
            localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));
            userWithTimestamp.last_login_at = now; // Ensure state has latest login time
        }
    } catch (error) {
        console.error("Failed to update last login time:", error);
    }

    // Sync user with Supabase
    await syncUserWithSupabase(userWithTimestamp);
    
    const { password, ...userDetails } = userWithTimestamp;
    setUser(userDetails);
    setShowAuth(false);
    setCurrentPage('welcome');
    localStorage.setItem(SESSION_KEY, userWithTimestamp.phone);

    addGlobalActivityToHistory({
        id: new Date().toISOString(),
        timestamp: Date.now(),
        userPhone: userWithTimestamp.phone,
        type: 'login',
        title: 'User Logged In',
        data: { message: `User ${userWithTimestamp.name} (${userWithTimestamp.phone}) logged in.` },
    });
  };
  
  const handleLogout = () => {
      setUser(null);
      setCurrentPage('home');
      localStorage.removeItem(SESSION_KEY);
      setIsFeedbackModalOpen(false);
  };

  const handleNavigation = (page: Page) => {
    if (user) {
        addActivityToHistory({
            type: 'navigation',
            title: `Navigated to ${page}`,
            data: { page }
        });
    }
    setCurrentPage(page);
  };
  
  const renderPublicPages = () => {
    switch (currentPage) {
        case 'about':
            return <AboutPage onBack={() => handleNavigation('home')} />;
        case 'contact':
            return <ContactPage onBack={() => handleNavigation('home')} />;
        case 'explore':
             return <GlobePage onBack={() => handleNavigation('home')} />;
        case 'home':
        default:
            return <HomePage
                onLoginClick={() => setShowAuth(true)}
                onAboutClick={() => handleNavigation('about')}
                onContactClick={() => handleNavigation('contact')}
                onExploreClick={() => handleNavigation('explore')}
            />;
    }
  }

  const renderAuthenticatedApp = () => {
    if (!user) return null;

    const renderPage = () => {
        const isUserAdmin = true; // Temporary: Grant admin access to all users
        
        switch (currentPage) {
            case 'welcome':
            case 'home': // Redirect home to welcome if logged in
                return <WelcomePage
                    user={user}
                    onAnalyze={() => handleNavigation('image-analysis')}
                    onAnalyzePrescription={() => handleNavigation('prescription-analysis')}
                    onAnalyzeMentalHealth={() => handleNavigation('mental-health')}
                    onCheckSymptoms={() => handleNavigation('symptom-checker')}
                    onWaterLog={() => handleNavigation('water-log')}
                    onNavigateToPartners={() => handleNavigation('partners')}
                />;
            case 'image-analysis':
                return <ImageAnalysisPage
                    onBack={() => handleNavigation('welcome')}
                    onScheduleCheckup={() => handleNavigation('checkup')}
                    onAnalysisComplete={addActivityToHistory}
                />;
            case 'prescription-analysis':
                return <PrescriptionAnalysisPage onBack={() => handleNavigation('welcome')} onAnalysisComplete={addActivityToHistory} />;
            case 'checkup':
                return <CheckupPage onBack={() => handleNavigation('image-analysis')} />;
            case 'mental-health':
                return <MentalHealthPage onBack={() => handleNavigation('welcome')} onAnalysisComplete={addActivityToHistory} />;
            case 'symptom-checker':
                return <SymptomCheckerPage onBack={() => handleNavigation('welcome')} onAnalysisComplete={addActivityToHistory} />;
            case 'health-briefing': 
                 return <HealthForecast onBack={() => handleNavigation('welcome')} />;
            case 'activity-history':
                 return <ActivityHistoryPage history={activityHistory} onBack={() => handleNavigation('welcome')} />;
            case 'profile':
                return <ProfilePage user={user} onBack={() => handleNavigation('welcome')} onUpdateUser={handleUpdateUser} />;
            case 'water-log':
                return <WaterLogPage user={user} onBack={() => handleNavigation('welcome')} />;
            case 'partners':
                return <PartnersPage user={user} onBack={() => handleNavigation('welcome')} isAdmin={isUserAdmin} />;
            case 'admin-dashboard':
                return isUserAdmin ? <AdminDashboardPage onBack={() => handleNavigation('welcome')} /> : <p>Access Denied. You do not have permission to view this page.</p>;
            case 'about':
                 return <AboutPage onBack={() => handleNavigation('welcome')} />;
            case 'contact':
                return <ContactPage onBack={() => handleNavigation('welcome')} />;
            case 'explore':
                return <GlobePage onBack={() => handleNavigation('welcome')} />;
            default:
                return <WelcomePage
                    user={user}
                    onAnalyze={() => handleNavigation('image-analysis')}
                    onAnalyzePrescription={() => handleNavigation('prescription-analysis')}
                    onAnalyzeMentalHealth={() => handleNavigation('mental-health')}
                    onCheckSymptoms={() => handleNavigation('symptom-checker')}
                    onWaterLog={() => handleNavigation('water-log')}
                    onNavigateToPartners={() => handleNavigation('partners')}
                />;
        }
    };
    
    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar 
                user={user} 
                currentPage={currentPage} 
                onNavigate={(page: Page) => {
                    handleNavigation(page);
                    setIsSidebarOpen(false);
                }} 
                onLogout={handleLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
            />
             <div className="flex-1 flex flex-col">
                <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm relative z-20">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-1" aria-label="Open menu">
                        <Bars3Icon className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-2">
                        <GlobeIcon className="w-7 h-7 text-blue-500" />
                        <h1 className="text-lg font-bold tracking-tight text-slate-800">Artha</h1>
                    </div>
                    <div className="w-7"></div>
                </header>
                <main className="flex-1 overflow-y-auto">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
  };

  return (
    <>
      {user ? renderAuthenticatedApp() : renderPublicPages()}
      {user && <ChatBot onNavigate={handleNavigation} user={user} />}
      {user && isFeedbackModalOpen && (
        <FeedbackModal 
            user={user}
            onClose={() => setIsFeedbackModalOpen(false)} 
        />
      )}
      {showAuth && (
        <AuthPage
          onClose={() => setShowAuth(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}

export default function App() {
    return (
        <I18nProvider>
            <AppContent />
        </I18nProvider>
    );
}