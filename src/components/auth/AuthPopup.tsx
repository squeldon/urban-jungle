'use client'
import { useState } from 'react';
import signIn from '@/firebase/auth/signIn';
import signUp from '@/firebase/auth/signup';
import AuthInitial from './AuthInitial';
import AuthLogin from './AuthLogin';
import AuthSignup from './AuthSignup';

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

  const handleContinueWithEmail = () => {
    setStep('login');
  };

  const handleSwitchToSignup = () => {
    setStep('signup');
    setError('');
  };

  const handleSwitchToLogin = () => {
    setStep('login');
    setError('');
  };

  const handleBack = () => {
    setStep('initial');
    setError('');
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
        {step === 'initial' && (
          <AuthInitial onContinueWithEmail={handleContinueWithEmail} />
        )}

        {step === 'login' && (
          <AuthLogin
            email={email}
            password={password}
            error={error}
            loading={loading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onLogin={handleLogin}
            onSwitchToSignup={handleSwitchToSignup}
          />
        )}

        {step === 'signup' && (
          <AuthSignup
            email={email}
            password={password}
            error={error}
            loading={loading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSignup={handleSignUp}
            onSwitchToLogin={handleSwitchToLogin}
          />
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
            onClick={handleBack}
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
