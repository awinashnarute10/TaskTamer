function Header({ selectedModel, onChangeModel }) {
  return (
    <div className="sticky top-0 z-10 bg-neutral-900/80 backdrop-blur border-b border-neutral-700">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-sm font-semibold text-neutral-200">Task Tamer</div>
        <div className="relative">
          <details className="group">
            <summary className="cursor-pointer select-none text-xs text-neutral-300 bg-neutral-800/80 border border-neutral-700 rounded px-2 py-1">
              Model: {selectedModel}
            </summary>
            <div className="absolute right-0 top-full mt-2 bg-neutral-900 border border-neutral-700 rounded shadow-lg p-2 w-64 transition-all duration-200 ease-out overflow-hidden opacity-0 max-h-0 group-open:opacity-100 group-open:max-h-96">
              <ul className="space-y-1 text-xs text-neutral-200">
                {[
                  "llama-4-scout-17b-16e-instruct",
                  "llama3.1-8b",
                  "llama-3.3-70b",
                  "llama-4-maverick-17b-128e-instruct",
                  "qwen-3-32b",
                  "qwen-3-235b-a22b-instruct-2507",
                  "qwen-3-235b-a22b-thinking-2507",
                  "qwen-3-coder-480b",
                  "gpt-oss-120b",
                ].map((m) => (
                  <li key={m}>
                    <button
                      type="button"
                      className={`w-full text-left px-2 py-1 rounded hover:bg-neutral-800 ${
                        selectedModel === m ? "bg-neutral-800" : ""
                      }`}
                      onClick={() => onChangeModel?.(m)}
                    >
                      {m}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export default Header;
