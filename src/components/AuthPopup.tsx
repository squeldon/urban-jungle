'use client'
import { useState } from 'react';
import signIn from '@/firebase/auth/signIn';
import signUp from '@/firebase/auth/signup';

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthPopup({ isOpen, onClose }: AuthPopupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'initial' | 'login' | 'signup'>('initial');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async () => {
    if (!email || !password || loading) return;
    
    setError('');
    setLoading(true);

    try {
      const { result, error } = await signIn(email, password);
      
      if (result) {
        console.log('Sign in successful:', result);
        handleClose();
      } else if (error) {
        // Handle expected authentication failures gracefully
        const errorCode = (error as any).code;
        
        // These are expected user errors, not system errors
        if (errorCode === 'auth/invalid-credential' || 
            errorCode === 'auth/user-not-found' || 
            errorCode === 'auth/wrong-password' ||
            errorCode === 'auth/invalid-email') {
          setError('Email or password is incorrect, or account does not exist');
        } else {
          // Only log unexpected errors
          console.error('Unexpected authentication error:', error);
          setError('Authentication failed. Please try again.');
        }
      }
    } catch (error) {
      // This is for network errors or other unexpected issues
      console.error('System error during login:', error);
      setError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || loading) return;
    
    setError('');
    setLoading(true);

    try {
      const { result, error } = await signUp(email, password);
      
      if (result) {
        console.log('Sign up successful:', result);
        handleClose();
      } else if (error) {
        const errorCode = (error as any).code;
        
        // These are expected validation errors, not system errors
        if (errorCode === 'auth/email-already-in-use') {
          setError('This email is already registered. Please log in instead.');
        } else if (errorCode === 'auth/weak-password') {
          setError('Password should be at least 6 characters.');
        } else if (errorCode === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
        } else if (errorCode === 'auth/missing-email') {
          setError('Please enter an email address.');
        } else if (errorCode === 'auth/missing-password') {
          setError('Please enter a password.');
        } else {
          // Only log unexpected errors
          console.error('Unexpected sign up error:', error);
          setError('Failed to create account. Please try again.');
        }
      }
    } catch (error) {
      // This is for network errors or other unexpected issues
      console.error('System error during sign up:', error);
      setError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setEmail('');
    setPassword('');
    setStep('initial');
    setError('');
    setLoading(false);
  };

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      ></div>

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 pt-12 w-96 max-w-[90vw]">
        {step === 'initial' ? (
          // Initial step - Choose login or sign up
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white text-center pb-4">
              Log in or sign up
            </h2>
            {/* <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
              Please choose a method to continue.
            </p>
             */}
            <button
              onClick={() => setStep('login')}
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Continue with Email
            </button>
          </div>
        ) : step === 'login' ? (
          // Login step
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Log in to your account
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && password && handleLogin()}
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            
            <button
              onClick={handleLogin}
              disabled={!email || !password || loading}
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
            
            <div className="text-center">
              <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
              <button
                onClick={() => {
                  setStep('signup');
                  setError('');
                }}
                className="text-blue-500 hover:text-blue-600 font-semibold"
              >
                Sign up
              </button>
            </div>
          </div>
        ) : (
          // Sign up step
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Create your account
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && password && handleSignUp()}
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (at least 6 characters)"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleSignUp()}
            />
            
            <button
              onClick={handleSignUp}
              disabled={!email || !password || loading}
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
            
            <div className="text-center">
              <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
              <button
                onClick={() => {
                  setStep('login');
                  setError('');
                }}
                className="text-blue-500 hover:text-blue-600 font-semibold"
              >
                Log in
              </button>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Back button for login/signup steps */}
        {(step === 'login' || step === 'signup') && (
          <button
            onClick={() => {
              setStep('initial');
              setError('');
            }}
            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
      </div>
    </>
  );
}
