import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useState } from 'react';
import { MoodEntryWithValues, MoodIndicator } from '../lib/supabase';
import { GroupingFilter, GroupingFilterState } from './GroupingFilter';
import { filterEntriesByGrouping, extractUniqueValues, getFilterLabel } from '../lib/grouping-utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsProps {
  entries: MoodEntryWithValues[];
  indicators: MoodIndicator[];
}

export function Charts({ entries, indicators }: ChartsProps) {
  const [groupingFilter, setGroupingFilter] = useState<GroupingFilterState>({ type: 'none' });

  const { weathers, locations, tags } = extractUniqueValues(entries);
  const filteredEntries = filterEntriesByGrouping(entries, groupingFilter);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Keine Daten für Visualisierung vorhanden
      </div>
    );
  }

  const sortedEntries = [...filteredEntries].sort((a, b) =>
    new Date(a.entry_date || a.created_at).getTime() - new Date(b.entry_date || b.created_at).getTime()
  );

  const labels = sortedEntries.map(entry => {
    const date = new Date(entry.entry_date || entry.created_at);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  });

  const lineChartData = {
    labels,
    datasets: indicators
      .filter(ind => ind.is_active)
      .map(indicator => {
        const data = sortedEntries.map(entry => {
          const value = entry.values.find(v => v.indicator_id === indicator.id);
          return value ? value.value : null;
        });

        return {
          label: indicator.name,
          data,
          borderColor: indicator.color_start,
          backgroundColor: indicator.color_start + '20',
          tension: 0.4,
          fill: true,
        };
      }),
  };

  const latestEntry = sortedEntries[sortedEntries.length - 1];
  const radarData = {
    labels: indicators.filter(ind => ind.is_active).map(ind => ind.name),
    datasets: [
      {
        label: 'Aktuelle Werte',
        data: indicators.filter(ind => ind.is_active).map(indicator => {
          const value = latestEntry.values.find(v => v.indicator_id === indicator.id);
          return value ? value.value : 0;
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  };

  const avgData = indicators.filter(ind => ind.is_active).map(indicator => {
    const values = sortedEntries.flatMap(entry =>
      entry.values.filter(v => v.indicator_id === indicator.id).map(v => v.value)
    );
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  });

  const barData = {
    labels: indicators.filter(ind => ind.is_active).map(ind => ind.name),
    datasets: [
      {
        label: 'Durchschnittswerte',
        data: avgData,
        backgroundColor: indicators.filter(ind => ind.is_active).map(ind => ind.color_start + 'CC'),
        borderColor: indicators.filter(ind => ind.is_active).map(ind => ind.color_start),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="space-y-8">
      <GroupingFilter
        currentFilter={groupingFilter}
        onFilterChange={setGroupingFilter}
        availableWeathers={weathers}
        availableLocations={locations}
        availableTags={tags}
      />

      {filteredEntries.length === 0 && groupingFilter.type !== 'none' && (
        <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-yellow-200">
          <p className="text-yellow-800 font-medium">
            Keine Daten für den gewählten Filter vorhanden
          </p>
          <button
            onClick={() => setGroupingFilter({ type: 'none' })}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Filter zurücksetzen
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Verlauf über Zeit
          {groupingFilter.type !== 'none' && groupingFilter.value && (
            <span className="ml-2 text-sm text-blue-600 font-normal">
              • {getFilterLabel(groupingFilter)}
            </span>
          )}
        </h3>
        <div className="h-80">
          <Line data={lineChartData} options={options} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Durchschnittswerte</h3>
          <div className="h-80">
            <Bar data={barData} options={options} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Aktuelle Übersicht</h3>
          <div className="h-80">
            <Radar data={radarData} options={options} />
          </div>
        </div>
      </div>
    </div>
  );
}
