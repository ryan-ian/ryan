import React from "react";

export function LogoWithPaths({ className = "", width = 250, height = 60 }: { className?: string; width?: number; height?: number }) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 250 60" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g id="Logomark">
        <path 
          d="M 45,30 A 20 20, 0, 1, 1, 25,10"
          fill="none"
          stroke="#0A2540"
          strokeWidth="8"
          strokeLinecap="round" 
        />
        
        <line 
          x1="25" 
          y1="10" 
          x2="25" 
          y2="50" 
          stroke="#0A2540" 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        
        <path 
          d="M 25 30 L 45 30"
          fill="none"
          stroke="#00C49A"
          strokeWidth="8"
          strokeLinecap="round" 
        />
      </g>
      
      {/* Text using the <text> element for clarity and editability */}
      <g id="Logotype" transform="translate(70, 0)">
        <text x="0" y="30" 
              fontFamily="Poppins, sans-serif" 
              fontSize="22" 
              fill="#0A2540" 
              dominantBaseline="middle">
            <tspan fontWeight="600">Conference</tspan>
            <tspan fontWeight="400">Hub</tspan>
        </text>
      </g>
    </svg>
  );
}