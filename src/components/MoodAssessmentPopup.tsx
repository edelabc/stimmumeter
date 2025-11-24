/**
 * Mood Assessment Popup - Popup für Stimmungsauswahl nach Symbol-Platzierung
 */

import { useState } from 'react';
import { X, Smile, Meh, Frown } from 'lucide-react';
import { SymbolType } from './MoodSymbolPalette';

export type MoodType = 'positive' | 'neutral' | 'negative';

interface MoodAssessmentPopupProps {
  symbolType: SymbolType;
  position: { x: number; y: number };
  onClose: () => void;
  onConfirm: (mood: MoodType, intensity?: number) => void;
}

const MOOD_OPTIONS: Array<{ type: MoodType; label: string; emoji: string; color: string }> = [
  {
    type: 'positive',
    label: 'Positiv',
    emoji: '😊',
    color: 'green',
  },
  {
    type: 'neutral',
    label: 'Neutral',
    emoji: '😐',
    color: 'gray',
  },
  {
    type: 'negative',
    label: 'Negativ',
    emoji: '😔',
    color: 'red',
  },
];

export function MoodAssessmentPopup({
  symbolType,
  position,
  onClose,
  onConfirm,
}: MoodAssessmentPopupProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState(1);

  const handleConfirm = () => {
    if (selectedMood) {
      onConfirm(selectedMood, intensity);
    }
  };

  const getSymbolLabel = () => {
    const labels: Record<SymbolType, string> = {
      woman: 'Frau',
      man: 'Mann',
      child: 'Kind',
      family: 'Familie',
      group: 'Gruppe',
    };
    return labels[symbolType];
  };

  return (
    <div
      className="fixed z-[1000] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 min-w-[320px] max-w-[400px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Stimmung erfassen</h3>
          <p className="text-sm text-gray-400">{getSymbolLabel()}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Mood Selection */}
      <div className="mb-6">
        <p className="text-sm text-gray-300 mb-3">Wie ist die Stimmung?</p>
        <div className="grid grid-cols-3 gap-2">
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.type}
              onClick={() => setSelectedMood(mood.type)}
              className={`
                py-4 px-3 rounded-xl border-2 transition-all
                flex flex-col items-center gap-2
                ${selectedMood === mood.type
                  ? `bg-${mood.color}-500/20 border-${mood.color}-500 scale-105`
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                }
              `}
            >
              <span className="text-3xl">{mood.emoji}</span>
              <span className={`text-xs font-medium ${
                selectedMood === mood.type ? `text-${mood.color}-400` : 'text-gray-400'
              }`}>
                {mood.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity Slider (für später erweiterbar) */}
      {selectedMood && (
        <div className="mb-6">
          <label className="text-sm text-gray-300 mb-2 block">
            Intensität: {intensity}/5
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={intensity}
            onChange={(e) => setIntensity(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 px-4 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
        >
          Abbrechen
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selectedMood}
          className={`
            flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all
            ${selectedMood
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Speichern
        </button>
      </div>
    </div>
  );
}


