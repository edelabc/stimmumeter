import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Brain, Sparkles, AlertCircle } from 'lucide-react';
import { MoodEntryWithValues, MoodIndicator, Pseudonym } from '../lib/supabase';
import { getAIConfigurationsByUser, AIConfiguration } from '../lib/ai-provider.service';
import { AIService, AIAnalysisResponse } from '../lib/ai-service';
import { GroupingFilter, GroupingFilterState } from './GroupingFilter';
import { filterEntriesByGrouping, extractUniqueValues, getFilterLabel } from '../lib/grouping-utils';

interface ForecastViewProps {
  entries: MoodEntryWithValues[];
  indicators: MoodIndicator[];
  selectedPseudonym: Pseudonym | null;
  userId: string;
}

export function ForecastView({ entries, indicators, selectedPseudonym, userId }: ForecastViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiConfigurations, setAiConfigurations] = useState<AIConfiguration[]>([]);
  const [selectedAiConfig, setSelectedAiConfig] = useState<AIConfiguration | null>(null);
  const [useAi, setUseAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [groupingFilter, setGroupingFilter] = useState<GroupingFilterState>({ type: 'none' });

  const { weathers, locations, tags } = extractUniqueValues(entries);
  const filteredEntries = filterEntriesByGrouping(entries, groupingFilter);

  useEffect(() => {
    loadAiConfigurations();
  }, [userId]);

  const loadAiConfigurations = async () => {
    try {
      const data = await getAIConfigurationsByUser(userId, true);
      setAiConfigurations(data);
      
      const activeConfig = data.find(c => c.is_active);
      if (activeConfig) {
        setSelectedAiConfig(activeConfig);
      }
    } catch (err) {
      console.error('Error loading AI configurations:', err);
      setAiConfigurations([]); // Leeres Array bei Fehler
    }
  };

  const generateAiAnalysis = async () => {
    if (!selectedAiConfig || !selectedPseudonym || filteredEntries.length === 0) return;

    setLoadingAi(true);
    setAiError(null);

    try {
      const analysis = await AIService.analyze(selectedAiConfig, {
        pseudonym: selectedPseudonym,
        moodEntries: filteredEntries,
        indicators: indicators,
        timeframe: groupingFilter.type !== 'none' ? `Filtered by ${getFilterLabel(groupingFilter)}` : '7 days'
      });

      setAiAnalysis(analysis);
    } catch (err: any) {
      console.error('Error generating AI analysis:', err);
      setAiError(err.message || 'Fehler bei der KI-Analyse');
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    if (useAi && selectedAiConfig && selectedPseudonym && filteredEntries.length >= 3) {
      generateAiAnalysis();
    } else {
      setAiAnalysis(null);
    }
  }, [useAi, selectedAiConfig, selectedPseudonym, filteredEntries]);

  if (filteredEntries.length < 3) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nicht genügend Daten
        </h3>
        <p className="text-gray-500">
          Mindestens 3 Einträge erforderlich für Prognosen
        </p>
      </div>
    );
  }

  const calculateTrend = (indicatorId: string): { trend: number; direction: string } => {
    const relevantEntries = filteredEntries
      .slice(0, 7)
      .filter(e => e.values.some(v => v.indicator_id === indicatorId))
      .slice(0, 5);

    if (relevantEntries.length < 2) return { trend: 0, direction: 'stable' };

    const values = relevantEntries.map(e =>
      e.values.find(v => v.indicator_id === indicatorId)?.value || 0
    );

    const firstHalf = values.slice(0, Math.ceil(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const trend = avgSecond - avgFirst;
    const direction = trend > 0.3 ? 'up' : trend < -0.3 ? 'down' : 'stable';

    return { trend, direction };
  };

  const predictValue = (indicatorId: string, daysAhead: number): number => {
    const relevantEntries = filteredEntries
      .filter(e => e.values.some(v => v.indicator_id === indicatorId))
      .slice(0, 7);

    if (relevantEntries.length < 2) {
      const lastValue = filteredEntries[0]?.values.find(v => v.indicator_id === indicatorId)?.value || 0;
      return lastValue;
    }

    const values = relevantEntries.map(e =>
      e.values.find(v => v.indicator_id === indicatorId)?.value || 0
    );

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const { trend } = calculateTrend(indicatorId);

    const indicator = indicators.find(i => i.id === indicatorId);
    const minVal = indicator?.min_value || 0;
    const maxVal = indicator?.max_value || 10;

    const predicted = avg + (trend * daysAhead * 0.3);
    return Math.max(minVal, Math.min(maxVal, predicted));
  };

  const generateForecast = () => {
    const forecastDays = [];
    const today = new Date();

    for (let i = 0; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const predictions = indicators.filter(ind => ind.is_active).map(indicator => ({
        indicator,
        value: predictValue(indicator.id, i),
        trend: calculateTrend(indicator.id),
      }));

      forecastDays.push({
        date: dateStr,
        dayLabel: i === 0 ? 'Heute' : i === 1 ? 'Morgen' : date.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }),
        predictions,
      });
    }

    return forecastDays;
  };

  const forecast = generateForecast();
  const selectedForecast = forecast.find(f => f.date === selectedDate) || forecast[0];

  return (
    <div className="space-y-6">
      <GroupingFilter
        currentFilter={groupingFilter}
        onFilterChange={setGroupingFilter}
        availableWeathers={weathers}
        availableLocations={locations}
        availableTags={tags}
      />

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-blue-600" />
              7-Tage Prognose
            </h3>
            <p className="text-gray-600 mt-2">
              {useAi && selectedAiConfig
                ? `KI-gestützte Analyse mit ${selectedAiConfig.nickname}`
                : 'Basierend auf deinen bisherigen Einträgen'}
              {groupingFilter.type !== 'none' && groupingFilter.value && (
                <span className="ml-2 text-blue-600 font-medium">
                  • Gefiltert nach: {getFilterLabel(groupingFilter)}
                </span>
              )}
            </p>
          </div>

          {aiConfigurations.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">KI-Analyse:</label>
                <button
                  onClick={() => setUseAi(!useAi)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useAi ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useAi ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {useAi && aiConfigurations.length > 1 && (
                <select
                  value={selectedAiConfig?.id || ''}
                  onChange={(e) => {
                    const config = aiConfigurations.find(c => c.id === e.target.value);
                    setSelectedAiConfig(config || null);
                  }}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  {aiConfigurations.map(config => (
                    <option key={config.id} value={config.id}>
                      {config.nickname}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {forecast.map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
              className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
                selectedDate === day.date
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xs font-medium">{day.dayLabel}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h4 className="text-xl font-bold text-gray-900 mb-4">
          Voraussichtliche Verfassung am {selectedForecast.dayLabel}
        </h4>

        <div className="space-y-4">
          {selectedForecast.predictions.map(({ indicator, value, trend }) => {
            const percentage = ((value - indicator.min_value) / (indicator.max_value - indicator.min_value)) * 100;

            return (
              <div key={indicator.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{
                        background: `linear-gradient(to right, ${indicator.color_start}, ${indicator.color_end})`,
                      }}
                    />
                    <span className="font-semibold text-gray-900">{indicator.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-blue-600">
                      {value.toFixed(1)}
                    </span>
                    {trend.direction === 'up' && (
                      <TrendingUp className="text-green-600" size={24} />
                    )}
                    {trend.direction === 'down' && (
                      <TrendingDown className="text-red-600" size={24} />
                    )}
                    {trend.direction === 'stable' && (
                      <Minus className="text-gray-400" size={24} />
                    )}
                  </div>
                </div>

                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      background: `linear-gradient(to right, ${indicator.color_start}, ${indicator.color_end})`,
                    }}
                  />
                </div>

                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>{indicator.min_value}</span>
                  <span>{indicator.max_value}</span>
                </div>

                {trend.direction !== 'stable' && (
                  <div className="mt-3 text-sm">
                    <span className={`font-medium ${
                      trend.direction === 'up' ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Tendenz: {trend.direction === 'up' ? 'Steigend' : 'Fallend'}
                    </span>
                    <span className="text-gray-600 ml-2">
                      ({trend.trend > 0 ? '+' : ''}{trend.trend.toFixed(2)} Punkte)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Hinweis:</strong> Diese Prognosen basieren auf deinen bisherigen Einträgen
            und sind nur eine Schätzung. Tatsächliche Werte können abweichen.
          </p>
        </div>
      </div>

      {useAi && loadingAi && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Brain className="mx-auto text-blue-600 animate-pulse mb-4" size={48} />
          <p className="text-gray-600">KI analysiert deine Stimmungsdaten...</p>
        </div>
      )}

      {useAi && aiError && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-600" size={24} />
            <h4 className="text-xl font-bold text-gray-900">KI-Analysefehler</h4>
          </div>
          <p className="text-red-700">{aiError}</p>
        </div>
      )}

      {useAi && aiAnalysis && selectedAiConfig && !loadingAi && (
        <div
          className="rounded-xl shadow-lg p-6 border-2"
          style={{
            backgroundColor: selectedAiConfig.background_color,
            color: selectedAiConfig.text_color,
            borderColor: selectedAiConfig.text_color + '30'
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles size={28} />
            <h4 className="text-2xl font-bold">KI-gestützte Analyse</h4>
          </div>

          <div className="space-y-6">
            <div>
              <h5 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={20} />
                Prognose
              </h5>
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {aiAnalysis.forecast}
              </p>
            </div>

            {aiAnalysis.insights && aiAnalysis.insights.length > 0 && (
              <div>
                <h5 className="text-lg font-semibold mb-3">Einsichten</h5>
                <ul className="space-y-2">
                  {aiAnalysis.insights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-xl">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
              <div>
                <h5 className="text-lg font-semibold mb-3">Empfehlungen</h5>
                <ul className="space-y-2">
                  {aiAnalysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-xl">✓</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t opacity-70 text-sm">
            <p>
              Analysiert von: {selectedAiConfig.nickname} ({selectedAiConfig.provider} - {selectedAiConfig.model})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
