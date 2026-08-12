import React from 'react';

/**
 * LogoWatermark - Reusable Watermark Component for Qurmacel POS
 * 
 * Requirements:
 * - Small to medium size
 * - Exact center of content/table container
 * - Low opacity (around 5%-10%)
 * - Non-intrusive, subtle
 * - pointer-events-none (never blocks interactions)
 * - Must be placed inside a container with `relative` positioning
 *
 * @param {string} className - Extra classes for watermark container
 * @param {'sm' | 'md' | 'lg' | 'xl' | string} size - Size preset
 * @param {string} opacity - Opacity class (default 7% opacity)
 * @param {string} alt - Alt text
 */
export default function LogoWatermark({
  className = '',
  size = 'md',
  opacity = 'opacity-[0.07]',
  alt = 'Qurmacel POS Watermark'
}) {
  const sizeMap = {
    sm: 'w-28 sm:w-36',
    md: 'w-40 sm:w-52 md:w-60',
    lg: 'w-56 sm:w-72 md:w-80',
    xl: 'w-72 sm:w-96 md:w-[420px]'
  };

  const imageSize = sizeMap[size] || size;

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden p-4 select-none ${className}`}
    >
      <img
        src="/logo.jpg"
        alt={alt}
        className={`${imageSize} h-auto object-contain ${opacity} filter grayscale-[15%] contrast-125 transition-opacity duration-300`}
      />
    </div>
  );
}
