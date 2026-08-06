import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={twMerge(
        `bg-white rounded-3xl border border-sable/60 p-5 sm:p-6 shadow-xs transition-all duration-300 ${
          hoverable ? 'hover:border-accent/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''
        }`,
        className
      )}
    >
      {children}
    </div>
  );
};
