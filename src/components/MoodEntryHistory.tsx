import { useState } from 'react';
import { MoodEntryWithValues } from '../lib/supabase';
import { Trash2, StickyNote, Clock, Cloud, MapPin, Tag } from 'lucide-react';
import { GroupingFilter, GroupingFilterState } from './GroupingFilter';
import { filterEntriesByGrouping, extractUniqueValues } from '../lib/grouping-utils';
import { WeatherService } from '../lib/weather-service';

interface MoodEntryHistoryProps {
  entries: MoodEntryWithValues[];
  onDelete: (id: string) => void;
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) {
    return `Heute, ${timeStr}`;
  } else if (isYesterday) {
    return `Gestern, ${timeStr}`;
  } else {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

export function MoodEntryHistory({ entries, onDelete }: MoodEntryHistoryProps) {
  const [groupingFilter, setGroupingFilter] = useState<GroupingFilterState>({ type: 'none' });

  const { weathers, locations, tags } = extractUniqueValues(entries);
  const filteredEntries = filterEntriesByGrouping(entries, groupingFilter);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Noch keine Einträge vorhanden
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            Keine Einträge für den gewählten Filter gefunden
          </p>
          <button
            onClick={() => setGroupingFilter({ type: 'none' })}
            className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Filter zurücksetzen
          </button>
        </div>
      )}

      <div className="space-y-4">
        {filteredEntries.map((entry) => (
        <div
          key={entry.id}
          className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-600 font-medium">
              {formatDateTime(entry.entry_date || entry.created_at)}
            </span>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="p-4">
            {entry.note && (
              <div className="mb-4 flex items-start gap-2 text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <StickyNote size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <p>{entry.note}</p>
              </div>
            )}

            {(entry.time_of_day || entry.weather || entry.location || (entry.custom_tags && entry.custom_tags.length > 0)) && (
              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                {entry.time_of_day && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                    <Clock size={12} />
                    {entry.time_of_day === 'morning' && 'Morgens'}
                    {entry.time_of_day === 'noon' && 'Mittags'}
                    {entry.time_of_day === 'afternoon' && 'Nachmittags'}
                    {entry.time_of_day === 'evening' && 'Abends'}
                    {entry.time_of_day === 'night' && 'Nachts'}
                  </span>
                )}
                {(entry.weather || entry.weather_code !== null) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 text-sky-700 rounded-full">
                    {entry.weather_code !== null && entry.weather_code !== undefined ? (
                      <>
                        <span>{WeatherService.getWeatherIcon(entry.weather_code)}</span>
                        {entry.weather || WeatherService.getWeatherDescription(entry.weather_code)}
                        {entry.temperature !== null && entry.temperature !== undefined && ` (${entry.temperature.toFixed(1)}°C)`}
                      </>
                    ) : (
                      <>
                        <Cloud size={12} />
                        {entry.weather}
                      </>
                    )}
                  </span>
                )}
                {entry.location && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full">
                    <MapPin size={12} />
                    {entry.location}
                  </span>
                )}
                {entry.custom_tags && entry.custom_tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {entry.values.map((val) => (
                <div
                  key={val.indicator_id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: val.indicator_color }}
                    />
                    <span className="text-xs font-medium text-gray-600 truncate">
                      {val.indicator_name}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {val.value.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}
