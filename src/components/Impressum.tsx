import { X } from 'lucide-react';

interface ImpressumProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Impressum({ isOpen, onClose }: ImpressumProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Impressum</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Angaben gemäß § 5 TMG</h3>
            <p className="text-gray-700">
              [Ihr Name oder Firmenname]<br />
              [Straße und Hausnummer]<br />
              [PLZ und Ort]
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Kontakt</h3>
            <p className="text-gray-700">
              E-Mail: [ihre-email@beispiel.de]<br />
              Telefon: [Ihre Telefonnummer]
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Haftungsausschluss</h3>
            <h4 className="font-semibold text-gray-800 mt-4 mb-2">Haftung für Inhalte</h4>
            <p className="text-gray-700 text-sm">
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
              Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
              nach den allgemeinen Gesetzen verantwortlich.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Datenschutz</h3>
            <p className="text-gray-700 text-sm">
              Die Nutzung unserer Webseite ist in der Regel ohne Angabe personenbezogener Daten möglich.
              Soweit auf unseren Seiten personenbezogene Daten erhoben werden, erfolgt dies stets auf
              freiwilliger Basis. Diese Daten werden ohne Ihre ausdrückliche Zustimmung nicht an Dritte
              weitergegeben.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Urheberrecht</h3>
            <p className="text-gray-700 text-sm">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
              dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
              der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
              Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
          </section>
        </div>

        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
