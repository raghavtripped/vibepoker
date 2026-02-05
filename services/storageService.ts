import { SavedScenario, GridSelection } from '../types';

const STORAGE_KEY = 'vibepoker_scenarios_v1';

export const getScenarios = (): SavedScenario[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse scenarios", e);
    return [];
  }
};

export const saveScenario = (name: string, heroRange: GridSelection, villainRange: GridSelection): SavedScenario[] => {
  const scenarios = getScenarios();
  const newScenario: SavedScenario = {
    id: crypto.randomUUID(),
    name: name.trim() || `Untitled Scenario ${new Date().toLocaleTimeString()}`,
    heroRange,
    villainRange,
    timestamp: Date.now(),
  };
  
  // Prepend new scenario
  const updated = [newScenario, ...scenarios];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteScenario = (id: string): SavedScenario[] => {
  const scenarios = getScenarios();
  const updated = scenarios.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const exportScenariosToJSON = (): void => {
  const scenarios = getScenarios();
  const jsonString = JSON.stringify(scenarios, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `vibepoker-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};