import React from 'react';

interface DeepFocusLogoProps {
  size?: number;
  className?: string;
}

export const DeepFocusLogo: React.FC<DeepFocusLogoProps> = ({
  size = 24,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="180 180 640 640"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="DeepFocus Logo"
    >
      <g transform="translate(500, 500)">
        {/* Upper Hook (D) */}
        <path
          d="M -120,-160 L 0,-280 L 280,0 L 192,88 L 140,36 L 192,-16 L 0,-208 L -90,-118 L -90,-16 Z"
          fill="#ffffff"
        />
        <path d="M -90,-16 L 90,-16 L 90,44 L -90,44 Z" fill="#ffffff" />

        {/* Lower Hook (F - Rotated 180°) */}
        <g transform="rotate(180)">
          <path
            d="M -120,-160 L 0,-280 L 280,0 L 192,88 L 140,36 L 192,-16 L 0,-208 L -90,-118 L -90,-16 Z"
            fill="#ffffff"
          />
          <path d="M -90,-16 L 90,-16 L 90,44 L -90,44 Z" fill="#ffffff" />
        </g>

        {/* Cyan Focus Singularity */}
        <circle cx="0" cy="0" r="16" fill="#1591DC" />
        <circle cx="0" cy="0" r="6" fill="#ffffff" />
      </g>
    </svg>
  );
};
