import { useState } from 'react';
import { Clock, Cloud, MapPin, Tag, Plus, X, Navigation, Loader } from 'lucide-react';
import { WeatherService } from '../lib/weather-service';

interface MoodEntryMetadataProps {
  timeOfDay: string;
  weather: string;
  weatherCode: number | null;
  latitude: number | null;
  longitude: number | null;
  temperature: number | null;
  location: string;
  customTags: string[];
  onTimeOfDayChange: (value: string) => void;
  onWeatherChange: (value: string) => void;
  onWeatherDataChange: (data: { weatherCode: number; latitude: number; longitude: number; temperature: number }) => void;
  onLocationChange: (value: string) => void;
  onCustomTagsChange: (tags: string[]) => void;
}

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morgens' },
  { value: 'noon', label: 'Mittags' },
  { value: 'afternoon', label: 'Nachmittags' },
  { value: 'evening', label: 'Abends' },
  { value: 'night', label: 'Nachts' },
];

export function MoodEntryMetadata({
  timeOfDay,
  weather,
  weatherCode,
  latitude,
  longitude,
  temperature,
  location,
  customTags,
  onTimeOfDayChange,
  onWeatherChange,
  onWeatherDataChange,
  onLocationChange,
  onCustomTagsChange,
}: MoodEntryMetadataProps) {
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !customTags.includes(trimmedTag)) {
      onCustomTagsChange([...customTags, trimmedTag]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onCustomTagsChange(customTags.filter(tag => tag !== tagToRemove));
  };

  const handleFetchWeather = async () => {
    setFetchingWeather(true);
    setWeatherError(null);

    try {
      const weatherData = await WeatherService.getCurrentWeather();

      onWeatherDataChange({
        weatherCode: weatherData.weather_code,
        latitude: weatherData.latitude,
        longitude: weatherData.longitude,
        temperature: weatherData.temperature,
      });

      onWeatherChange(weatherData.description);
    } catch (error: any) {
      setWeatherError(error.message);
      console.error('Weather fetch error:', error);
    } finally {
      setFetchingWeather(false);
    }
  };

  const handleFetchLocation = async () => {
    setFetchingLocation(true);
    setLocationError(null);

    try {
      const locationName = await WeatherService.getCurrentLocationName();
      onLocationChange(locationName);
    } catch (error: any) {
      setLocationError(error.message);
      console.error('Location fetch error:', error);
    } finally {
      setFetchingLocation(false);
    }
  };

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Zusätzliche Informationen (Optional)
      </h4>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Clock size={16} />
          Tageszeit
        </label>
        <select
          value={timeOfDay}
          onChange={(e) => onTimeOfDayChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Automatisch erkennen</option>
          {TIME_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Cloud size={16} />
            Wetter
          </label>
          <button
            type="button"
            onClick={handleFetchWeather}
            disabled={fetchingWeather}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {fetchingWeather ? (
              <>
                <Loader size={14} className="animate-spin" />
                Lädt...
              </>
            ) : (
              <>
                <Navigation size={14} />
                Automatisch erfassen
              </>
            )}
          </button>
        </div>

        {weatherError && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {weatherError}
          </div>
        )}

        {weatherCode !== null && temperature !== null && (
          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{WeatherService.getWeatherIcon(weatherCode)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {WeatherService.getWeatherDescription(weatherCode)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {temperature.toFixed(1)}°C
                    {latitude && longitude && (
                      <span className="ml-2">
                        • {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <input
          type="text"
          value={weather}
          onChange={(e) => onWeatherChange(e.target.value)}
          placeholder="z.B. Sonnig, Bewölkt, Regnerisch..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Oder nutze den Button für automatische Erfassung
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin size={16} />
            Ort
          </label>
          <button
            type="button"
            onClick={handleFetchLocation}
            disabled={fetchingLocation}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {fetchingLocation ? (
              <>
                <Loader size={14} className="animate-spin" />
                Lädt...
              </>
            ) : (
              <>
                <Navigation size={14} />
                Automatisch erfassen
              </>
            )}
          </button>
        </div>

        {locationError && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {locationError}
          </div>
        )}

        <input
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="z.B. Zuhause, Arbeit, Unterwegs..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Oder nutze den Button für automatische Erfassung
        </p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Tag size={16} />
          Tags
        </label>

        <div className="flex flex-wrap gap-2 mb-2">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>

        {showTagInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="Neues Tag..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Hinzufügen
            </button>
            <button
              onClick={() => {
                setShowTagInput(false);
                setNewTag('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Abbrechen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
          >
            <Plus size={16} />
            Tag hinzufügen
          </button>
        )}
      </div>
    </div>
  );
}
