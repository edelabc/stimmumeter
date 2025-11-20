import { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Loader } from 'lucide-react';
import { handlePaymentSuccess } from '../lib/stripe-service';
import { supabase } from '../lib/supabase';

export function PaymentSuccess() {
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');

      if (!sessionId) {
        setError('Ungültige Zahlungs-Session');
        setProcessing(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Benutzer nicht authentifiziert');
        setProcessing(false);
        return;
      }

      const result = await handlePaymentSuccess(sessionId, user.id);

      if (result.success) {
        setAmount(result.amount);
        setNewBalance(result.newBalance);
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Fehler bei der Zahlungsverarbeitung');
    } finally {
      setProcessing(false);
    }
  };

  const handleContinue = () => {
    window.location.href = '/';
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader size={32} className="text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Zahlung wird verarbeitet...
          </h1>
          <p className="text-gray-600">
            Bitte warten Sie einen Moment.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Fehler bei der Zahlung
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={handleContinue}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Zurück zur App
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Zahlung erfolgreich!
            </h1>

            <p className="text-gray-600 mb-8">
              Ihr Guthaben wurde erfolgreich aufgeladen.
            </p>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 mb-6">
              <div className="text-sm text-gray-600 mb-2">Aufgeladener Betrag</div>
              <div className="text-4xl font-bold text-green-600 mb-4">
                +{amount?.toFixed(2)} €
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Neues Guthaben:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {newBalance?.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-blue-900">
                <strong>Hinweis:</strong> Die Transaktion wurde in Ihrem Kontoauszug gespeichert und ist sofort verfügbar.
              </p>
            </div>

            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Zur App
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
