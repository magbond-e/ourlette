import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'accent' | 'sombre' | 'fonce' | 'success' | 'outline' | 'ghost' | 'primary' | 'secondary' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'accent',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none touch-target focus:outline-none focus:ring-2 focus:ring-offset-2 font-sans shadow-sm';

  const variants = {
    accent: 'bg-accent hover:bg-fonce text-white focus:ring-accent shadow-md shadow-accent/20',
    primary: 'bg-accent hover:bg-fonce text-white focus:ring-accent shadow-md shadow-accent/20',
    sombre: 'bg-sombre hover:bg-sombre-light text-white focus:ring-sombre shadow-md shadow-sombre/20',
    secondary: 'bg-sombre hover:bg-sombre-light text-white focus:ring-sombre shadow-md shadow-sombre/20',
    fonce: 'bg-fonce hover:bg-sombre text-white focus:ring-fonce shadow-md shadow-fonce/20',
    success: 'bg-vertbouton hover:bg-emerald-800 text-white focus:ring-vertbouton shadow-md shadow-vertbouton/20',
    gold: 'bg-[#D4AF37] hover:bg-amber-600 text-sombre font-extrabold focus:ring-amber-400 shadow-md shadow-amber-500/20',
    outline: 'border-2 border-accent text-accent hover:bg-accent/10 focus:ring-accent',
    ghost: 'text-sombre hover:bg-sable/30 focus:ring-sable shadow-none',
  };

  const sizes = {
    sm: 'text-xs sm:text-sm px-4 py-2 min-h-[40px]',
    md: 'text-sm sm:text-base px-6 py-3 min-h-[48px] font-bold',
    lg: 'text-base sm:text-lg px-8 py-3.5 min-h-[54px] font-extrabold',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant] || variants.accent} ${sizes[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
