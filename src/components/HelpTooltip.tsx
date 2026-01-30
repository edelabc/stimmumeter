import { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { getHelpText, type HelpText } from '../lib/billing';

interface HelpTooltipProps {
  code: string;
}

export function HelpTooltip({ code }: HelpTooltipProps) {
  const [helpText, setHelpText] = useState<HelpText | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    loadHelpText();
  }, [code]);

  const loadHelpText = async () => {
    const { data } = await getHelpText(code);
    if (data) setHelpText(data);
  };

  if (!helpText) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <HelpCircle size={16} />
      </button>

      {showTooltip && (
        <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg -top-2 left-6">
          <div className="font-semibold mb-1">{helpText.title}</div>
          <div className="text-gray-300">{helpText.content}</div>
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-3" />
        </div>
      )}
    </div>
  );
}
