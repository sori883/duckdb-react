import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export default function Button ({ children, className,  ...props } : ButtonProps) {
  return (
    <button
      className={`bg-indigo-600 px-4 py-2 font-semibold text-sm text-indigo-100 shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}