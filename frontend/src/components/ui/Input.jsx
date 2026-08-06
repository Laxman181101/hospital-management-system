import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className={`w-full flex flex-col relative ${className}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 transition-all duration-200 peer-focus:text-indigo-600"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`peer input-field h-12 ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-danger font-medium mt-1 animate-fade-in">{error}</span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
