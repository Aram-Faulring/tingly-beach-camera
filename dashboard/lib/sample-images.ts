// High quality SVG data URIs for realistic camera captures at Tingley Beach

function svgUri(svg: string): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.trim());
}

const DUCK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7da5be"/>
      <stop offset="50%" stop-color="#b6ced8"/>
      <stop offset="100%" stop-color="#dce7ea"/>
    </linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a4858"/>
      <stop offset="40%" stop-color="#1f3b4d"/>
      <stop offset="100%" stop-color="#142834"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="400" fill="url(#sky)"/>
  <rect y="400" width="1200" height="400" fill="url(#water)"/>
  
  <polygon points="0,400 150,330 350,380 550,310 800,370 1100,290 1200,350 1200,400" fill="#4d5c48" opacity="0.6"/>
  <polygon points="0,400 200,360 450,390 700,340 950,380 1200,360 1200,400" fill="#2d3b2a"/>
  
  <path d="M0,450 Q300,480 600,440 T1200,470 L1200,400 L0,400 Z" fill="#5c5339" opacity="0.8"/>
  <ellipse cx="600" cy="550" rx="350" ry="15" fill="#3b5d6e" opacity="0.4"/>
  <ellipse cx="500" cy="620" rx="420" ry="20" fill="#3b5d6e" opacity="0.3"/>
  
  <path d="M100,550 L110,380 M120,560 L135,360 M140,570 L150,390 M160,550 L175,370" stroke="#788047" stroke-width="4"/>
  <path d="M980,550 L970,360 M1010,570 L1020,380 M1040,560 L1035,350" stroke="#788047" stroke-width="4"/>
  
  <g transform="translate(540, 500) scale(1.1)">
    <ellipse cx="60" cy="50" rx="90" ry="18" fill="#1b2a33" opacity="0.7"/>
    <ellipse cx="60" cy="50" rx="120" ry="24" stroke="#4a7385" stroke-width="2" fill="none" opacity="0.5"/>
    <ellipse cx="60" cy="40" rx="65" ry="32" fill="#544332"/>
    <path d="M10,42 Q30,65 75,55 T120,35 Q90,20 30,25 Z" fill="#8c7a65"/>
    <rect x="50" y="32" width="28" height="10" rx="3" fill="#21427a"/>
    <rect x="48" y="30" width="32" height="3" fill="#ffffff"/>
    <path d="M15,40 Q0,50 -15,62 Q-20,75 -8,78 Q5,75 10,52 Z" fill="#184a32"/>
    <path d="M-15,68 L-30,76 L-18,80 Z" fill="#d99b26"/>
  </g>
  
  <rect x="480" y="460" width="260" height="160" fill="red" fill-opacity="0.15" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
  <rect x="480" y="430" width="220" height="30" fill="#ef4444"/>
  <text x="490" y="452" font-family="sans-serif" font-weight="bold" font-size="14" fill="#ffffff">DEAD DUCK: MALLARD (94.2%)</text>
  
  <rect x="20" y="20" width="340" height="42" fill="#000000" fill-opacity="0.7" rx="6"/>
  <text x="35" y="46" font-family="monospace" font-size="14" fill="#10b981">● REC [PI4-CAM-01] 1080P 30FPS</text>
</svg>
`;

const FISHING_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <defs>
    <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a1118"/>
      <stop offset="60%" stop-color="#141f2a"/>
      <stop offset="100%" stop-color="#1b2a38"/>
    </linearGradient>
    <linearGradient id="nightWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e171f"/>
      <stop offset="100%" stop-color="#080c10"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="450" fill="url(#nightSky)"/>
  <rect y="450" width="1200" height="350" fill="url(#nightWater)"/>
  
  <circle cx="950" cy="420" r="18" fill="#ffdd80" opacity="0.6"/>
  <polygon points="950,420 880,580 1020,580" fill="#ffdd80" opacity="0.15"/>
  <ellipse cx="950" cy="520" rx="50" ry="8" fill="#ffdd80" opacity="0.2"/>
  
  <polygon points="0,550 400,510 750,540 1200,520 1200,800 0,800" fill="#1c221a"/>
  
  <rect x="180" y="470" width="12" height="120" fill="#444"/>
  <rect x="135" y="430" width="100" height="50" fill="#fef08a" stroke="#dc2626" stroke-width="3" rx="4"/>
  <text x="145" y="450" font-family="sans-serif" font-weight="bold" font-size="10" fill="#dc2626">NO FISHING</text>
  <text x="145" y="468" font-family="sans-serif" font-size="9" fill="#111">AFTER DUSK</text>
  
  <g transform="translate(620, 360)">
    <circle cx="80" cy="70" r="14" fill="#0f172a"/>
    <path d="M60,65 Q80,55 105,65 Q80,62 60,65 Z" fill="#0f172a"/>
    <path d="M65,85 L95,85 L102,150 L58,150 Z" fill="#1e293b"/>
    <rect x="63" y="150" width="14" height="70" fill="#0f172a"/>
    <rect x="83" y="150" width="14" height="70" fill="#0f172a"/>
    <path d="M65,95 L40,115 L60,125" stroke="#1e293b" stroke-width="8" stroke-linecap="round"/>
    <line x1="50" y1="120" x2="-140" y2="40" stroke="#94a3b8" stroke-width="3"/>
    <line x1="-140" y1="40" x2="-220" y2="190" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="3,2"/>
    <circle cx="-220" cy="190" r="4" fill="#ef4444"/>
    <ellipse cx="-220" cy="190" rx="20" ry="4" stroke="#60a5fa" stroke-width="1" fill="none" opacity="0.6"/>
  </g>
  
  <rect x="670" y="415" width="85" height="225" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="2.5"/>
  <rect x="670" y="390" width="140" height="25" fill="#f59e0b"/>
  <text x="678" y="407" font-family="sans-serif" font-weight="bold" font-size="12" fill="#000000">SUSPECT (91.4%)</text>
  
  <rect x="460" y="390" width="220" height="120" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="5,4"/>
  <rect x="460" y="365" width="210" height="25" fill="#ef4444"/>
  <text x="468" y="382" font-family="sans-serif" font-weight="bold" font-size="12" fill="#ffffff">FISHING ROD DETECTED (88.7%)</text>
  
  <rect x="20" y="20" width="390" height="42" fill="#000000" fill-opacity="0.75" rx="6"/>
  <text x="35" y="46" font-family="monospace" font-size="14" fill="#f59e0b">● MOTION INTERRUPT: ZONE 2 (RESTRICTED)</text>
</svg>
`;

const FISH_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <rect width="1200" height="800" fill="#2d3732"/>
  <ellipse cx="600" cy="400" rx="550" ry="320" fill="#3a4a42"/>
  <ellipse cx="600" cy="400" rx="380" ry="220" fill="#4d6156"/>
  
  <circle cx="350" cy="520" r="14" fill="#78716c"/>
  <circle cx="380" cy="540" r="18" fill="#a8a29e"/>
  <circle cx="430" cy="510" r="12" fill="#57534e"/>
  <circle cx="820" cy="480" r="16" fill="#78716c"/>
  <circle cx="860" cy="510" r="22" fill="#a8a29e"/>
  
  <g transform="translate(480, 360)">
    <ellipse cx="120" cy="85" rx="130" ry="25" fill="#1c2420" opacity="0.6"/>
    <path d="M10,70 Q70,20 180,35 Q230,45 250,70 Q210,95 140,95 Q50,95 10,70 Z" fill="#e2e8f0"/>
    <path d="M20,65 Q80,35 170,45 Q210,55 240,70 Q160,50 20,65 Z" fill="#64748b"/>
    <path d="M40,68 Q120,55 210,65" stroke="#f43f5e" stroke-width="12" stroke-linecap="round" opacity="0.7"/>
    <circle cx="80" cy="60" r="2" fill="#1e293b"/>
    <circle cx="110" cy="55" r="2" fill="#1e293b"/>
    <circle cx="140" cy="62" r="2.5" fill="#1e293b"/>
    <circle cx="170" cy="60" r="2" fill="#1e293b"/>
    <circle cx="190" cy="64" r="1.5" fill="#1e293b"/>
    <polygon points="245,68 280,45 270,70 285,92 245,72" fill="#cbd5e1"/>
    <polygon points="90,75 75,105 105,85" fill="#cbd5e1" opacity="0.8"/>
    <circle cx="45" cy="62" r="7" fill="#f1f5f9"/>
    <circle cx="45" cy="62" r="4" fill="#94a3b8"/>
  </g>
  
  <rect x="460" y="330" width="320" height="160" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
  <rect x="460" y="300" width="280" height="30" fill="#ef4444"/>
  <text x="470" y="321" font-family="sans-serif" font-weight="bold" font-size="13" fill="#ffffff">DEAD FISH: RAINBOW TROUT (96.8%)</text>
</svg>
`;

const ROUTINE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <defs>
    <linearGradient id="clearSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="60%" stop-color="#bae6fd"/>
      <stop offset="100%" stop-color="#e0f2fe"/>
    </linearGradient>
    <linearGradient id="dayWater" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="380" fill="url(#clearSky)"/>
  <circle cx="1050" cy="120" r="50" fill="#fde047" opacity="0.85"/>
  <polygon points="0,380 200,280 400,320 700,240 900,290 1100,210 1200,270 1200,380" fill="#93c5fd" opacity="0.6"/>
  <polygon points="0,380 250,330 550,350 850,310 1200,340 1200,380" fill="#15803d"/>
  <rect y="380" width="1200" height="420" fill="url(#dayWater)"/>
  
  <rect x="250" y="365" width="280" height="15" fill="#78350f"/>
  <rect x="270" y="380" width="10" height="35" fill="#451a03"/>
  <rect x="370" y="380" width="10" height="35" fill="#451a03"/>
  <rect x="470" y="380" width="10" height="35" fill="#451a03"/>
  
  <ellipse cx="600" cy="550" rx="400" ry="25" fill="#38bdf8" opacity="0.25"/>
  <ellipse cx="700" cy="650" rx="450" ry="28" fill="#38bdf8" opacity="0.2"/>
  
  <rect x="440" y="700" width="320" height="44" fill="#059669" rx="8"/>
  <text x="470" y="728" font-family="sans-serif" font-weight="bold" font-size="16" fill="#ffffff">✓ HOURLY BASELINE: ALL CLEAR</text>
  
  <rect x="20" y="20" width="350" height="42" fill="#000000" fill-opacity="0.65" rx="6"/>
  <text x="35" y="46" font-family="monospace" font-size="14" fill="#10b981">● TIMED HEARTBEAT (13:00 MDT)</text>
</svg>
`;

const GOOSE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <rect width="1200" height="450" fill="#94a3b8"/>
  <rect y="450" width="1200" height="350" fill="#334155"/>
  <polygon points="0,480 300,450 700,470 1200,450 1200,800 0,800" fill="#475569"/>
  
  <g transform="translate(500, 420)">
    <ellipse cx="100" cy="80" rx="110" ry="24" fill="#1e293b" opacity="0.7"/>
    <ellipse cx="100" cy="65" rx="80" ry="40" fill="#64748b"/>
    <path d="M30,65 Q-20,65 -50,90 Q-60,110 -30,110 Q-10,95 25,75 Z" fill="#0f172a"/>
    <polygon points="-35,100 -20,85 -10,95" fill="#f8fafc"/>
    <polygon points="-55,100 -70,105 -50,110" fill="#020617"/>
  </g>
  
  <rect x="420" y="380" width="300" height="180" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-width="3" stroke-dasharray="6,4"/>
  <rect x="420" y="350" width="280" height="30" fill="#ef4444"/>
  <text x="430" y="371" font-family="sans-serif" font-weight="bold" font-size="13" fill="#ffffff">DEAD BIRD: CANADA GOOSE (91.5%)</text>
</svg>
`;

export const SAMPLE_IMAGES = {
  dead_duck: svgUri(DUCK_SVG),
  illegal_fishing: svgUri(FISHING_SVG),
  dead_fish: svgUri(FISH_SVG),
  routine_day: svgUri(ROUTINE_SVG),
  dead_goose: svgUri(GOOSE_SVG),
};
