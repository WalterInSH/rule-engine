interface SimulatorProps {
  execParams: string;
  setExecParams: (val: string) => void;
  execResult: string | null;
  onExecute: () => void;
}

interface InternalModelEntry {
    name: string;
    model: Record<string, unknown>;
}

interface RuleExecutionResult {
    input: Record<string, unknown>;
    internalModels?: InternalModelEntry[]; // New name
    loadedModels?: InternalModelEntry[];   // Legacy support if needed during transition
    output: Record<string, unknown>;
}

export default function Simulator({ execParams, setExecParams, execResult, onExecute }: SimulatorProps) {
  let parsedResult: RuleExecutionResult | null = null;
  let meta = null;
  
  try {
      if (execResult) {
          const res = JSON.parse(execResult);
          parsedResult = res as RuleExecutionResult;
          
          // Try to extract metadata if it exists in output (legacy behavior) or root (future proof)
          const out = res.output || {};
          if (out._startTime || out._durationMs !== undefined) {
              meta = { start: out._startTime, duration: out._durationMs };
          } 
      }
  } catch {}

  const internalData = parsedResult?.internalModels || parsedResult?.loadedModels || [];

  return (
    <div className="border-t dark:border-slate-700 pt-4">
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">Simulator</h3>
        <div className="grid grid-cols-2 gap-4">
            {/* Left Column: Input */}
            <div className="flex flex-col h-[500px]">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Input JSON</label>
                <textarea value={execParams} onChange={e => setExecParams(e.target.value)}
                          className="flex-1 w-full border border-slate-300 dark:border-slate-700 rounded p-2 font-mono text-xs dark:bg-slate-950 dark:text-slate-100 resize-none" />
                <button onClick={onExecute} className="mt-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded w-full">
                    Load & Execute
                </button>
            </div>

            {/* Right Column: Results */}
            <div className="flex flex-col h-[500px] overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Execution Result</label>
                    {meta && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="mr-2">Start: {meta.start}</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">Duration: {meta.duration}ms</span>
                        </div>
                    )}
                </div>
                
                <div className="flex-1 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-950 overflow-auto p-2 space-y-4">
                    {!parsedResult ? (
                        <pre className="font-mono text-xs text-slate-500">{execResult || 'No result'}</pre>
                    ) : (
                        <>
                            {/* Output Section */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 border-b dark:border-slate-800 pb-1">Output Models</h4>
                                <pre className="font-mono text-xs text-green-700 dark:text-green-400 whitespace-pre-wrap">
                                    {JSON.stringify(parsedResult.output, null, 2)}
                                </pre>
                            </div>

                            {/* Internal Models Section */}
                            {internalData.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 border-b dark:border-slate-800 pb-1 mt-4">Internal Models (Loaded)</h4>
                                    <div className="space-y-2">
                                        {internalData.map((item, idx) => (
                                            <div key={idx} className="bg-slate-100 dark:bg-slate-900 rounded p-2">
                                                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{item.name}</div>
                                                <pre className="font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                                    {JSON.stringify(item.model, null, 2)}
                                                </pre>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {/* Debug/Raw Input Echo (Optional, maybe collapsed?) */}
                             <div className="opacity-50 hover:opacity-100 transition-opacity">
                                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase mb-1 border-b dark:border-slate-800 pb-1 mt-4">Full Response (Debug)</h4>
                                <pre className="font-mono text-[10px] text-slate-400 whitespace-pre-wrap">
                                    {JSON.stringify(parsedResult, null, 2)}
                                </pre>
                             </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}
