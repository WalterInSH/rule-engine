interface SimulatorProps {
  execParams: string;
  setExecParams: (val: string) => void;
  execResult: string | null;
  onExecute: () => void;
}

export default function Simulator({ execParams, setExecParams, execResult, onExecute }: SimulatorProps) {
  let meta = null;
  try {
      if (execResult) {
          const res = JSON.parse(execResult);
          if (res._startTime || res._durationMs !== undefined) {
              meta = { start: res._startTime, duration: res._durationMs };
          }
      }
  } catch (e) {}

  return (
    <div className="border-t dark:border-slate-700 pt-4">
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">Simulator</h3>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Input JSON</label>
                <textarea value={execParams} onChange={e => setExecParams(e.target.value)}
                          className="w-full h-32 border border-slate-300 dark:border-slate-700 rounded p-2 font-mono text-xs dark:bg-slate-950 dark:text-slate-100" />
                <button onClick={onExecute} className="mt-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-1 px-4 rounded w-full">
                    Load & Execute
                </button>
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Result</label>
                    {meta && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="mr-2">Start: {meta.start}</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">Duration: {meta.duration}ms</span>
                        </div>
                    )}
                </div>
                <pre className="w-full h-32 border border-slate-300 dark:border-slate-700 rounded p-2 font-mono text-xs bg-slate-50 dark:bg-slate-950 dark:text-slate-100 overflow-auto">
                    {execResult || 'No result'}
                </pre>
            </div>
        </div>
    </div>
  );
}
