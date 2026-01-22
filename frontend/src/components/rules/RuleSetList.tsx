import { RuleSet } from '@/types/RuleSet';

interface RuleSetListProps {
  ruleSets: RuleSet[];
  selectedRuleSet: RuleSet | null;
  onSelect: (rs: RuleSet) => void;
  onDelete: (name: string) => void;
}

export default function RuleSetList({ ruleSets, selectedRuleSet, onSelect, onDelete }: RuleSetListProps) {
  return (
    <div className="md:col-span-3 bg-white dark:bg-slate-900 shadow rounded-lg p-4 h-[calc(100vh-200px)] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">All Sets</h2>
      <ul>
        {ruleSets.map(rs => (
          <li key={rs.name} 
              className={`p-3 border-b dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 flex justify-between items-center ${selectedRuleSet?.name === rs.name ? 'bg-blue-50 dark:bg-slate-800' : ''}`}
              onClick={() => onSelect(rs)}>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">{rs.name}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 truncate w-24">{rs.description}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(rs.name); }} className="text-red-500 hover:text-red-700">✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
