import { XCircle, ArrowLeft } from 'lucide-react';

export function PaymentCancel() {
  const handleGoBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle size={48} className="text-orange-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Zahlung abgebrochen
          </h1>

          <p className="text-gray-600 mb-8">
            Sie haben die Zahlung abgebrochen. Es wurde kein Betrag abgebucht.
          </p>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Was möchten Sie tun?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Kehren Sie zur App zurück und versuchen Sie es erneut</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Wählen Sie einen anderen Aufladebetrag</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Kontaktieren Sie den Support bei Problemen</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Zurück zur App
          </button>

          <p className="text-sm text-gray-500 mt-4">
            Keine Sorge, es wurde nichts berechnet.
          </p>
        </div>
      </div>
    </div>
  );
}
