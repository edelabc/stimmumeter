import { useState, useEffect } from 'react';
import {
  FileText,
  TrendingUp,
  AlertCircle,
  Download,
  Calendar,
  DollarSign,
} from 'lucide-react';
import {
  getUserSubscription,
  getUserInvoices,
  getUserUsageRecords,
} from '../lib/billing';
import { getCurrentUser } from '../lib/auth-mysql';

export function UserBillingPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'usage'>('overview');
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [usageRecords, setUsageRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserBillingData();
  }, []);

  const loadUserBillingData = async () => {
    setLoading(true);
    const user = await getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const [subRes, invoicesRes, usageRes] = await Promise.all([
      getUserSubscription(user.id),
      getUserInvoices(user.id),
      getUserUsageRecords(
        user.id,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      ),
    ]);

    if (subRes.data) setSubscription(subRes.data);
    if (invoicesRes.data) setInvoices(invoicesRes.data);
    if (usageRes.data) setUsageRecords(usageRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading billing information...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'invoices'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Rechnungen
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'usage'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Nutzung
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <SubscriptionOverview subscription={subscription} />
      )}
      {activeTab === 'invoices' && <InvoicesList invoices={invoices} />}
      {activeTab === 'usage' && <UsageOverview usageRecords={usageRecords} />}
    </div>
  );
}

function SubscriptionOverview({ subscription }: { subscription: any }) {
  if (!subscription) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Kein aktives Abonnement
        </h3>
        <p className="text-gray-600 mb-6">
          Du hast derzeit kein aktives Abonnement. Wähle einen Tarif aus, um loszulegen.
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Tarife anzeigen
        </button>
      </div>
    );
  }

  const plan = subscription.plan;
  const statusColors = {
    trial: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
    suspended: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
        <div
          className="h-2"
          style={{ backgroundColor: plan?.color || '#3B82F6' }}
        />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {plan?.name || 'Unknown Plan'}
                </h3>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[subscription.status as keyof typeof statusColors]
                    }`}
                >
                  {subscription.status.toUpperCase()}
                </span>
              </div>
              {plan?.description && (
                <p className="text-gray-600">{plan.description}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {subscription.trial_start_date && subscription.trial_end_date && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <Calendar size={16} />
                  <span className="text-sm font-medium">Trial Period</span>
                </div>
                <div className="text-sm text-blue-600">
                  Ends {new Date(subscription.trial_end_date).toLocaleDateString()}
                </div>
              </div>
            )}

            {subscription.subscription_start_date && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-700 mb-1">
                  <Calendar size={16} />
                  <span className="text-sm font-medium">Started</span>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(subscription.subscription_start_date).toLocaleDateString()}
                </div>
              </div>
            )}

            {subscription.subscription_end_date && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-700 mb-1">
                  <Calendar size={16} />
                  <span className="text-sm font-medium">
                    {subscription.auto_renew ? 'Renews' : 'Expires'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(subscription.subscription_end_date).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Tarif wechseln
            </button>
            {subscription.status === 'active' && (
              <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Abo kündigen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Schnellzugriff</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={20} />
            </div>
            <div>
              <div className="font-medium text-gray-900">Rechnungen ansehen</div>
              <div className="text-sm text-gray-600">Download past invoices</div>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <div className="font-medium text-gray-900">View Usage</div>
              <div className="text-sm text-gray-600">Track your usage stats</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoicesList({ invoices }: { invoices: any[] }) {
  if (invoices.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Invoices Yet
        </h3>
        <p className="text-gray-600">
          Your invoices will appear here once they are generated.
        </p>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    issued: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    refunded: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
              Invoice
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
              Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
              Amount
            </th>
            <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
              Status
            </th>
            <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {invoices.map(invoice => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-mono text-sm font-medium">
                {invoice.invoice_number}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(invoice.issue_date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 font-medium">
                {invoice.currency_code} {parseFloat(invoice.total_amount).toFixed(2)}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[invoice.status as keyof typeof statusColors]
                    }`}
                >
                  {invoice.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  onClick={() => alert('Download functionality coming soon')}
                >
                  <Download size={16} />
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsageOverview({ usageRecords }: { usageRecords: any[] }) {
  const groupedUsage = usageRecords.reduce((acc, record) => {
    const itemType = record.item_type?.name || 'Unknown';
    if (!acc[itemType]) {
      acc[itemType] = {
        name: itemType,
        icon: record.item_type?.icon || 'Circle',
        count: 0,
      };
    }
    acc[itemType].count += record.quantity;
    return acc;
  }, {} as Record<string, { name: string; icon: string; count: number }>);

  const usageSummary: Array<{ name: string; icon: string; count: number }> = Object.values(groupedUsage);

  if (usageSummary.length === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Usage Data
        </h3>
        <p className="text-gray-600">
          Your usage statistics will appear here once you start using the service.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Usage Summary (Last 30 Days)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {usageSummary.map((item: { name: string; icon: string; count: number }) => (
            <div
              key={item.name}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {item.name}
                </span>
                <DollarSign className="text-gray-400" size={16} />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {item.count.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="font-semibold text-gray-900">Detailed Usage History</h4>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                Quantity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {usageRecords.slice(0, 20).map(record => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {record.item_type?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(record.recorded_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  {record.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
