// WMO Weather Interpretation Codes
export const WMO_WEATHER_CODES: Record<number, { description: string; icon: string; category: string }> = {
  0: { description: 'Klarer Himmel', icon: '☀️', category: 'clear' },
  1: { description: 'Überwiegend klar', icon: '🌤️', category: 'clear' },
  2: { description: 'Teilweise bewölkt', icon: '⛅', category: 'cloudy' },
  3: { description: 'Bedeckt', icon: '☁️', category: 'cloudy' },
  45: { description: 'Nebel', icon: '🌫️', category: 'fog' },
  48: { description: 'Gefrierender Nebel', icon: '🌫️', category: 'fog' },
  51: { description: 'Leichter Nieselregen', icon: '🌦️', category: 'drizzle' },
  53: { description: 'Mäßiger Nieselregen', icon: '🌦️', category: 'drizzle' },
  55: { description: 'Starker Nieselregen', icon: '🌧️', category: 'drizzle' },
  56: { description: 'Leichter gefrierender Nieselregen', icon: '🌧️', category: 'freezing' },
  57: { description: 'Starker gefrierender Nieselregen', icon: '🌧️', category: 'freezing' },
  61: { description: 'Leichter Regen', icon: '🌦️', category: 'rain' },
  63: { description: 'Mäßiger Regen', icon: '🌧️', category: 'rain' },
  65: { description: 'Starker Regen', icon: '🌧️', category: 'rain' },
  66: { description: 'Leichter gefrierender Regen', icon: '🌧️', category: 'freezing' },
  67: { description: 'Starker gefrierender Regen', icon: '🌧️', category: 'freezing' },
  71: { description: 'Leichter Schneefall', icon: '🌨️', category: 'snow' },
  73: { description: 'Mäßiger Schneefall', icon: '❄️', category: 'snow' },
  75: { description: 'Starker Schneefall', icon: '❄️', category: 'snow' },
  77: { description: 'Schneegriesel', icon: '🌨️', category: 'snow' },
  80: { description: 'Leichte Regenschauer', icon: '🌦️', category: 'showers' },
  81: { description: 'Mäßige Regenschauer', icon: '🌧️', category: 'showers' },
  82: { description: 'Heftige Regenschauer', icon: '⛈️', category: 'showers' },
  85: { description: 'Leichte Schneeschauer', icon: '🌨️', category: 'snow' },
  86: { description: 'Starke Schneeschauer', icon: '❄️', category: 'snow' },
  95: { description: 'Gewitter', icon: '⛈️', category: 'thunderstorm' },
  96: { description: 'Gewitter mit leichtem Hagel', icon: '⛈️', category: 'thunderstorm' },
  99: { description: 'Gewitter mit schwerem Hagel', icon: '⛈️', category: 'thunderstorm' },
};

export interface WeatherData {
  weather_code: number;
  temperature: number;
  latitude: number;
  longitude: number;
  description: string;
  icon: string;
}

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export class WeatherService {
  private static readonly OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';
  private static readonly REVERSE_GEOCODING_API = 'https://nominatim.openstreetmap.org/reverse';

  /**
   * Get user's current geolocation using browser API
   */
  static async getCurrentLocation(): Promise<GeolocationCoords> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation wird von diesem Browser nicht unterstützt'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = 'Standort konnte nicht ermittelt werden';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Standortzugriff wurde verweigert';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Standortinformationen nicht verfügbar';
              break;
            case error.TIMEOUT:
              errorMessage = 'Zeitüberschreitung bei Standortabfrage';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        }
      );
    });
  }

  /**
   * Fetch current weather data from Open-Meteo API
   */
  static async fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const url = new URL(this.OPEN_METEO_API);
      url.searchParams.append('latitude', latitude.toString());
      url.searchParams.append('longitude', longitude.toString());
      url.searchParams.append('current', 'temperature_2m,weather_code');
      url.searchParams.append('timezone', 'auto');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Wetter-API Fehler: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.current) {
        throw new Error('Keine Wetterdaten verfügbar');
      }

      const weatherCode = data.current.weather_code;
      const temperature = data.current.temperature_2m;
      const weatherInfo = WMO_WEATHER_CODES[weatherCode] || {
        description: `Wetter-Code ${weatherCode}`,
        icon: '🌡️',
        category: 'unknown',
      };

      return {
        weather_code: weatherCode,
        temperature: temperature,
        latitude: latitude,
        longitude: longitude,
        description: weatherInfo.description,
        icon: weatherInfo.icon,
      };
    } catch (error: any) {
      console.error('Error fetching weather:', error);
      throw new Error(`Wetterdaten konnten nicht abgerufen werden: ${error.message}`);
    }
  }

  /**
   * Get current weather based on user's location
   */
  static async getCurrentWeather(): Promise<WeatherData> {
    const location = await this.getCurrentLocation();
    return this.fetchWeather(location.latitude, location.longitude);
  }

  /**
   * Get weather description from WMO code
   */
  static getWeatherDescription(code: number): string {
    return WMO_WEATHER_CODES[code]?.description || `Wetter-Code ${code}`;
  }

  /**
   * Get weather icon from WMO code
   */
  static getWeatherIcon(code: number): string {
    return WMO_WEATHER_CODES[code]?.icon || '🌡️';
  }

  /**
   * Get weather category from WMO code
   */
  static getWeatherCategory(code: number): string {
    return WMO_WEATHER_CODES[code]?.category || 'unknown';
  }

  /**
   * Get location name from coordinates using reverse geocoding
   */
  static async getLocationFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const url = new URL(this.REVERSE_GEOCODING_API);
      url.searchParams.append('lat', latitude.toString());
      url.searchParams.append('lon', longitude.toString());
      url.searchParams.append('format', 'json');
      url.searchParams.append('zoom', '10');
      url.searchParams.append('addressdetails', '1');

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'MoodTrackingApp/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API Fehler: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.address) {
        throw new Error('Keine Adressinformationen verfügbar');
      }

      const address = data.address;
      const parts: string[] = [];

      if (address.city) parts.push(address.city);
      else if (address.town) parts.push(address.town);
      else if (address.village) parts.push(address.village);
      else if (address.municipality) parts.push(address.municipality);

      if (address.state) parts.push(address.state);
      if (address.country) parts.push(address.country);

      return parts.length > 0 ? parts.join(', ') : 'Unbekannter Ort';
    } catch (error: any) {
      console.error('Error fetching location:', error);
      throw new Error(`Ortsinformationen konnten nicht abgerufen werden: ${error.message}`);
    }
  }

  /**
   * Get current location name based on user's position
   */
  static async getCurrentLocationName(): Promise<string> {
    const location = await this.getCurrentLocation();
    return this.getLocationFromCoordinates(location.latitude, location.longitude);
  }
}
