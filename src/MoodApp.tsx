import { useState, useEffect, useRef } from 'react';
import { Menu, X, Plus, Users, BarChart3, Settings as SettingsIcon, Calendar, LogOut, TrendingUp, Shield, User as UserIcon, Search } from 'lucide-react';
import { supabase, Pseudonym, MoodIndicator, MoodEntryWithValues } from './lib/supabase';
import { getCurrentUser, signOut } from './lib/auth';
import { checkCurrentUserIsAdmin } from './lib/admin';
import { AuthForm } from './components/AuthForm';
import { PseudonymList } from './components/PseudonymList';
import { PseudonymForm } from './components/PseudonymForm';
import { SliderMoodInput } from './components/SliderMoodInput';
import { MoodEntryMetadata } from './components/MoodEntryMetadata';
import { getTimeOfDayFromDate } from './lib/grouping-utils';
import { MoodEntryHistory } from './components/MoodEntryHistory';
import { MasterDataSettings } from './components/MasterDataSettings';
import { Charts } from './components/Charts';
import { ExportShare } from './components/ExportShare';
import { ForecastView } from './components/ForecastView';
import { AccountSettings } from './components/AccountSettings';

type View = 'entry' | 'history' | 'charts' | 'forecast';

export function MoodApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<View>('entry');
  const [pseudonyms, setPseudonyms] = useState<Pseudonym[]>([]);
  const [selectedPseudonym, setSelectedPseudonym] = useState<Pseudonym | null>(null);
  const [indicators, setIndicators] = useState<MoodIndicator[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntryWithValues[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingPseudonym, setEditingPseudonym] = useState<Pseudonym | null>(null);
  const [selectedValues, setSelectedValues] = useState<{ [indicatorId: string]: number }>({});
  const [note, setNote] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 16));
  const [timeOfDay, setTimeOfDay] = useState('');
  const [weather, setWeather] = useState('');
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [location, setLocation] = useState('');
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntryWithValues | null>(null);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [indicatorSearchQuery, setIndicatorSearchQuery] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadPseudonyms();
      loadIndicators();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPseudonym) {
      loadMoodEntries(selectedPseudonym.id);
    } else {
      setMoodEntries([]);
    }
  }, [selectedPseudonym]);

  const checkUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      const adminStatus = await checkCurrentUserIsAdmin();
      setIsAdmin(adminStatus);
    }
    setLoading(false);
  };

  const loadPseudonyms = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('pseudonyms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading pseudonyms:', error);
      return;
    }

    setPseudonyms(data || []);
  };

  const loadIndicators = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('mood_indicators')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading indicators:', error);
      return;
    }

    setIndicators(data || []);
  };

  const loadMoodEntries = async (pseudonymId: string) => {
    const { data: entriesData, error: entriesError } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('pseudonym_id', pseudonymId)
      .order('entry_date', { ascending: false });

    if (entriesError) {
      console.error('Error loading mood entries:', entriesError);
      return;
    }

    const entriesWithValues: MoodEntryWithValues[] = [];

    for (const entry of entriesData || []) {
      const { data: valuesData, error: valuesError } = await supabase
        .from('mood_indicator_values')
        .select(`
          id,
          indicator_id,
          value,
          mood_indicators (name, color, color_start)
        `)
        .eq('mood_entry_id', entry.id);

      if (valuesError) {
        console.error('Error loading values:', valuesError);
        continue;
      }

      const values = (valuesData || [])
        .filter((v: any) => v.mood_indicators !== null)
        .map((v: any) => ({
          indicator_id: v.indicator_id,
          indicator_name: v.mood_indicators.name,
          indicator_color: v.mood_indicators.color_start || v.mood_indicators.color,
          value: v.value,
        }));

      entriesWithValues.push({
        ...entry,
        values,
      });
    }

    setMoodEntries(entriesWithValues);
  };

  const handleCreateOrUpdatePseudonym = async (
    name: string,
    color: string,
    personalData?: Partial<Pseudonym>
  ) => {
    if (!user) return;

    const dataToSave = {
      name,
      color,
      ...personalData
    };

    if (editingPseudonym) {
      const { error } = await supabase
        .from('pseudonyms')
        .update(dataToSave)
        .eq('id', editingPseudonym.id);

      if (error) {
        console.error('Error updating pseudonym:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('pseudonyms')
        .insert([{ ...dataToSave, user_id: user.id }]);

      if (error) {
        console.error('Error creating pseudonym:', error);
        return;
      }
    }

    await loadPseudonyms();
    setIsFormOpen(false);
    setEditingPseudonym(null);
  };

  const handleDeletePseudonym = async (id: string) => {
    if (!confirm('Pseudonym löschen? Alle Daten gehen verloren.')) return;

    const { error } = await supabase
      .from('pseudonyms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pseudonym:', error);
      return;
    }

    if (selectedPseudonym?.id === id) {
      setSelectedPseudonym(null);
    }

    await loadPseudonyms();
  };

  const handleEditPseudonym = (pseudonym: Pseudonym) => {
    setEditingPseudonym(pseudonym);
    setIsFormOpen(true);
  };

  const handleSubmitMoodEntry = async () => {
    if (!selectedPseudonym || Object.keys(selectedValues).length === 0) return;

    setIsSubmitting(true);

    if (editingEntry) {
      const { error: deleteValuesError } = await supabase
        .from('mood_indicator_values')
        .delete()
        .eq('mood_entry_id', editingEntry.id);

      if (deleteValuesError) {
        console.error('Error deleting old values:', deleteValuesError);
        setIsSubmitting(false);
        return;
      }

      const entryDateObj = new Date(entryDate);
      const computedTimeOfDay = timeOfDay || getTimeOfDayFromDate(entryDateObj);

      const { error: updateError } = await supabase
        .from('mood_entries')
        .update({
          note: note.trim() || null,
          entry_date: entryDateObj.toISOString(),
          time_of_day: computedTimeOfDay,
          weather: weather.trim() || null,
          weather_code: weatherCode,
          latitude: latitude,
          longitude: longitude,
          temperature: temperature,
          location: location.trim() || null,
          custom_tags: customTags.length > 0 ? customTags : null,
        })
        .eq('id', editingEntry.id);

      if (updateError) {
        console.error('Error updating mood entry:', updateError);
        setIsSubmitting(false);
        return;
      }

      const valuesToInsert = Object.entries(selectedValues).map(([indicatorId, value]) => ({
        mood_entry_id: editingEntry.id,
        indicator_id: indicatorId,
        value,
      }));

      const { error: valuesError } = await supabase
        .from('mood_indicator_values')
        .insert(valuesToInsert);

      if (valuesError) {
        console.error('Error creating indicator values:', valuesError);
        setIsSubmitting(false);
        return;
      }
    } else {
      const entryDateObj = new Date(entryDate);
      const computedTimeOfDay = timeOfDay || getTimeOfDayFromDate(entryDateObj);

      const { data: entryData, error: entryError } = await supabase
        .from('mood_entries')
        .insert([{
          pseudonym_id: selectedPseudonym.id,
          note: note.trim() || null,
          entry_date: entryDateObj.toISOString(),
          time_of_day: computedTimeOfDay,
          weather: weather.trim() || null,
          weather_code: weatherCode,
          latitude: latitude,
          longitude: longitude,
          temperature: temperature,
          location: location.trim() || null,
          custom_tags: customTags.length > 0 ? customTags : null,
        }])
        .select()
        .single();

      if (entryError || !entryData) {
        console.error('Error creating mood entry:', entryError);
        setIsSubmitting(false);
        return;
      }

      const valuesToInsert = Object.entries(selectedValues).map(([indicatorId, value]) => ({
        mood_entry_id: entryData.id,
        indicator_id: indicatorId,
        value,
      }));

      const { error: valuesError } = await supabase
        .from('mood_indicator_values')
        .insert(valuesToInsert);

      if (valuesError) {
        console.error('Error creating indicator values:', valuesError);
        setIsSubmitting(false);
        return;
      }
    }

    setSelectedValues({});
    setNote('');
    setEntryDate(new Date().toISOString().slice(0, 16));
    setTimeOfDay('');
    setWeather('');
    setWeatherCode(null);
    setLatitude(null);
    setLongitude(null);
    setTemperature(null);
    setLocation('');
    setCustomTags([]);
    setEditingEntry(null);
    setIndicatorSearchQuery('');
    setIsSubmitting(false);
    setIsEntryModalOpen(false);
    await loadMoodEntries(selectedPseudonym.id);
  };

  const handleDeleteMoodEntry = async (id: string) => {
    const { error } = await supabase
      .from('mood_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting mood entry:', error);
      return;
    }

    if (selectedPseudonym) {
      await loadMoodEntries(selectedPseudonym.id);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setPseudonyms([]);
    setSelectedPseudonym(null);
    setIndicators([]);
    setMoodEntries([]);
  };

  const hasSelectedAnyIndicator = Object.keys(selectedValues).length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={checkUser} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Stimmungs-Tracker
              </h1>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setCurrentView('entry')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'entry' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <Plus size={18} />
                Eintragen
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'history' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <Calendar size={18} />
                Verlauf
              </button>
              <button
                onClick={() => setCurrentView('charts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'charts' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <BarChart3 size={18} />
                Diagramme
              </button>
              <button
                onClick={() => setCurrentView('forecast')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'forecast' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <TrendingUp size={18} />
                Prognose
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                <SettingsIcon size={18} />
                Stammdaten
              </button>
              <button
                onClick={() => setIsAccountSettingsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                <UserIcon size={18} />
                Mein Konto
              </button>
              {isAdmin && (
                <button
                  onClick={() => window.location.href = '/admin'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 text-blue-600"
                >
                  <Shield size={18} />
                  Admin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-100 text-red-600"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="lg:hidden border-t py-4 space-y-2">
              <button
                onClick={() => { setCurrentView('entry'); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
              >
                <Plus size={18} />
                Eintragen
              </button>
              <button
                onClick={() => { setCurrentView('history'); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
              >
                <Calendar size={18} />
                Verlauf
              </button>
              <button
                onClick={() => { setCurrentView('charts'); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
              >
                <BarChart3 size={18} />
                Diagramme
              </button>
              <button
                onClick={() => { setCurrentView('forecast'); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
              >
                <TrendingUp size={18} />
                Prognose
              </button>
              <button
                onClick={() => { setIsSettingsOpen(true); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
              >
                <SettingsIcon size={18} />
                Stammdaten
              </button>
              <button
                onClick={() => { setIsAccountSettingsOpen(true); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
              >
                <UserIcon size={18} />
                Mein Konto
              </button>
              {isAdmin && (
                <button
                  onClick={() => { window.location.href = '/admin'; setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-blue-100 text-blue-600 text-left"
                >
                  <Shield size={18} />
                  Admin
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-100 text-red-600 text-left"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users size={24} className="text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Pseudonyme</h2>
                </div>
                <button
                  onClick={() => {
                    setEditingPseudonym(null);
                    setIsFormOpen(true);
                  }}
                  className="p-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-colors shadow-lg"
                >
                  <Plus size={18} />
                </button>
              </div>

              {pseudonyms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4 text-sm">Noch keine Pseudonyme</p>
                  <button
                    onClick={() => setIsFormOpen(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Erstelle dein erstes Pseudonym
                  </button>
                </div>
              ) : (
                <PseudonymList
                  pseudonyms={pseudonyms}
                  selectedPseudonym={selectedPseudonym}
                  onSelect={setSelectedPseudonym}
                  onDelete={handleDeletePseudonym}
                  onEdit={handleEditPseudonym}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {!selectedPseudonym ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Users size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Wähle ein Pseudonym
                </h3>
                <p className="text-gray-500">
                  Wähle links ein Pseudonym aus oder erstelle ein neues
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentView === 'entry' && (
                  <>
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: selectedPseudonym.color }}
                          />
                          <h2 className="text-2xl font-bold text-gray-900">
                            {selectedPseudonym.name}
                          </h2>
                        </div>
                      </div>

                      {moodEntries.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500 mb-6">Noch keine Einträge vorhanden</p>
                          <button
                            onClick={() => {
                              setEditingEntry(null);
                              setSelectedValues({});
                              setNote('');
                              setEntryDate(new Date().toISOString().slice(0, 16));
                              setIsEntryModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 transition-colors shadow-lg"
                          >
                            <Plus className="w-5 h-5" />
                            Ersten Eintrag erstellen
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-4 mb-6">
                            {moodEntries.map((entry) => (
                              <div
                                key={entry.id}
                                className="p-4 border-2 border-gray-200 rounded-2xl hover:border-gray-300 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <time className="text-sm font-medium text-gray-600">
                                    {new Date(entry.entry_date).toLocaleString('de-DE', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </time>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingEntry(entry);
                                        const values: { [key: string]: number } = {};
                                        entry.values.forEach(v => {
                                          values[v.indicator_id] = v.value;
                                        });
                                        setSelectedValues(values);
                                        setNote(entry.note || '');
                                        setEntryDate(new Date(entry.entry_date).toISOString().slice(0, 16));
                                        setTimeOfDay(entry.time_of_day || '');
                                        setWeather(entry.weather || '');
                                        setWeatherCode(entry.weather_code || null);
                                        setLatitude(entry.latitude || null);
                                        setLongitude(entry.longitude || null);
                                        setTemperature(entry.temperature || null);
                                        setLocation(entry.location || '');
                                        setCustomTags(entry.custom_tags || []);
                                        setIsEntryModalOpen(true);
                                      }}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Bearbeiten"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMoodEntry(entry.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Löschen"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {entry.values.map((val) => (
                                    <div
                                      key={val.indicator_id}
                                      className="flex items-center justify-between px-3 py-2 rounded-xl"
                                      style={{ backgroundColor: `${val.indicator_color}15` }}
                                    >
                                      <span className="text-sm font-medium text-gray-700">
                                        {val.indicator_name}
                                      </span>
                                      <span
                                        className="text-sm font-bold px-2 py-1 rounded-lg"
                                        style={{
                                          backgroundColor: val.indicator_color,
                                          color: 'white'
                                        }}
                                      >
                                        {val.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                {entry.note && (
                                  <p className="mt-3 text-sm text-gray-600 italic border-t pt-3">
                                    {entry.note}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-center">
                            <button
                              onClick={() => {
                                setEditingEntry(null);
                                setSelectedValues({});
                                setNote('');
                                setEntryDate(new Date().toISOString().slice(0, 16));
                                setIsEntryModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-full hover:from-blue-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
                              title="Neuer Eintrag"
                            >
                              <Plus className="w-6 h-6" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {currentView === 'history' && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Verlauf</h3>
                    <MoodEntryHistory entries={moodEntries} onDelete={handleDeleteMoodEntry} />
                  </div>
                )}

                {currentView === 'charts' && (
                  <div ref={chartRef}>
                    <div className="mb-4 flex justify-end">
                      <ExportShare
                        contentRef={chartRef}
                        pseudonymName={selectedPseudonym.name}
                      />
                    </div>
                    <Charts entries={moodEntries} indicators={indicators} />
                  </div>
                )}

                {currentView === 'forecast' && (
                  <ForecastView
                    entries={moodEntries}
                    indicators={indicators}
                    selectedPseudonym={selectedPseudonym}
                    userId={user.id}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <PseudonymForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingPseudonym(null);
        }}
        onSubmit={handleCreateOrUpdatePseudonym}
        editingPseudonym={editingPseudonym}
        usedColors={pseudonyms.map(p => p.color)}
      />

      <MasterDataSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onIndicatorsUpdated={loadIndicators}
        userId={user.id}
      />

      {isEntryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h3>
              <button
                onClick={() => {
                  setIsEntryModalOpen(false);
                  setEditingEntry(null);
                  setSelectedValues({});
                  setNote('');
                  setEntryDate(new Date().toISOString().slice(0, 16));
                  setTimeOfDay('');
                  setWeather('');
                  setWeatherCode(null);
                  setLatitude(null);
                  setLongitude(null);
                  setTemperature(null);
                  setLocation('');
                  setCustomTags([]);
                  setIndicatorSearchQuery('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-shrink-0 p-6 space-y-6 border-b bg-white">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zeitpunkt
                  </label>
                  <input
                    type="datetime-local"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sticky top-0 z-10 bg-white pb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indikatoren suchen
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={indicatorSearchQuery}
                      onChange={(e) => setIndicatorSearchQuery(e.target.value)}
                      placeholder="Nach Indikator-Namen suchen..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {indicatorSearchQuery && (
                      <button
                        onClick={() => setIndicatorSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <SliderMoodInput
                  indicators={indicators
                    .filter((indicator) => {
                      if (!indicatorSearchQuery.trim()) return true;
                      const query = indicatorSearchQuery.toLowerCase().trim();
                      return indicator.name.toLowerCase().includes(query);
                    })
                    .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))}
                  selectedValues={selectedValues}
                  onValueChange={(id, val) =>
                    setSelectedValues((prev) => ({ ...prev, [id]: val }))
                  }
                />
              </div>

              <div className="flex-shrink-0 overflow-y-auto p-6 space-y-6 border-t bg-white max-h-[40vh]">
                {hasSelectedAnyIndicator && (
                  <div>
                    <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                      Notiz (optional)
                    </label>
                    <textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Was beschäftigt dich?"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                )}

                {hasSelectedAnyIndicator && (
                  <MoodEntryMetadata
                    timeOfDay={timeOfDay}
                    weather={weather}
                    weatherCode={weatherCode}
                    latitude={latitude}
                    longitude={longitude}
                    temperature={temperature}
                    location={location}
                    customTags={customTags}
                    onTimeOfDayChange={setTimeOfDay}
                    onWeatherChange={setWeather}
                    onWeatherDataChange={(data) => {
                      setWeatherCode(data.weatherCode);
                      setLatitude(data.latitude);
                      setLongitude(data.longitude);
                      setTemperature(data.temperature);
                    }}
                    onLocationChange={setLocation}
                    onCustomTagsChange={setCustomTags}
                  />
                )}

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setIsEntryModalOpen(false);
                      setEditingEntry(null);
                      setSelectedValues({});
                      setNote('');
                      setEntryDate(new Date().toISOString().slice(0, 16));
                      setTimeOfDay('');
                      setWeather('');
                      setWeatherCode(null);
                      setLatitude(null);
                      setLongitude(null);
                      setTemperature(null);
                      setLocation('');
                      setCustomTags([]);
                      setIndicatorSearchQuery('');
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSubmitMoodEntry}
                    disabled={isSubmitting || !hasSelectedAnyIndicator}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 transition-colors shadow-lg"
                  >
                    {isSubmitting ? 'Wird gespeichert...' : editingEntry ? 'Aktualisieren' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAccountSettingsOpen && (
        <AccountSettings onClose={() => setIsAccountSettingsOpen(false)} />
      )}
    </div>
  );
}

