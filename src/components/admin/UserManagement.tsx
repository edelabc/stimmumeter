import { useState, useEffect } from 'react';
import { Shield, ShieldOff, Mail, Edit2, Trash2, Ban, Check } from 'lucide-react';
import { getApiBaseUrl } from '../../lib/api-client';

// API Base URL dynamisch bestimmen
const API_BASE_URL = (): string => getApiBaseUrl();

interface User {
  id: string;
  email?: string;
  created_at: string;
  is_admin?: boolean;
  is_blocked?: boolean;
  salutation?: string;
  preferred_language?: string;
  location_label?: string;
  street?: string;
  house_number?: string;
  house_number_addition?: string;
  postal_code?: string;
  city?: string;
  city_addition?: string;
  state?: string;
  country?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }

      const response = await fetch(`${API_BASE_URL()}/users.php?action=list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Laden der Benutzer' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Fehler beim Laden der Benutzer');
      }

      console.log('✅ [UserManagement] Benutzer geladen:', data.data?.length || 0);
      setUsers(data.data || []);
    } catch (err: any) {
      console.error('❌ [UserManagement] Fehler beim Laden der Benutzer:', err);
      setError(err.message || 'Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }

      const url = `${API_BASE_URL()}/admin-users.php${isCurrentlyAdmin ? `?user_id=${userId}` : ''}`;
      const method = isCurrentlyAdmin ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: method === 'POST' ? JSON.stringify({ user_id: userId }) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Ändern der Admin-Rechte' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      await loadUsers();
    } catch (err: any) {
      console.error('❌ [UserManagement] Fehler beim Ändern der Admin-Rechte:', err);
      setError(err.message || 'Fehler beim Ändern der Admin-Rechte');
    }
  };

  const handleToggleBlock = async (userId: string, isCurrentlyBlocked: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }

      const response = await fetch(`${API_BASE_URL()}/users.php?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          is_blocked: !isCurrentlyBlocked ? 1 : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Ändern des Sperrstatus' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      await loadUsers();
    } catch (err: any) {
      console.error('❌ [UserManagement] Fehler beim Ändern des Sperrstatus:', err);
      setError(err.message || 'Fehler beim Ändern des Sperrstatus');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }

      const response = await fetch(`${API_BASE_URL()}/users.php?id=${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingUser.id,
          salutation: editingUser.salutation,
          preferred_language: editingUser.preferred_language,
          location_label: editingUser.location_label,
          street: editingUser.street,
          house_number: editingUser.house_number,
          house_number_addition: editingUser.house_number_addition,
          postal_code: editingUser.postal_code,
          city: editingUser.city,
          city_addition: editingUser.city_addition,
          state: editingUser.state,
          country: editingUser.country,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Speichern' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      console.error('❌ [UserManagement] Fehler beim Speichern:', err);
      setError(err.message || 'Fehler beim Speichern');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Möchten Sie den Benutzer "${userEmail}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Nicht authentifiziert');
      }

      const response = await fetch(`${API_BASE_URL()}/users.php?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Fehler beim Löschen' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      await loadUsers();
    } catch (err: any) {
      console.error('❌ [UserManagement] Fehler beim Löschen:', err);
      setError(err.message || 'Fehler beim Löschen');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lade Benutzer...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Benutzerverwaltung</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Mail size={48} className="mx-auto mb-4 opacity-50" />
            <p>Keine Benutzer gefunden</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{user.email}</p>
                  {user.is_admin && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Erstellt: {new Date(user.created_at).toLocaleDateString('de-DE')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditUser(user)}
                  className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                  title="Bearbeiten"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => handleToggleBlock(user.id, !!(user.is_blocked && user.is_blocked !== 0))}
                  className={`p-2 rounded-lg transition-colors ${
                    user.is_blocked && user.is_blocked !== 0
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                  }`}
                  title={user.is_blocked && user.is_blocked !== 0 ? 'Entsperren' : 'Sperren'}
                >
                  {user.is_blocked && user.is_blocked !== 0 ? <Check size={20} /> : <Ban size={20} />}
                </button>
                <button
                  onClick={() => handleToggleAdmin(user.id, user.is_admin || false)}
                  className={`p-2 rounded-lg transition-colors ${
                    user.is_admin
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  }`}
                  title={user.is_admin ? 'Admin entfernen' : 'Zu Admin machen'}
                >
                  {user.is_admin ? <ShieldOff size={20} /> : <Shield size={20} />}
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id, user.email || '')}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  title="Löschen"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Benutzer bearbeiten</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail (nicht änderbar)
                </label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anrede
                  </label>
                  <select
                    value={editingUser.salutation || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, salutation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Herr">Herr</option>
                    <option value="Frau">Frau</option>
                    <option value="Divers">Divers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bevorzugte Sprache
                  </label>
                  <input
                    type="text"
                    value={editingUser.preferred_language || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, preferred_language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. Deutsch, English"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Adressinformationen</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Standort-Beschriftung
                    </label>
                    <input
                      type="text"
                      value={editingUser.location_label || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, location_label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="z.B. Zuhause, Büro, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Straße
                    </label>
                    <input
                      type="text"
                      value={editingUser.street || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, street: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Straßenname"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hausnummer
                    </label>
                    <input
                      type="text"
                      value={editingUser.house_number || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, house_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nr."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hausnummerzusatz
                    </label>
                    <input
                      type="text"
                      value={editingUser.house_number_addition || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, house_number_addition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="z.B. a, b, c"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PLZ
                    </label>
                    <input
                      type="text"
                      value={editingUser.postal_code || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Postleitzahl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ort
                    </label>
                    <input
                      type="text"
                      value={editingUser.city || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Stadt/Ort"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ortzusatz
                    </label>
                    <input
                      type="text"
                      value={editingUser.city_addition || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, city_addition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Stadtteil, Bezirk, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bundesland
                    </label>
                    <input
                      type="text"
                      value={editingUser.state || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Bundesland"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Land
                    </label>
                    <input
                      type="text"
                      value={editingUser.country || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Land"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
