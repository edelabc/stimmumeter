import { Pseudonym } from '../lib/supabase';
import { Trash2, Edit2 } from 'lucide-react';

interface PseudonymListProps {
  pseudonyms: Pseudonym[];
  selectedPseudonym: Pseudonym | null;
  onSelect: (pseudonym: Pseudonym) => void;
  onDelete: (id: string) => void;
  onEdit: (pseudonym: Pseudonym) => void;
}

export function PseudonymList({
  pseudonyms,
  selectedPseudonym,
  onSelect,
  onDelete,
  onEdit,
}: PseudonymListProps) {
  return (
    <div className="space-y-2">
      {pseudonyms.map((pseudonym) => (
        <div
          key={pseudonym.id}
          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
            selectedPseudonym?.id === pseudonym.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => onSelect(pseudonym)}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: pseudonym.color }}
            />
            <span className="font-medium text-gray-900 text-sm">{pseudonym.name}</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(pseudonym);
              }}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(pseudonym.id);
              }}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
