import { useState } from 'react';
import { RuleSet } from '@/types/RuleSet';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Folder, Trash2, ChevronRight, Layers, Zap, Clock } from 'lucide-react';
import { RuleRunType } from '@/types/Rule';

interface RuleSetListProps {
  ruleSets: RuleSet[];
  selectedRuleSet: RuleSet | null;
  onSelect: (rs: RuleSet) => void;
  onDelete: (name: string) => void;
}

export default function RuleSetList({ ruleSets, selectedRuleSet, onSelect, onDelete }: RuleSetListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRuleSets = ruleSets.filter(rs =>
    rs.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rs.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="md:col-span-3 bg-white dark:bg-slate-900 shadow-xl rounded-2xl flex flex-col h-[calc(100vh-140px)] border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header & Search */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Folder size={20} className="text-blue-500" />
            Rule Sets
          </h2>
          <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
            {ruleSets.length}
          </span>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
          <input
            type="text"
            placeholder="Search sets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <AnimatePresence mode='popLayout'>
          {filteredRuleSets.length > 0 ? (
            filteredRuleSets.map(rs => {
              const isSelected = selectedRuleSet?.name === rs.name;

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={rs.name}
                  onClick={() => onSelect(rs)}
                  className={`
                    group relative p-4 rounded-xl cursor-pointer border transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700'
                    }
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                          {rs.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {rs.description || <span className="italic opacity-50">No description</span>}
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <Layers size={10} />
                          {rs.rules?.length || 0} Rules
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 ml-2">
                       {isSelected && (
                         <motion.div
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           className="text-blue-500"
                         >
                           <ChevronRight size={18} />
                         </motion.div>
                       )}

                       <button
                        onClick={(e) => { e.stopPropagation(); onDelete(rs.name); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Rule Set"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-48 text-center px-4"
            >
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Search size={20} className="text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No rule sets found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try creating a new one or adjusting your search.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
