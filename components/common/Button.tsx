
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', icon, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-gw-gold text-white hover:bg-gw-gold-dark focus:ring-gw-gold',
    secondary: 'bg-gray-200 text-gw-dark hover:bg-gray-300 focus:ring-gray-400',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
};

export default Button;
