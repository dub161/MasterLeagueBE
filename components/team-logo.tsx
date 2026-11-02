
import Image from 'next/image';
import { getTeamLogo } from '@/lib/team-logos';

interface TeamLogoProps {
  teamName: string | null | undefined;
  size?: number;
  className?: string;
}

export function TeamLogo({ teamName, size = 40, className = '' }: TeamLogoProps) {
  const logoPath = getTeamLogo(teamName);

  if (!logoPath || !teamName) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs font-bold text-gray-500">
          {teamName?.substring(0, 2).toUpperCase() || '?'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src={logoPath}
        alt={`Logo ${teamName}`}
        fill
        className="object-contain rounded-full"
        sizes={`${size}px`}
      />
    </div>
  );
}
