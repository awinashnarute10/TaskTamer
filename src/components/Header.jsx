import React, { useState } from "react";

export default function Header({ selectedModel, onChangeModel }) {
  const [open, setOpen] = useState(false);

  const models = [
    "llama-4-scout-17b-16e-instruct",
    "llama3.1-8b",
    "llama-3.3-70b",
    "llama-4-maverick-17b-128e-instruct",
    "qwen-3-32b",
    "qwen-3-235b-a22b-instruct-2507",
    "qwen-3-235b-a22b-thinking-2507",
    "qwen-3-coder-480b",
    "gpt-oss-120b",
  ];

  return (
    <div className="sticky top-0 z-10 bg-neutral-900/80 backdrop-blur border-b border-neutral-700">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-sm font-semibold text-neutral-200">Task Tamer</div>
        <div className="relative">
        
          <button
            type="button"
            className="flex items-center gap-1 cursor-pointer select-none text-xs text-neutral-300 bg-neutral-800/80 border border-neutral-700 rounded px-2 py-1"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span
              className={`ml-1 inline-block transition-transform duration-200 ${
                open ? "rotate-360" : "rotate-270"
              }`}
            >
              ▼
            </span>
            <span>Model: {selectedModel}</span>
            
          </button>

          
          <div
            className={`absolute right-0 top-full mt-2 bg-neutral-900 border border-neutral-700 rounded shadow-lg p-2 w-64 transition-all duration-200 ease-out overflow-hidden ${
              open ? "opacity-100 max-h-96" : "opacity-0 max-h-0"
            }`}
          >
            <ul className="space-y-1 text-xs text-neutral-200">
              {models.map((m) => (
                <li key={m}>
                  <button
                    type="button"
                    className={`w-full text-left px-2 py-1 rounded hover:bg-neutral-800 ${
                      selectedModel === m ? "bg-neutral-800" : ""
                    }`}
                    onClick={() => {
                      onChangeModel?.(m);
                      setOpen(false); 
                    }}
                  >
                    {m}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}