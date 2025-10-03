function InputBox({ value, onChange, onSend, disabled }) {
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="fixed bottom-0 right-0 w-[75vw] p-4 bg-neutral-900/90 backdrop-blur border-t border-neutral-700">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your big task..."
          rows={1}
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder-neutral-500 outline-none focus:ring-2 focus:ring-indigo-500 resize-none hover:ring-2 hover:ring-indigo-500"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default InputBox;
