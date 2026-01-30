import { MoodEntryWithValues } from './supabase';
import { GroupingFilterState } from '../components/GroupingFilter';

export function filterEntriesByGrouping(
  entries: MoodEntryWithValues[],
  filter: GroupingFilterState
): MoodEntryWithValues[] {
  if (filter.type === 'none' || !filter.value) {
    return entries;
  }

  return entries.filter((entry) => {
    const entryDate = new Date(entry.entry_date);

    switch (filter.type) {
      case 'weekday': {
        const dayOfWeek = entryDate.getDay().toString();
        return dayOfWeek === filter.value;
      }

      case 'time_of_day': {
        return entry.time_of_day === filter.value;
      }

      case 'season': {
        const month = entryDate.getMonth() + 1;
        const season = getSeasonFromMonth(month);
        return season === filter.value;
      }

      case 'weather': {
        return entry.weather === filter.value;
      }

      case 'location': {
        return entry.location === filter.value;
      }

      case 'custom_tag': {
        return entry.custom_tags?.includes(filter.value) || false;
      }

      default:
        return true;
    }
  });
}

function getSeasonFromMonth(month: number): string {
  if (month === 12 || month === 1 || month === 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'unknown';
}

export function getTimeOfDayFromDate(date: Date): string {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function extractUniqueValues(entries: MoodEntryWithValues[]) {
  const weathers = new Set<string>();
  const locations = new Set<string>();
  const tags = new Set<string>();

  entries.forEach((entry) => {
    if (entry.weather) weathers.add(entry.weather);
    if (entry.location) locations.add(entry.location);
    if (entry.custom_tags) {
      entry.custom_tags.forEach((tag) => tags.add(tag));
    }
  });

  return {
    weathers: Array.from(weathers).sort(),
    locations: Array.from(locations).sort(),
    tags: Array.from(tags).sort(),
  };
}

export function getFilterLabel(filter: GroupingFilterState): string {
  if (filter.type === 'none') return 'Alle Einträge';
  if (!filter.value) return 'Kein Filter';

  const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const TIME_OF_DAY_MAP: Record<string, string> = {
    morning: 'Morgens',
    noon: 'Mittags',
    afternoon: 'Nachmittags',
    evening: 'Abends',
    night: 'Nachts',
  };
  const SEASON_MAP: Record<string, string> = {
    spring: 'Frühling',
    summer: 'Sommer',
    autumn: 'Herbst',
    winter: 'Winter',
  };

  switch (filter.type) {
    case 'weekday':
      return `${WEEKDAYS[parseInt(filter.value)]}`;
    case 'time_of_day':
      return TIME_OF_DAY_MAP[filter.value] || filter.value;
    case 'season':
      return SEASON_MAP[filter.value] || filter.value;
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
