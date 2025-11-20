import { useState } from 'react';
import { Filter, Calendar, Clock, Cloud, MapPin, Tag, X } from 'lucide-react';

export type GroupingType = 'none' | 'weekday' | 'time_of_day' | 'season' | 'weather' | 'location' | 'custom_tag';

export interface GroupingFilterState {
  type: GroupingType;
  value?: string;
}

interface GroupingFilterProps {
  onFilterChange: (filter: GroupingFilterState) => void;
  currentFilter: GroupingFilterState;
  availableWeathers?: string[];
  availableLocations?: string[];
  availableTags?: string[];
}

const WEEKDAYS = [
  { value: '0', label: 'Sonntag' },
  { value: '1', label: 'Montag' },
  { value: '2', label: 'Dienstag' },
  { value: '3', label: 'Mittwoch' },
  { value: '4', label: 'Donnerstag' },
  { value: '5', label: 'Freitag' },
  { value: '6', label: 'Samstag' },
];

const TIME_OF_DAY = [
  { value: 'morning', label: 'Morgens (5-12 Uhr)' },
  { value: 'noon', label: 'Mittags (12-14 Uhr)' },
  { value: 'afternoon', label: 'Nachmittags (14-18 Uhr)' },
  { value: 'evening', label: 'Abends (18-22 Uhr)' },
  { value: 'night', label: 'Nachts (22-5 Uhr)' },
];

const SEASONS = [
  { value: 'spring', label: 'Frühling' },
  { value: 'summer', label: 'Sommer' },
  { value: 'autumn', label: 'Herbst' },
  { value: 'winter', label: 'Winter' },
];

export function GroupingFilter({
  onFilterChange,
  currentFilter,
  availableWeathers = [],
  availableLocations = [],
  availableTags = [],
}: GroupingFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTypeChange = (type: GroupingType) => {
    if (type === 'none') {
      onFilterChange({ type: 'none' });
      setIsExpanded(false);
    } else {
      onFilterChange({ type, value: undefined });
      setIsExpanded(true);
    }
  };

  const handleValueChange = (value: string) => {
    onFilterChange({ type: currentFilter.type, value });
  };

  const clearFilter = () => {
    onFilterChange({ type: 'none' });
    setIsExpanded(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold text-gray-900">Gruppierung & Filter</h3>
        </div>
        {currentFilter.type !== 'none' && (
          <button
            onClick={clearFilter}
            className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={16} />
            Filter löschen
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
        <button
          onClick={() => handleTypeChange('none')}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            currentFilter.type === 'none'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <X size={20} />
          <span className="text-xs font-medium">Keine</span>
        </button>

        <button
          onClick={() => handleTypeChange('weekday')}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            currentFilter.type === 'weekday'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Calendar size={20} />
          <span className="text-xs font-medium">Wochentag</span>
        </button>

        <button
          onClick={() => handleTypeChange('time_of_day')}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            currentFilter.type === 'time_of_day'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Clock size={20} />
          <span className="text-xs font-medium">Tageszeit</span>
        </button>

        <button
          onClick={() => handleTypeChange('season')}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            currentFilter.type === 'season'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Calendar size={20} />
          <span className="text-xs font-medium">Jahreszeit</span>
        </button>

        <button
          onClick={() => handleTypeChange('weather')}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            currentFilter.type === 'weather'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Cloud size={20} />
          <span className="text-xs font-medium">Wetter</span>
        </button>

        <button
          onClick={() => handleTypeChange('location')}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            currentFilter.type === 'location'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <MapPin size={20} />
          <span className="text-xs font-medium">Ort</span>
        </button>

        <button
          onClick={() => handleTypeChange('custom_tag')}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            currentFilter.type === 'custom_tag'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Tag size={20} />
          <span className="text-xs font-medium">Tag</span>
        </button>
      </div>

      {isExpanded && currentFilter.type !== 'none' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wähle einen Wert:
          </label>

          {currentFilter.type === 'weekday' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => handleValueChange(day.value)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    currentFilter.value === day.value
                      ? 'border-blue-500 bg-blue-100 text-blue-700 font-medium'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          )}

          {currentFilter.type === 'time_of_day' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {TIME_OF_DAY.map((time) => (
                <button
                  key={time.value}
                  onClick={() => handleValueChange(time.value)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-left ${
                    currentFilter.value === time.value
                      ? 'border-blue-500 bg-blue-100 text-blue-700 font-medium'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {time.label}
                </button>
              ))}
            </div>
          )}

          {currentFilter.type === 'season' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SEASONS.map((season) => (
                <button
                  key={season.value}
                  onClick={() => handleValueChange(season.value)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    currentFilter.value === season.value
                      ? 'border-blue-500 bg-blue-100 text-blue-700 font-medium'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {season.label}
                </button>
              ))}
            </div>
          )}

          {currentFilter.type === 'weather' && availableWeathers.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableWeathers.map((weather) => (
                <button
                  key={weather}
                  onClick={() => handleValueChange(weather)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    currentFilter.value === weather
                      ? 'border-blue-500 bg-blue-100 text-blue-700 font-medium'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {weather}
                </button>
              ))}
            </div>
          )}

          {currentFilter.type === 'location' && availableLocations.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableLocations.map((location) => (
                <button
                  key={location}
                  onClick={() => handleValueChange(location)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    currentFilter.value === location
                      ? 'border-blue-500 bg-blue-100 text-blue-700 font-medium'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          )}

          {currentFilter.type === 'custom_tag' && availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleValueChange(tag)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    currentFilter.value === tag
                      ? 'border-blue-500 bg-blue-100 text-blue-700 font-medium'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {currentFilter.type === 'weather' && availableWeathers.length === 0 && (
            <p className="text-sm text-gray-600">
              Keine Wetter-Daten vorhanden. Fügen Sie Wetter-Informationen bei Ihren Einträgen hinzu.
            </p>
          )}

          {currentFilter.type === 'location' && availableLocations.length === 0 && (
            <p className="text-sm text-gray-600">
              Keine Orts-Daten vorhanden. Fügen Sie Orts-Informationen bei Ihren Einträgen hinzu.
            </p>
          )}

          {currentFilter.type === 'custom_tag' && availableTags.length === 0 && (
            <p className="text-sm text-gray-600">
              Keine Tags vorhanden. Fügen Sie Tags bei Ihren Einträgen hinzu.
            </p>
          )}
        </div>
      )}

      {currentFilter.type !== 'none' && currentFilter.value && (
        <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Aktiver Filter:</strong> {getFilterDescription(currentFilter)}
          </p>
        </div>
      )}
    </div>
  );
}

function getFilterDescription(filter: GroupingFilterState): string {
  if (filter.type === 'none') return 'Keine Filterung';
  if (!filter.value) return 'Kein Wert ausgewählt';

  switch (filter.type) {
    case 'weekday':
      return `Wochentag: ${WEEKDAYS.find(d => d.value === filter.value)?.label}`;
    case 'time_of_day':
      return `Tageszeit: ${TIME_OF_DAY.find(t => t.value === filter.value)?.label}`;
    case 'season':
      return `Jahreszeit: ${SEASONS.find(s => s.value === filter.value)?.label}`;
    case 'weather':
      return `Wetter: ${filter.value}`;
    case 'location':
      return `Ort: ${filter.value}`;
    case 'custom_tag':
      return `Tag: ${filter.value}`;
    default:
      return filter.value;
  }
}
