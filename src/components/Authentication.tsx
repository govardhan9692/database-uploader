
import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/firebase';
import { Button } from '@/components/ui/button';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Authentication: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const validateForm = () => {
    setError(null);
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return false;
    }
    
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = isLogin 
        ? await loginUser(email, password)
        : await registerUser(email, password);
      
      if (result.error) {
        setError(result.error);
      } else {
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass card-gradient rounded-2xl p-8 w-full max-w-md animate-fade">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              placeholder="••••••••"
              required
            />
          </div>
          
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full"
                placeholder="••••••••"
                required
              />
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-destructive/20 border border-destructive/50 rounded-md text-sm text-destructive animate-fade">
              {error}
            </div>
          )}
          
          <Button
            className="btn btn-primary w-full mt-6"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleAuthMode}
            className="text-primary hover:text-primary/80 text-sm transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Authentication;
