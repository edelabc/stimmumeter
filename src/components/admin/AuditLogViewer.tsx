import { useState, useEffect } from 'react';
import { FileText, AlertCircle, Info, AlertTriangle, XCircle, RefreshCw, Search, Filter } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  category: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details: Record<string, any>;
  error_message: string | null;
  ip_address: string | null;
  created_at: string;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [_total, setTotal] = useState(0);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response: any = await apiClient.get('/audit-logs.php?action=list&limit=500');

      if (response && response.data && Array.isArray(response.data)) {
        setLogs(response.data);
        setTotal(response.total || response.data.length);
      } else if (response && response.success === false) {
        console.error('Audit Logs API error:', response.error);
        setLogs([]);
      } else {
        setLogs([]);
      }
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
      setLogs([]);
    }
    setLoading(false);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return <Info className="text-blue-600" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={20} />;
      case 'error':
        return <AlertCircle className="text-orange-600" size={20} />;
      case 'critical':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <FileText className="text-gray-600" size={20} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stripe':
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'auth':
        return 'bg-purple-100 text-purple-800';
      case 'database':
        return 'bg-indigo-100 text-indigo-800';
      case 'api':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.error_message?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const categories = ['all', ...Array.from(new Set(logs.map(log => log.category)))];
  const severities = ['all', 'info', 'warning', 'error', 'critical'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600 mt-1">Vollständige System-Event-Historie für Debugging und Compliance</p>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Aktualisieren
        </button>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Suche nach Action, User, Error..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none appearance-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Alle Kategorien' : cat.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none appearance-none"
            >
              {severities.map(sev => (
                <option key={sev} value={sev}>
                  {sev === 'all' ? 'Alle Severity' : sev.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          {filteredLogs.length} von {logs.length} Logs
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Lade Logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 mt-4">
              {searchTerm || categoryFilter !== 'all' || severityFilter !== 'all'
                ? 'Keine Logs gefunden für die aktuellen Filter'
                : 'Noch keine Audit Logs vorhanden'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(log.severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        {log.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(log.category)}`}>
                        {log.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString('de-DE')}
                      </span>
                    </div>

                    <div className="font-mono text-sm text-gray-900 mb-1">
                      {log.action}
                    </div>

                    <div className="text-sm text-gray-600">
                      User: <span className="font-medium">{log.user_email}</span>
                      {log.ip_address && (
                        <span className="ml-3">IP: {log.ip_address}</span>
                      )}
                    </div>

                    {log.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <strong>Error:</strong> {log.error_message}
                      </div>
                    )}

                    {Object.keys(log.details || {}).length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {expandedLog === log.id ? 'Details ausblenden' : 'Details anzeigen'}
                        </button>

                        {expandedLog === log.id && (
                          <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex gap-3">
          <Info className="text-blue-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Über Audit Logs</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>Alle System-Events werden automatisch protokolliert</li>
              <li>Logs sind nur für Admins sichtbar</li>
              <li>Besonders hilfreich für Stripe Payment Debugging</li>
              <li>Logs werden in Echtzeit geschrieben (Console + Datenbank)</li>
              <li>Maximale Anzahl: 1000 neueste Logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
