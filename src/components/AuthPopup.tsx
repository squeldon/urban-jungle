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
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [isExistingUser, setIsExistingUser] = useState(false);

  if (!isOpen) return null;

  // Function to check if user exists (simplified - in real app you'd check against database)
  const checkUserExists = async (email: string) => {
    // For now, we'll assume any email could be existing or new
    // In a real app, you'd check against your user database
    return Math.random() > 0.5; // Randomly decide if user exists
  };

  const handleEmailSubmit = async () => {
    if (!email) return;

    const exists = await checkUserExists(email);
    setIsExistingUser(exists);
    setStep('password');
  };

  const handlePasswordSubmit = async () => {
    if (!password) return;

    try {
      let result, error;
      if (isExistingUser) {
        // Sign in existing user
        ({ result, error } = await signIn(email, password));
      } else {
        // Sign up new user
        ({ result, error } = await signUp(email, password));
      }

      if (error) {
        console.error('Authentication error:', error);
        alert('Authentication failed. Please check your credentials.');
        return;
      }

      if (result) {
        console.log('Authentication successful:', result);
        handleClose();
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Authentication failed. Please try again.');
    }
  };

  const handleClose = () => {
    onClose();
    setEmail('');
    setPassword('');
    setStep('email');
    setIsExistingUser(false);
  };

  return (
    <>
      {/* Dark overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      ></div>

      {/* Popup */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
        {step === 'email' ? (
          // Email step
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Enter your email
            </h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
            />
            <button
              onClick={handleEmailSubmit}
              disabled={!email}
              className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        ) : (
          // Password step
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
              {isExistingUser ? 'Welcome back!' : 'Create account'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {isExistingUser ? 'Sign in to your account' : 'Set up your password to create your account'}
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            />
            <div className="flex gap-2">
              <button
                onClick={handlePasswordSubmit}
                disabled={!password}
                className="flex-1 bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isExistingUser ? 'Sign In' : 'Create Account'}
              </button>
              <button
                onClick={() => setStep('email')}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Back
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
      </div>
    </>
  );
}
