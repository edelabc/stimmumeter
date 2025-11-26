/**
 * Mood Symbol Palette - Drag & Drop Komponente für Stimmungssymbole
 * 
 * Symbole: Frau, Mann, Kind, Familie, Gruppe
 */

import { useState } from 'react';
import { Users, User, Baby, UsersRound, UserRound } from 'lucide-react';

export type SymbolType = 'woman' | 'man' | 'child' | 'family' | 'group';

export interface Symbol {
  type: SymbolType;
  label: string;
  icon: React.ReactNode;
  emoji: string;
}

const SYMBOLS: Symbol[] = [
  {
    type: 'woman',
    label: 'Frau',
    icon: <UserRound size={32} />,
    emoji: '👩',
  },
  {
    type: 'man',
    label: 'Mann',
    icon: <User size={32} />,
    emoji: '👨',
  },
  {
    type: 'child',
    label: 'Kind',
    icon: <Baby size={32} />,
    emoji: '👶',
  },
  {
    type: 'family',
    label: 'Familie',
    icon: <UsersRound size={32} />,
    emoji: '👨‍👩‍👧',
  },
  {
    type: 'group',
    label: 'Gruppe',
    icon: <Users size={32} />,
    emoji: '👥',
  },
];

interface MoodSymbolPaletteProps {
  onSymbolDragStart: (symbolType: SymbolType) => void;
  onSymbolDragEnd: () => void;
  isDragging?: boolean;
  disabled?: boolean;
}

export function MoodSymbolPalette({
  onSymbolDragStart,
  onSymbolDragEnd,
  isDragging = false,
  disabled = false,
}: MoodSymbolPaletteProps) {
  const [draggedSymbol, setDraggedSymbol] = useState<SymbolType | null>(null);

  const handleDragStart = (e: React.DragEvent, symbolType: SymbolType) => {
    if (disabled) return;
    
    setDraggedSymbol(symbolType);
    onSymbolDragStart(symbolType);
    
    // Erstelle Drag-Image
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    dragImage.style.fontSize = '48px';
    dragImage.textContent = SYMBOLS.find(s => s.type === symbolType)?.emoji || '👤';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    // Setze Daten für Drag & Drop
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('symbolType', symbolType);
  };

  const handleDragEnd = () => {
    setDraggedSymbol(null);
    onSymbolDragEnd();
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
      <div className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
        <span>🎯</span>
        <span>Symbole auf die Karte ziehen</span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {SYMBOLS.map((symbol) => {
          const isCurrentlyDragging = draggedSymbol === symbol.type;
          
          return (
            <div
              key={symbol.type}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, symbol.type)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing
                transition-all duration-200
                ${isCurrentlyDragging 
                  ? 'bg-blue-500/30 border-blue-500 scale-95 opacity-50' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/50 hover:scale-105'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="text-3xl">{symbol.emoji}</div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{symbol.label}</div>
                <div className="text-xs text-gray-400">Auf Karte ziehen</div>
              </div>
              {isCurrentlyDragging && (
                <div className="text-blue-400 animate-pulse">→</div>
              )}
            </div>
          );
        })}
      </div>

      {isDragging && (
        <div className="mt-4 p-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-xs text-blue-300 text-center animate-pulse">
          🎯 Ziehe das Symbol auf die Karte und platziere es
        </div>
      )}
    </div>
  );
}

export { SYMBOLS };




