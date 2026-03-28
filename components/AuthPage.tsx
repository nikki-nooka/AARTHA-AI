
import React, { useState } from 'react';
import { CloseIcon, GlobeIcon, PhoneIcon, LockClosedIcon, UserIcon, CalendarIcon, AtSymbolIcon } from './icons';
import RotatingGlobe from './RotatingGlobe';
import type { User } from '../types';

interface AuthPageProps {
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

const USERS_KEY = 'geosick_users';

type ViewMode = 'login' | 'signup';

export const AuthPage: React.FC<AuthPageProps> = ({ onClose, onAuthSuccess }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [place, setPlace] = useState('');
  
  const [error, setError] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const resetForms = () => {
    setPhone('');
    setPassword('');
    setError('');
    setName('');
    setDateOfBirth('');
    setConfirmPassword('');
    setInfoMessage('');
    setLoginIdentifier('');
    setEmail('');
    setGender('');
    setPlace('');
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        await new Promise(res => setTimeout(res, 500));
        const allUsers: any[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const identifier = (loginIdentifier || '').trim().toLowerCase();
        const foundUser = allUsers.find(u => u.phone === identifier || (u.email && (u.email || '').toLowerCase() === identifier));

        if (foundUser) {
            if (foundUser.password === password) {
                const isUserAdmin = true; // Temporary: Grant admin access to all users
                onAuthSuccess({ ...foundUser, isAdmin: isUserAdmin });
            } else {
                throw new Error('Incorrect password. Please try again.');
            }
        } else {
            setInfoMessage("We couldn't find an account with this phone number or email. Please sign up to continue.");
            setViewMode('signup');
        }
    } catch (err: any) {
        console.error("Login error:", err);
        setError(err.message || "An unknown error occurred during login.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isSigningUpAsAdmin = true; // Temporary: Grant admin access to all users

    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    if (!name.trim() || !phone.trim() || !dateOfBirth || !password) {
        setError("Please fill out all required fields: Full Name, Phone, Date of Birth, and Password.");
        return;
    }
    setIsLoading(true);
    
    try {
        await new Promise(res => setTimeout(res, 500));
        const allUsers: any[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

        const phoneExists = allUsers.some(u => u.phone === phone.trim());
        if (phoneExists) {
            throw new Error('This phone number is already registered.');
        }
        
        const emailExists = email.trim() && allUsers.some(u => u.email && (u.email || '').toLowerCase() === (email || '').trim().toLowerCase());
        if (emailExists) {
            throw new Error('This email address is already registered.');
        }
        
        const newUser: User = {
            phone: phone.trim(),
            name: name.trim(),
            email: email.trim() || null,
            date_of_birth: dateOfBirth,
            gender: gender || null,
            place: place.trim() || null,
            password: password,
            created_at: new Date().toISOString(),
            isAdmin: isSigningUpAsAdmin,
        };
        
        allUsers.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(allUsers));

        onAuthSuccess(newUser);

    } catch (err: any) {
         console.error("Sign up error:", err);
         setError(err.message || "An unknown error occurred during sign up.");
    } finally {
         setIsLoading(false);
    }
  };
  
  const inputClasses = "w-full pl-11 pr-3 py-3 bg-white border border-slate-300 rounded-md placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow";
  const buttonClasses = "w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-md transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed";

  const renderSignUpForm = () => (
     <form onSubmit={handleSignUp} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="name-signup" className="sr-only">Full Name</label>
                <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input id="name-signup" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClasses} placeholder="Full Name *" />
                </div>
            </div>
            <div>
                <label htmlFor="phone-signup" className="sr-only">Phone Number</label>
                <div className="relative">
                    <PhoneIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input id="phone-signup" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputClasses} placeholder="Phone Number *" />
                </div>
            </div>
        </div>
        <div>
            <label htmlFor="email-signup" className="sr-only">Email Address</label>
            <div className="relative">
                <AtSymbolIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input id="email-signup" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} placeholder="Email Address (Optional)" />
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="dob" className="sr-only">Date of Birth</label>
                <div className="relative">
                    <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required className={inputClasses} placeholder="Date of Birth *" />
                </div>
            </div>
            <div>
                <label htmlFor="place-signup" className="sr-only">Place</label>
                <div className="relative">
                    <GlobeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input id="place-signup" type="text" value={place} onChange={(e) => setPlace(e.target.value)} className={inputClasses} placeholder="Place (Optional)" />
                </div>
            </div>
        </div>
        <div>
             <label htmlFor="gender-signup" className="sr-only">Gender</label>
             <select id="gender-signup" value={gender} onChange={(e) => setGender(e.target.value)} className={`${inputClasses} pl-4`}>
                <option value="">Select Gender (Optional)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
            </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="password-signup" className="sr-only">Password</label>
                <div className="relative">
                    <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input id="password-signup" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClasses} placeholder="Password *" />
                </div>
            </div>
             <div>
                <label htmlFor="confirm-password-signup" className="sr-only">Confirm Password</label>
                <div className="relative">
                    <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input id="confirm-password-signup" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClasses} placeholder="Confirm Password *" />
                </div>
            </div>
        </div>
        <button type="submit" disabled={isLoading} className={buttonClasses}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
    </form>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
        <div>
            <label htmlFor="login-identifier" className="sr-only">Phone Number or Email</label>
            <div className="relative">
                <AtSymbolIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input id="login-identifier" type="text" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} required className={inputClasses} placeholder="Phone Number or Email" />
            </div>
        </div>
        <div>
            <label htmlFor="password-input" className="sr-only">Password</label>
            <div className="relative">
                <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input id="password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClasses} placeholder="Password" />
            </div>
        </div>
        <div className="text-right">
            <button type="button" onClick={() => alert("A real app would email you a password reset link. Since this is a demo, please sign up again if you've forgotten your password.")} className="text-sm text-blue-600 hover:underline font-medium">
                Forgot Password?
            </button>
        </div>
        <button type="submit" disabled={isLoading} className={buttonClasses}>
            {isLoading ? 'Logging In...' : 'Login Securely'}
        </button>
    </form>
  );


  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md lg:max-w-4xl flex flex-col lg:grid lg:grid-cols-2 animate-fade-in-up overflow-hidden max-h-[90vh] lg:max-h-none">
        <div className="flex flex-col items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-blue-600 to-slate-800 text-white relative order-first">
            <div className="absolute inset-0 z-0 h-full w-full opacity-50"><RotatingGlobe /></div>
            <div className="z-10 text-center">
                <GlobeIcon className="w-16 h-16 lg:w-20 lg:h-20 text-white mx-auto mb-4"/>
                <h2 className="text-2xl lg:text-3xl font-bold">GeoSick</h2>
                <p className="mt-2 text-blue-200 text-sm lg:text-base">AI-Powered Environmental Health Intelligence.</p>
            </div>
        </div>
        <div className="p-8 sm:p-12 relative overflow-y-auto">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10" aria-label="Close authentication"><CloseIcon className="w-6 h-6" /></button>
            <div className="w-full flex border-b border-slate-200 mb-8">
                 <button onClick={() => { setViewMode('login'); resetForms(); }} className={`flex-1 text-center font-semibold pb-3 border-b-2 transition-colors ${viewMode === 'login' ? 'text-slate-800 border-blue-500' : 'text-slate-400 border-transparent hover:border-slate-300'}`}>
                    Login
                </button>
                 <button onClick={() => { setViewMode('signup'); resetForms(); }} className={`flex-1 text-center font-semibold pb-3 border-b-2 transition-colors ${viewMode === 'signup' ? 'text-slate-800 border-blue-500' : 'text-slate-400 border-transparent hover:border-slate-300'}`}>
                    Sign Up
                </button>
            </div>
            
            {viewMode === 'login' && (
                <div className="animate-fade-in">
                    <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
                    <p className="text-slate-500 mt-1 mb-6">Login to access your dashboard.</p>
                    {renderLoginForm()}
                </div>
            )}

            {viewMode === 'signup' && (
                <div className="animate-fade-in">
                    <h2 className="text-2xl font-bold text-slate-900">Create an Account</h2>
                     {infoMessage ? (
                         <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md mt-1 mb-6">{infoMessage}</p>
                    ) : (
                        <p className="text-slate-500 mt-1 mb-6">Get started with GeoSick's full suite of tools.</p>
                    )}
                    {renderSignUpForm()}
                </div>
            )}

            {error && <div className="text-sm text-red-600 text-center pt-4">{error}</div>}
        </div>
      </div>
    </div>
  );
};
