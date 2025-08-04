import React from "react";

export function Favicon({ size = 32 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 50 50" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Logomark">
        <path 
          d="M 45,30 A 20 20, 0, 1, 1, 25,10"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-foreground"
        />
        
        <line 
          x1="25" 
          y1="10" 
          x2="25" 
          y2="50" 
          stroke="currentColor" 
          strokeWidth="8" 
          strokeLinecap="round"
          className="text-foreground"
        />
        
        <path 
          d="M 25 30 L 45 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-primary"
        />
      </g>
    </svg>
  );
}