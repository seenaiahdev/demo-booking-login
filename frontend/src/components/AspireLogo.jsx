import React from 'react';

// Exact Vector SVG of the Official Aspire Graduation Logo
export function AspireOfficialLogoSVG({ height = 40, className = '' }) {
  return (
    <svg 
      height={height} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))', overflow: 'visible' }}
    >
      {/* Top Blue Star */}
      <polygon points="85,32 88,41 97,41 90,46 92,55 85,50 78,55 80,46 73,41 82,41" fill="#2554a3"/>
      
      {/* Left Silver Star */}
      <polygon points="50,60 52,66 58,66 53,70 55,76 50,72 45,76 47,70 42,66 48,66" fill="#b0b5bc"/>
      
      {/* Right Silver Star */}
      <polygon points="158,60 160,66 166,66 161,70 163,76 158,72 153,76 155,70 150,66 156,66" fill="#b0b5bc"/>

      {/* Graduation Cap (Mortarboard & Tassel) */}
      <g transform="translate(112, 20)">
        <polygon points="25,2 48,15 25,26 2,15" fill="#212529"/>
        <polygon points="25,18 45,28 25,35 7,27" fill="#343a40"/>
        <path d="M12,23 L12,32 Q12,37 25,37 Q38,37 38,32 L38,23 Z" fill="#1c1e21"/>
        {/* Tassel */}
        <path d="M12,18 L7,26 L6,35" stroke="#6c757d" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="6" cy="36" r="2" fill="#6c757d"/>
      </g>

      {/* Left Graduate Figure (Medium Blue) */}
      <g>
        {/* Head */}
        <circle cx="79" cy="77" r="11.5" fill="#3b5998"/>
        {/* Body Star Extension */}
        <path 
          d="M77.5 92.5 C 77.5 92.5, 31 87, 31 87 L 37.5 78.5 L 89 93.5 C 89 93.5, 96 117, 102.5 156.5 L 68 198 L 75 142 L 105 156.5 C 100 130, 89 104, 77.5 92.5 Z" 
          fill="#3b5998"
        />
        {/* Diploma Scroll */}
        <g transform="translate(18, 68) rotate(-22)">
          <rect x="0" y="0" width="10" height="38" rx="4" fill="#e9ecef" stroke="#ced4da" strokeWidth="1"/>
          <rect x="0" y="15" width="10" height="7" fill="#d63031"/>
        </g>
      </g>

      {/* Right Graduate Figure (Dark Navy Blue) */}
      <g>
        {/* Head */}
        <circle cx="131" cy="72" r="11.5" fill="#1b2a4a"/>
        {/* Body Swoosh */}
        <path 
          d="M125 87 C 125 87, 122 38, 122 38 C 122 38, 100 75, 98 115 C 96 142, 115 168, 140 178 C 120 152, 115 125, 117 105 C 120 95, 125 87, 125 87 Z" 
          fill="#1b2a4a"
        />
        <path 
          d="M122 38 C 122 38, 155 77, 175 74 C 145 98, 128 128, 137 178 C 117 142, 116 102, 125 87 Z" 
          fill="#1b2a4a"
        />
      </g>
    </svg>
  );
}

// Vector SVG Icons for Platforms & Features
export function YouTubeSVG({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
    </svg>
  );
}

export function SupabaseSVG({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.35 23.633c-.734.9-2.193.385-2.193-.769V13.86h8.895c1.472 0 2.275 1.716 1.335 2.87L13.35 23.633z" fill="#3ECF8E"/>
      <path d="M10.65.367c.734-.9 2.193-.385 2.193.769v9.004H3.948c-1.472 0-2.275-1.716-1.335-2.87L10.65.367z" fill="#3ECF8E" opacity="0.75"/>
    </svg>
  );
}

export function GoogleSheetsSVG({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 0H3C1.9 0 1 .9 1 2v20c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8.5L14.5 0zm4.5 22H4V2h9v7h6v13z" fill="#0F9D58"/>
      <path d="M6 13h12v2H6zm0 4h12v2H6zm0-8h7v2H6z" fill="#0F9D58"/>
    </svg>
  );
}
