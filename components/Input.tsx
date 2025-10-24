
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`w-full bg-gray-900/70 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500 ${className}`}
      {...props}
    />
  );
};

export default Input;
