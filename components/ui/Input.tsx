import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordType = type === 'password';
    const currentType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs sm:text-sm font-bold text-sombre/90 font-sans">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={currentType}
            className={`w-full px-4 py-3 ${isPasswordType ? 'pr-11' : ''} bg-white border border-sable/80 rounded-2xl text-sm sm:text-base text-sombre placeholder:text-sombre/40 focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent shadow-xs transition-all min-h-[48px] font-sans ${
              error ? 'border-accent ring-2 ring-accent/20' : ''
            } ${className}`}
            {...props}
          />
          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sombre/50 hover:text-accent p-1 transition-colors"
              title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        {error && <p className="text-xs sm:text-sm text-accent font-semibold">{error}</p>}
        {helperText && !error && <p className="text-xs sm:text-sm text-sombre/60">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
