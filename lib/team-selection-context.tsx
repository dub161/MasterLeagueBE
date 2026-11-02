'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TeamSelectionContextType {
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  saison: string;
  setSaison: (saison: string) => void;
}

const TeamSelectionContext = createContext<TeamSelectionContextType | undefined>(undefined);

export function TeamSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedTeam, setSelectedTeamState] = useState<string>('');
  const [saison, setSaisonState] = useState<string>('2026-2027');

  // Load from localStorage on mount
  useEffect(() => {
    const savedTeam = localStorage.getItem('selectedTeam');
    const savedSaison = localStorage.getItem('selectedSaison');
    if (savedTeam) setSelectedTeamState(savedTeam);
    if (savedSaison) setSaisonState(savedSaison);
  }, []);

  // Save to localStorage when values change
  const setSelectedTeam = (team: string) => {
    setSelectedTeamState(team);
    localStorage.setItem('selectedTeam', team);
  };

  const setSaison = (newSaison: string) => {
    setSaisonState(newSaison);
    localStorage.setItem('selectedSaison', newSaison);
  };

  return (
    <TeamSelectionContext.Provider value={{ selectedTeam, setSelectedTeam, saison, setSaison }}>
      {children}
    </TeamSelectionContext.Provider>
  );
}

export function useTeamSelection() {
  const context = useContext(TeamSelectionContext);
  if (context === undefined) {
    throw new Error('useTeamSelection must be used within a TeamSelectionProvider');
  }
  return context;
}
