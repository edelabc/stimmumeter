import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { getAccountTransactions, type AccountTransaction } from '../lib/billing';
import { supabase } from '../lib/supabase';

export function AccountStatement() {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await getAccountTransactions(user.id);
    if (data && data.length > 0) {
      setTransactions(data);
      setCurrentBalance(data[0].balance_after);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <TrendingUp className="text-green-600" size={18} />;
      case 'charge':
        return <TrendingDown className="text-red-600" size={18} />;
      case 'refund':
        return <TrendingUp className="text-blue-600" size={18} />;
      case 'prepaid_purchase':
        return <FileText className="text-blue-600" size={18} />;
      default:
        return <FileText className="text-gray-600" size={18} />;
    }
  };

  const handleDownloadReceipt = (transaction: AccountTransaction) => {
    // TODO: Implement receipt download
    alert('Beleg-Download wird in Kürze implementiert.\n\nBelegnummer: ' + transaction.document_number);
  };

  const handleExport = () => {
    const csv = [
      ['LFDNR', 'BUDATUM', 'BELEGNR', 'BUCHUNGSTEXT', 'SOLL', 'HABEN', 'LFDSALDO'].join(';'),
      ...transactions.map((t, i) =>
        [
          transactions.length - i,
          formatDate(t.transaction_date),
          t.document_number || '',
          t.description,
          t.debit ? t.debit.toFixed(2) : '',
          t.credit ? t.credit.toFixed(2) : '',
          t.balance_after.toFixed(2),
        ].join(';')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kontoauszug_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center text-gray-600">Lädt Kontoauszug...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mein Kontoauszug</h2>
            <p className="text-sm text-gray-600 mt-1">
              Übersicht aller Transaktionen
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Aktueller Saldo</div>
              <div className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(currentBalance)}
              </div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Exportieren
            </button>
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Noch keine Transaktionen</p>
          <p className="text-sm text-gray-500">
            Ihre Zahlungen und Abbuchungen erscheinen hier
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LFDNR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BUDATUM
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BELEGNR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BUCHUNGSTEXT
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SOLL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HABEN
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LFDSALDO
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AKTIONEN
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction, index) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transactions.length - index}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {transaction.document_number || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction.transaction_type)}
                      <span>{transaction.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                    {transaction.debit ? formatCurrency(transaction.debit) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                    {transaction.credit ? formatCurrency(transaction.credit) : '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                    transaction.balance_after >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    {formatCurrency(transaction.balance_after)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {(transaction.transaction_type === 'payment' || transaction.transaction_type === 'prepaid_purchase') && transaction.stripe_payment_id ? (
                      <button
                        onClick={() => handleDownloadReceipt(transaction)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                        title="Beleg herunterladen"
                      >
                        <Receipt size={14} />
                        Beleg
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Gesamt: {transactions.length} Transaktionen
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" />
              <span>Einzahlungen</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-red-600" />
              <span>Abbuchungen</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
