interface AuthInitialProps {
  onContinueWithEmail: () => void;
}

export default function AuthInitial({ onContinueWithEmail }: AuthInitialProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white text-center pb-4">
        Log in or sign up
      </h2>
      <button
        onClick={onContinueWithEmail}
        className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Continue with Email
      </button>
    </div>
  );
}
