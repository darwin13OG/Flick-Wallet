import React from 'react';

interface AntIconProps {
  className?: string;
  size?: number;
}

/**
 * Custom Vector Ant SVG Icon for "Gastos Hormiga"
 */
export const AntIcon: React.FC<AntIconProps> = ({ className = 'w-5 h-5', size }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      <path
        d="M10.2 4.6L8.2 2.3L6.4 2.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.8 4.6L15.8 2.3L17.6 2.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.8 9.2L6.2 7.4L4.2 5.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.2 9.2L17.8 7.4L19.8 5.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 11.2L5.4 11.4L3.2 13.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.4 11.2L18.6 11.4L20.8 13.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.8 13.2L6.2 16.2L4.4 19.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.2 13.2L17.8 16.2L19.6 19.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="12" cy="6.3" rx="2.4" ry="2.1" fill="currentColor" />
      <ellipse cx="12" cy="11.1" rx="1.75" ry="2.35" fill="currentColor" />
      <ellipse cx="12" cy="17.6" rx="3.35" ry="3.9" fill="currentColor" />
    </svg>
  );
};

export const CategoryOrSymbolIcon: React.FC<{
  name: string;
  className?: string;
  filled?: boolean;
}> = ({ name, className = 'text-[20px]', filled = true }) => {
  if (name === 'ant' || name === 'hormiga' || name === 'bug_report') {
    return <AntIcon className="w-[1.15em] h-[1.15em]" />;
  }
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};

export const AppIcon: React.FC<{
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
}> = ({ name, size = 20, className = '', filled = true }) => {
  if (name === 'ant' || name === 'hormiga' || name === 'bug_report') {
    return <AntIcon size={size} className={className} />;
  }
  return (
    <span
      className={`material-symbols-outlined select-none leading-none ${className}`}
      style={{
        fontSize: size ? `${size}px` : undefined,
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
};
