"use client";

import { TeamLogo } from "@/components/team-logo";
import { useEffect, useRef, useState } from "react";

interface Match {
  equipedomicile: string;
  equipeexterieur: string;
  scoredomicile: number | null;
  scoreexterieur: number | null;
  date: string | null;
}

interface PlayoffTreeProps {
  quarterFinals: (Match | null)[];
  semiFinals: (Match | null)[];
  finals: (Match | null)[];
  equipePhare?: string;
}

const CARD_W = 190;
const CARD_H = 80;
const GAP_V = 24;
const CONNECTOR_W = 48;

const PLACEHOLDER_MATCH: Match = {
  equipedomicile: '?',
  equipeexterieur: '?',
  scoredomicile: null,
  scoreexterieur: null,
  date: null,
};

export function PlayoffTree({ quarterFinals, semiFinals, finals, equipePhare }: PlayoffTreeProps) {
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [positions, setPositions] = useState<{
    qf: { x: number; y: number }[];
    sf: { x: number; y: number }[];
    fi: { x: number; y: number }[];
    winner: { x: number; y: number } | null;
  }>({ qf: [], sf: [], fi: [], winner: null });

  // Map null items to placeholders, preserving slot positions
  const qfMatches: Match[] = [];
  for (let i = 0; i < Math.max(4, quarterFinals.length); i++) {
    qfMatches.push(quarterFinals[i] ?? PLACEHOLDER_MATCH);
  }
  while (qfMatches.length < 4) qfMatches.push(PLACEHOLDER_MATCH);

  const sfMatches: Match[] = [];
  for (let i = 0; i < Math.max(2, semiFinals.length); i++) {
    sfMatches.push(semiFinals[i] ?? PLACEHOLDER_MATCH);
  }
  while (sfMatches.length < 2) sfMatches.push(PLACEHOLDER_MATCH);

  const fiMatches: Match[] = [];
  for (let i = 0; i < Math.max(1, finals.length); i++) {
    fiMatches.push(finals[i] ?? PLACEHOLDER_MATCH);
  }

  const hasWinner = finals.length > 0 && finals[0] !== null && finals[0].scoredomicile !== null && finals[0].scoreexterieur !== null;

  useEffect(() => {
    const col0x = 0;
    const col1x = CARD_W + CONNECTOR_W;
    const col2x = col1x + CARD_W + CONNECTOR_W;
    const col3x = col2x + CARD_W + CONNECTOR_W;

    // QF positions
    const qfPositions = Array.from({ length: 4 }, (_, i) => ({
      x: col0x,
      y: i * (CARD_H + GAP_V),
    }));

    // SF centered between their two QF feeders
    const sfPositions = [
      { x: col1x, y: (qfPositions[0].y + qfPositions[1].y) / 2 },
      { x: col1x, y: (qfPositions[2].y + qfPositions[3].y) / 2 },
    ];

    // Final centered between the two SFs
    const fiPositions = [
      { x: col2x, y: (sfPositions[0].y + sfPositions[1].y) / 2 },
    ];

    const winnerPos = hasWinner ? { x: col3x, y: fiPositions[0].y } : null;

    const totalW = (hasWinner ? col3x + CARD_W : col2x + CARD_W) + 20;
    const totalH = 4 * CARD_H + 3 * GAP_V + 20;

    setSvgSize({ w: totalW, h: totalH });
    setPositions({ qf: qfPositions, sf: sfPositions, fi: fiPositions, winner: winnerPos });
  }, [hasWinner]);

  const MatchCard = ({ match, roundName, x, y, isPlaceholder }: {
    match: Match; roundName: string; x: number; y: number; isPlaceholder?: boolean;
  }) => {
    const isHighlightHome = !isPlaceholder && equipePhare && match.equipedomicile.toLowerCase().includes(equipePhare.toLowerCase());
    const isHighlightAway = !isPlaceholder && equipePhare && match.equipeexterieur.toLowerCase().includes(equipePhare.toLowerCase());
    const hasScore = match.scoredomicile !== null && match.scoreexterieur !== null;
    const homeWon = hasScore && match.scoredomicile! > match.scoreexterieur!;
    const awayWon = hasScore && match.scoreexterieur! > match.scoredomicile!;

    return (
      <div
        className={`absolute rounded-lg shadow-sm transition-shadow ${
          isPlaceholder
            ? 'bg-gray-50 border-2 border-dashed border-gray-300'
            : 'bg-white border-2 border-gray-300 hover:shadow-md'
        }`}
        style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
      >
        <div className={`text-[10px] text-center font-medium pt-0.5 ${
          isPlaceholder ? 'text-gray-400' : 'text-gray-500'
        }`}>{roundName}</div>

        {isPlaceholder ? (
          <div className="flex items-center justify-center h-[50px] text-gray-400 text-xs italic">
            À déterminer
          </div>
        ) : (
          <>
            {/* Équipe domicile */}
            <div className={`flex items-center justify-between px-2 py-0.5 rounded mx-1 ${
              homeWon ? 'bg-green-50 border border-green-300' : ''
            } ${isHighlightHome ? 'bg-orange-100 border border-orange-400' : ''}`}>
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <TeamLogo teamName={match.equipedomicile} size={16} />
                <span className={`text-[11px] truncate ${isHighlightHome ? 'font-bold text-orange-700' : ''}`}>
                  {match.equipedomicile}
                </span>
              </div>
              <span className={`text-[11px] font-bold ml-1 ${homeWon ? 'text-green-700' : ''}`}>
                {hasScore ? match.scoredomicile : '-'}
              </span>
            </div>

            <div className="border-t border-gray-200 mx-1 my-0.5"></div>

            {/* Équipe extérieur */}
            <div className={`flex items-center justify-between px-2 py-0.5 rounded mx-1 ${
              awayWon ? 'bg-green-50 border border-green-300' : ''
            } ${isHighlightAway ? 'bg-orange-100 border border-orange-400' : ''}`}>
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <TeamLogo teamName={match.equipeexterieur} size={16} />
                <span className={`text-[11px] truncate ${isHighlightAway ? 'font-bold text-orange-700' : ''}`}>
                  {match.equipeexterieur}
                </span>
              </div>
              <span className={`text-[11px] font-bold ml-1 ${awayWon ? 'text-green-700' : ''}`}>
                {hasScore ? match.scoreexterieur : '-'}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  const WinnerCard = ({ match, x, y }: { match: Match; x: number; y: number }) => {
    const winnerName = match.scoredomicile! > match.scoreexterieur!
      ? match.equipedomicile
      : match.equipeexterieur;

    return (
      <div
        className="absolute bg-gradient-to-br from-yellow-100 to-yellow-200 border-4 border-yellow-500 rounded-lg shadow-lg"
        style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
      >
        <div className="text-center pt-1">
          <div className="text-lg leading-none">🏆</div>
          <div className="font-bold text-[10px] text-yellow-800">Vainqueur</div>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <TeamLogo teamName={winnerName} size={20} />
            <span className="font-bold text-xs text-gray-900 truncate max-w-[120px]">{winnerName}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderConnectors = () => {
    const lines: JSX.Element[] = [];
    const { qf, sf, fi, winner } = positions;
    if (qf.length < 4 || sf.length < 2 || fi.length < 1) return lines;

    // QF → SF connectors
    for (let i = 0; i < 2; i++) {
      const qf1 = qf[i * 2];
      const qf2 = qf[i * 2 + 1];
      const sfPos = sf[i];

      const sfMidY = sfPos.y + CARD_H / 2;
      const midX = qf1.x + CARD_W + CONNECTOR_W / 2;

      // QF1: horizontal right → vertical down to SF midpoint
      const qf1MidY = qf1.y + CARD_H / 2;
      lines.push(<line key={`qf1h-${i}`} x1={qf1.x + CARD_W} y1={qf1MidY} x2={midX} y2={qf1MidY} stroke="#60a5fa" strokeWidth="2" />);
      lines.push(<line key={`qf1v-${i}`} x1={midX} y1={qf1MidY} x2={midX} y2={sfMidY} stroke="#60a5fa" strokeWidth="2" />);

      // QF2: horizontal right → vertical up to SF midpoint
      const qf2MidY = qf2.y + CARD_H / 2;
      lines.push(<line key={`qf2h-${i}`} x1={qf2.x + CARD_W} y1={qf2MidY} x2={midX} y2={qf2MidY} stroke="#60a5fa" strokeWidth="2" />);
      lines.push(<line key={`qf2v-${i}`} x1={midX} y1={qf2MidY} x2={midX} y2={sfMidY} stroke="#60a5fa" strokeWidth="2" />);

      // Horizontal into SF
      lines.push(<line key={`sfin-${i}`} x1={midX} y1={sfMidY} x2={sfPos.x} y2={sfMidY} stroke="#60a5fa" strokeWidth="2" />);
    }

    // SF → Final connectors
    const fiPos = fi[0];
    const fiMidY = fiPos.y + CARD_H / 2;
    const sfMidX = sf[0].x + CARD_W + CONNECTOR_W / 2;

    for (let i = 0; i < 2; i++) {
      const sfPos = sf[i];
      const sfMidY = sfPos.y + CARD_H / 2;

      // Horizontal from SF right
      lines.push(<line key={`sfh-${i}`} x1={sfPos.x + CARD_W} y1={sfMidY} x2={sfMidX} y2={sfMidY} stroke="#a78bfa" strokeWidth="2" />);
      // Vertical to final level
      lines.push(<line key={`sfv-${i}`} x1={sfMidX} y1={sfMidY} x2={sfMidX} y2={fiMidY} stroke="#a78bfa" strokeWidth="2" />);
    }

    // Horizontal into final
    lines.push(<line key="fiin" x1={sfMidX} y1={fiMidY} x2={fiPos.x} y2={fiMidY} stroke="#a78bfa" strokeWidth="2" />);

    // Final → Winner connector
    if (winner) {
      lines.push(<line key="wincon" x1={fiPos.x + CARD_W} y1={fiMidY} x2={winner.x} y2={fiMidY} stroke="#eab308" strokeWidth="2" />);
    }

    return lines;
  };

  const HEADER_H = 28;

  const roundLabels = [
    { label: 'Quarts de Finale', color: 'text-blue-700', x: positions.qf[0]?.x ?? 0 },
    { label: 'Demi-Finales', color: 'text-purple-700', x: positions.sf[0]?.x ?? (CARD_W + CONNECTOR_W) },
    { label: 'Finale', color: 'text-yellow-600', x: positions.fi[0]?.x ?? (2 * (CARD_W + CONNECTOR_W)) },
  ];
  if (hasWinner && positions.winner) {
    roundLabels.push({ label: '🏆', color: 'text-yellow-600', x: positions.winner.x });
  }

  return (
    <div className="overflow-x-auto py-4">
      <div className="relative" style={{ width: svgSize.w, height: svgSize.h + HEADER_H, minWidth: svgSize.w }}>
        {/* Round headers */}
        {roundLabels.map((rl, i) => (
          <div
            key={i}
            className={`absolute text-sm font-bold ${rl.color}`}
            style={{ left: rl.x, top: 0, width: CARD_W, textAlign: 'center' }}
          >
            {rl.label}
          </div>
        ))}

        {/* SVG connectors */}
        <svg
          className="absolute pointer-events-none"
          style={{ left: 0, top: HEADER_H, width: svgSize.w, height: svgSize.h }}
        >
          {renderConnectors()}
        </svg>

        {/* QF cards - bracket labels: BE, AD, CF, HG */}
        {qfMatches.slice(0, 4).map((match, idx) => {
          const pos = positions.qf[idx];
          const isPlaceholder = match === PLACEHOLDER_MATCH;
          const bracketLabels = ['BE', 'AD', 'CF', 'HG'];
          return pos ? (
            <MatchCard key={`qf-${idx}`} match={match} roundName={bracketLabels[idx]} x={pos.x} y={pos.y + HEADER_H} isPlaceholder={isPlaceholder} />
          ) : null;
        })}

        {/* SF cards - bracket labels: BEAD, CFHG */}
        {sfMatches.slice(0, 2).map((match, idx) => {
          const pos = positions.sf[idx];
          const isPlaceholder = match === PLACEHOLDER_MATCH;
          const sfLabels = ['BEAD', 'CFHG'];
          return pos ? (
            <MatchCard key={`sf-${idx}`} match={match} roundName={sfLabels[idx]} x={pos.x} y={pos.y + HEADER_H} isPlaceholder={isPlaceholder} />
          ) : null;
        })}

        {/* Final card */}
        {fiMatches.slice(0, 1).map((match, idx) => {
          const pos = positions.fi[idx];
          const isPlaceholder = match === PLACEHOLDER_MATCH;
          return pos ? (
            <MatchCard key={`fi-${idx}`} match={match} roundName="Finale" x={pos.x} y={pos.y + HEADER_H} isPlaceholder={isPlaceholder} />
          ) : null;
        })}

        {/* Winner card */}
        {hasWinner && positions.winner && (
          <WinnerCard match={finals[0]} x={positions.winner.x} y={positions.winner.y + HEADER_H} />
        )}
      </div>
    </div>
  );
}
