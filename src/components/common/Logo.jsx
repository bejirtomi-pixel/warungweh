import React from 'react';

/**
 * Logo - Reusable Official Logo Component for Qurmacel POS
 * 
 * @param {string} className - Additional CSS classes for wrapper
 * @param {string} imgClassName - Additional CSS classes for image tag
 * @param {'sm' | 'md' | 'lg' | 'xl' | '2xl' | string} size - Size preset or raw class
 * @param {boolean} showText - Whether to display "Qurmacel POS" text
 * @param {string} textClassName - Custom CSS classes for logo text
 * @param {string} alt - Alt text for image
 */
export default function Logo({
  className = '',
  imgClassName = '',
  size = 'md',
  showText = false,
  textClassName = 'font-bold text-slate-800 text-lg tracking-tight',
  alt = 'Logo Qurmacel POS'
}) {
  const sizeClasses = {
    sm: 'h-7 w-auto max-w-[120px]',
    md: 'h-10 w-auto max-w-[160px]',
    lg: 'h-16 w-auto max-w-[220px]',
    xl: 'h-24 w-auto max-w-[300px]',
    '2xl': 'h-32 w-auto max-w-[400px]',
  };

  const selectedSizeClass = sizeClasses[size] || (typeof size === 'string' ? size : 'h-10 w-auto');

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/logo.jpg"
        alt={alt}
        className={`${selectedSizeClass} object-contain rounded-md transition-all duration-200 ${imgClassName}`}
        loading="eager"
      />
      {showText && (
        <span className={textClassName}>
          Qurmacel <span className="text-emerald-600 font-extrabold">POS</span>
        </span>
      )}
    </div>
  );
}
