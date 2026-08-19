import React from 'react';

interface EasyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  whiteText?: boolean;
  withSlogan?: boolean;
  titleSecondPart?: 'RECETAS' | 'FARMA';
}

export const EasyLogo: React.FC<EasyLogoProps> = ({
  className = '',
  size = 'md',
  whiteText = false,
  withSlogan = true,
  titleSecondPart = 'RECETAS'
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const iconScale = isSm ? 'w-7 h-7' : isLg ? 'w-12 h-12' : 'w-9 h-9';
  const textScale = isSm ? 'text-lg' : isLg ? 'text-2xl' : 'text-xl';
  const sloganScale = isSm ? 'text-[8px]' : isLg ? 'text-[11px]' : 'text-[9px]';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision SVG Cross Matching the Provided Official Logo */}
      <div className={`relative shrink-0 ${iconScale} flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Top Horizontal Pill (Dark Cobalt Blue) */}
          <rect x="18" y="32" width="56" height="15" rx="7.5" fill="#2563EB" />
          
          {/* Vertical Right Pill (Medium Ocean Blue) */}
          <rect x="44" y="10" width="15" height="68" rx="7.5" fill="#1D4ED8" />

          {/* Vertical Left Pill (Bright Sky Blue) */}
          <rect x="30" y="24" width="15" height="54" rx="7.5" fill="#38BDF8" />

          {/* Lower Horizontal Pill (Cyan Sky Blue) */}
          <rect x="26" y="46" width="62" height="15" rx="7.5" fill="#0EA5E9" />

          {/* Speed accent lines bottom left */}
          <rect x="2" y="86" width="28" height="4" rx="2" fill="#38BDF8" />
          <rect x="14" y="78" width="16" height="4" rx="2" fill="#0EA5E9" />
        </svg>
      </div>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className={`flex items-baseline font-sans font-light tracking-wider ${textScale}`}>
          <span className={whiteText ? 'text-white font-normal' : 'text-slate-800 font-normal'}>
            EASY
          </span>
          <span className="text-[#0ea5e9] font-semibold ml-0.5">
            {titleSecondPart}
          </span>
        </div>
        {withSlogan && (
          <span className={`font-medium tracking-wide mt-0.5 text-[#0284c7] ${sloganScale}`}>
            Tu Salud nos Mueve
          </span>
        )}
      </div>
    </div>
  );
};
