import { MoodIndicator } from '../lib/supabase';

interface SliderMoodInputProps {
  indicators: MoodIndicator[];
  selectedValues: { [indicatorId: string]: number };
  onValueChange: (indicatorId: string, value: number) => void;
}

export function SliderMoodInput({
  indicators,
  selectedValues,
  onValueChange,
}: SliderMoodInputProps) {
  const activeIndicators = indicators.filter((i) => i.is_active);

  if (activeIndicators.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Keine Indikatoren vorhanden. Erstelle welche in den Stammdaten.
      </div>
    );
  }

  const getGradientColor = (value: number, min: number, max: number, colorStart: string, colorEnd: string) => {
    const percentage = ((value - min) / (max - min)) * 100;
    return `linear-gradient(to right, ${colorStart} 0%, ${colorEnd} ${percentage}%, #e5e7eb ${percentage}%)`;
  };

  return (
    <div className="space-y-6">
      {activeIndicators.map((indicator) => {
        const currentValue = selectedValues[indicator.id] ?? indicator.min_value;

        return (
          <div key={indicator.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {indicator.icon_url ? (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img src={indicator.icon_url} alt={indicator.name} className="w-10 h-10 object-contain" />
                  </div>
                ) : (
                  <div
                    className="w-5 h-5 rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${indicator.color_start}, ${indicator.color_end})`,
                    }}
                  />
                )}
                <span className="font-semibold text-gray-900 text-lg">{indicator.name}</span>
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
                onChange={(e) => onValueChange(indicator.id, Number(e.target.value))}
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
      })}
    </div>
  );
}
