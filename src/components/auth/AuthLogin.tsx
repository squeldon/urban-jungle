interface AuthLoginProps {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onLogin: () => void;
  onSwitchToSignup: () => void;
}

export default function AuthLogin({
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onLogin,
  onSwitchToSignup
}: AuthLoginProps) {
  return (
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
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="Email address"
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        onKeyPress={(e) => e.key === 'Enter' && password && onLogin()}
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        placeholder="Password"
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        onKeyPress={(e) => e.key === 'Enter' && onLogin()}
      />
      
      <button
        onClick={onLogin}
        disabled={!email || !password || loading}
        className="w-full bg-blue-500 text-white font-semibold py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-4"
      >
        {loading ? 'Logging in...' : 'Log In'}
      </button>
      
      <div className="text-center">
        <span className="text-gray-600 dark:text-gray-400">Don&apos;t have an account? </span>
        <button
          onClick={onSwitchToSignup}
          className="text-blue-500 hover:text-blue-600 font-semibold"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
