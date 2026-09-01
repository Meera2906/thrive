import { ReactNode, useMemo } from "react";

interface Props {
  children?: ReactNode;
  className?: string;
}

function generateStars(count: number, size: number) {
  let shadows = [];
  for (let i = 0; i < count; i++) {
    // Generate between -2000 and 2000 to surround the 50% 50% origin
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;
    // Warm white / very pale pink for stars
    shadows.push(`${x}px ${y}px #fdf0f3`);
  }
  return shadows.join(", ");
}

export default function ParallaxAtmosphere({ children, className = "" }: Props) {
  const stars1 = useMemo(() => generateStars(700, 1), []);
  const stars2 = useMemo(() => generateStars(200, 2), []);
  const stars3 = useMemo(() => generateStars(100, 3), []);

  return (
    <div className={`relative overflow-hidden bg-[#090A0F] ${className}`}>
      {/* Twilight blush radial gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at bottom, #3b1122 0%, #090A0F 100%)"
        }}
      />
      
      {/* 3-layer parallax box-shadow stars */}
      <div 
        className="absolute w-[1px] h-[1px] bg-transparent opacity-60 animate-orbit-slow pointer-events-none" 
        style={{ boxShadow: stars1, animationDuration: "150s", top: "50%", left: "50%" }} 
      />
      <div 
        className="absolute w-[2px] h-[2px] bg-transparent opacity-70 animate-orbit-slow pointer-events-none" 
        style={{ boxShadow: stars2, animationDuration: "200s", top: "50%", left: "50%" }} 
      />
      <div 
        className="absolute w-[3px] h-[3px] bg-transparent opacity-80 animate-orbit-slow pointer-events-none" 
        style={{ boxShadow: stars3, animationDuration: "250s", top: "50%", left: "50%" }} 
      />

      {/* Content slot */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
