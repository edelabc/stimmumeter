import { useState, useEffect } from 'react';
import { X, User, MapPin } from 'lucide-react';
import { Pseudonym } from '../lib/supabase';

interface PseudonymFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string, personalData?: Partial<Pseudonym>) => void;
  editingPseudonym: Pseudonym | null;
  usedColors?: string[];
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#06b6d4', '#84cc16', '#f43f5e', '#a855f7',
  '#22c55e', '#eab308', '#6366f1', '#fb923c',
];

function getRandomColor(usedColors: string[]): string {
  const availableColors = PRESET_COLORS.filter(c => !usedColors.includes(c));
  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

type TabType = 'personal' | 'location';

export function PseudonymForm({
  isOpen,
  onClose,
  onSubmit,
  editingPseudonym,
  usedColors = [],
}: PseudonymFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  // Personal data
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('');
  const [language, setLanguage] = useState<string>('');

  // Location data
  const [country, setCountry] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [cityAddition, setCityAddition] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [houseNumberAddition, setHouseNumberAddition] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (editingPseudonym) {
        setName(editingPseudonym.name);
        setColor(editingPseudonym.color);
        setAge(editingPseudonym.age?.toString() || '');
        setGender(editingPseudonym.gender || '');
        setWeight(editingPseudonym.weight?.toString() || '');
        setHeight(editingPseudonym.height?.toString() || '');
        setOccupation(editingPseudonym.occupation || '');
        setLanguage(editingPseudonym.language || '');
        setCountry(editingPseudonym.country || '');
        setState(editingPseudonym.state || '');
        setCity(editingPseudonym.city || '');
        setCityAddition(editingPseudonym.city_addition || '');
        setStreet(editingPseudonym.street || '');
        setHouseNumber(editingPseudonym.house_number || '');
        setHouseNumberAddition(editingPseudonym.house_number_addition || '');
      } else {
        setName('');
        setColor(getRandomColor(usedColors));
        setAge('');
        setGender('');
        setWeight('');
        setHeight('');
        setOccupation('');
        setLanguage('');
        setCountry('');
        setState('');
        setCity('');
        setCityAddition('');
        setStreet('');
        setHouseNumber('');
        setHouseNumberAddition('');
      }
    }
  }, [editingPseudonym, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const personalData = {
        age: age ? parseInt(age) : null,
        gender: gender || null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        occupation: occupation || null,
        language: language || null,
        country: country || null,
        state: state || null,
        city: city || null,
        city_addition: cityAddition || null,
        street: street || null,
        house_number: houseNumber || null,
        house_number_addition: houseNumberAddition || null,
      };
      onSubmit(name.trim(), color, personalData);

      // Reset form
      setName('');
      setColor(getRandomColor(usedColors));
      setAge('');
      setGender('');
      setWeight('');
      setHeight('');
      setOccupation('');
      setLanguage('');
      setCountry('');
      setState('');
      setCity('');
      setCityAddition('');
      setStreet('');
      setHouseNumber('');
      setHouseNumberAddition('');
      setActiveTab('personal');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingPseudonym ? 'Pseudonym bearbeiten' : 'Neues Pseudonym'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Alex, Persona 1..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Farbe *
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === presetColor ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex gap-2 mb-4 border-b">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'personal'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <User size={18} />
                Persönliche Daten
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('location')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'location'
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapPin size={18} />
                Ortsangaben
              </button>
            </div>

            {activeTab === 'personal' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Optional, für KI-Analyse und Personalisierung
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                      Alter (Jahre)
                    </label>
                    <input
                      id="age"
                      type="number"
                      min="0"
                      max="150"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="z.B. 25"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                      Anrede/Geschlecht
                    </label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="männlich">Männlich</option>
                      <option value="weiblich">Weiblich</option>
                      <option value="divers">Divers</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                      Gewicht (kg)
                    </label>
                    <input
                      id="weight"
                      type="number"
                      min="0"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="z.B. 70.5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                      Körpergröße (cm)
                    </label>
                    <input
                      id="height"
                      type="number"
                      min="0"
                      step="0.1"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="z.B. 175"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
                      Beruf
                    </label>
                    <input
                      id="occupation"
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="z.B. Software-Entwickler"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                      Sprache
                    </label>
                    <input
                      id="language"
                      type="text"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="z.B. Deutsch"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'location' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Optional, für erweiterte Analysen und Kontextualisierung
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Land
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="z.B. Deutschland"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      Bundesland
                    </label>
                    <input
                      id="state"
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="z.B. Bayern"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      Ort
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="z.B. München"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="cityAddition" className="block text-sm font-medium text-gray-700 mb-2">
                      Ortzusatz
                    </label>
                    <input
                      id="cityAddition"
                      type="text"
                      value={cityAddition}
                      onChange={(e) => setCityAddition(e.target.value)}
                      placeholder="z.B. Stadtteil, Bezirk"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                      Strasse
                    </label>
                    <input
                      id="street"
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="z.B. Hauptstraße"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Hausnummer
                      </label>
                      <input
                        id="houseNumber"
                        type="text"
                        value={houseNumber}
                        onChange={(e) => setHouseNumber(e.target.value)}
                        placeholder="z.B. 42"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="houseNumberAddition" className="block text-sm font-medium text-gray-700 mb-2">
                        Zusatz
                      </label>
                      <input
                        id="houseNumberAddition"
                        type="text"
                        value={houseNumberAddition}
                        onChange={(e) => setHouseNumberAddition(e.target.value)}
                        placeholder="z.B. a, b"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 disabled:opacity-50"
            >
              {editingPseudonym ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
