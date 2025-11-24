import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { MoodIndicator } from '../lib/supabase';

interface SliderMoodInputProps {
  indicators: MoodIndicator[];
  selectedValues: { [indicatorId: string]: number };
  onValueChange: (indicatorId: string, value: number) => void;
}

// Separate Komponente für jeden Indikator-Slider mit eigenem State
function IndicatorSlider({
  indicator,
  currentValue,
  onValueChange,
}: {
  indicator: MoodIndicator;
  currentValue: number;
  onValueChange: (value: number) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getGradientColor = (value: number, min: number, max: number, colorStart: string, colorEnd: string) => {
    const percentage = ((value - min) / (max - min)) * 100;
    return `linear-gradient(to right, ${colorStart} 0%, ${colorEnd} ${percentage}%, #e5e7eb ${percentage}%)`;
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {indicator.icon_url ? (
            (indicator.icon_url.startsWith('http://') || indicator.icon_url.startsWith('https://') || indicator.icon_url.startsWith('/')) ? (
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={indicator.icon_url} alt={indicator.name} className="w-10 h-10 object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 flex items-center justify-center text-xl">
                {indicator.icon_url}
              </div>
            )
          ) : (
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: `linear-gradient(to right, ${indicator.color_start}, ${indicator.color_end})`,
              }}
            />
          )}
          <span className="font-semibold text-gray-900 text-lg">{indicator.name}</span>
          {indicator.description && (
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="Hilfe anzeigen"
              >
                <HelpCircle size={18} />
              </button>
              {showTooltip && (
                <div className="absolute left-0 bottom-full mb-2 w-80 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl z-50 pointer-events-none">
                  <div className="font-semibold mb-1">{indicator.name}</div>
                  <div className="text-gray-300">{indicator.description}</div>
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-blue-600">
          {currentValue.toFixed(indicator.step_value < 1 ? 1 : 0)}
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={indicator.min_value}
          max={indicator.max_value}
          step={indicator.step_value}
          value={currentValue}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: getGradientColor(
              currentValue,
              indicator.min_value,
              indicator.max_value,
              indicator.color_start,
              indicator.color_end
            ),
          }}
        />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>{indicator.min_value}</span>
          <span>{indicator.max_value}</span>
        </div>
      </div>
    </div>
  );
}

export function SliderMoodInput({
  indicators,
  selectedValues,
  onValueChange,
}: SliderMoodInputProps) {
  const activeIndicators = indicators
    .filter((i) => i.is_active)
    .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }));

  if (activeIndicators.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Keine Indikatoren vorhanden. Erstelle welche in den Stammdaten.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeIndicators.map((indicator) => {
        const currentValue = selectedValues[indicator.id] ?? indicator.min_value;
        return (
          <IndicatorSlider
            key={indicator.id}
            indicator={indicator}
            currentValue={currentValue}
            onValueChange={(value) => onValueChange(indicator.id, value)}
          />
        );
      })}
    </div>
  );
}
