import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  type?: 'full' | 'icon';
}

export default function Logo({ size = 'md', type = 'full' }: LogoProps) {
  const sizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-16'
  };
  
  const sizeClass = sizes[size];

  if (type === 'icon') {
    return (
      <div className="flex items-center justify-center">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className={sizeClass}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 0L200 58v84L100 200 0 142V58L100 0z"
            fill="#0F3460"
          />
          <path
            d="M100 40l60 35v50l-60 35-60-35V75l60-35z"
            fill="#0F3460"
            fillOpacity="0.3"
          />
          <path
            d="M100 80l25 15v25l-25 15-25-15v-25l25-15z"
            fill="#0F3460"
            fillOpacity="0.5"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center">
        {/* Icon */}
        <svg
          width="60"
          height="60"
          viewBox="0 0 200 200"
          className={`${sizeClass} mr-2`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 0L200 58v84L100 200 0 142V58L100 0z"
            fill="#0F3460"
          />
          <path
            d="M100 40l60 35v50l-60 35-60-35V75l60-35z"
            fill="#0F3460"
            fillOpacity="0.3"
          />
          <path
            d="M100 80l25 15v25l-25 15-25-15v-25l25-15z"
            fill="#0F3460"
            fillOpacity="0.5"
          />
        </svg>
        
        {/* Text */}
        <div className="flex flex-col">
          <span className="font-bold text-2xl">
            <span className="text-black">Comply</span>
            <span className="text-[#2E77AE]">Ark</span>
          </span>
        </div>
      </div>
    </div>
  );
}