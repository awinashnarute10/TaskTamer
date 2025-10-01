function MessageItem({ type, text, steps, onToggleStep }) {
  const isUser = type === "user";
  const bubbleBase = "max-w-[80%] rounded-lg p-3";
  const bubbleColor = isUser
    ? "bg-blue-500 text-white ml-auto"
    : "bg-gray-100 text-gray-900 mr-auto";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${bubbleBase} ${bubbleColor}`}>
        <div className="text-xs opacity-70 mb-1">{isUser ? "You" : "AI"}</div>
        <div className="whitespace-pre-wrap">{text}</div>
        {Array.isArray(steps) && steps.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {steps.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={!!s.done}
                  onChange={() => onToggleStep?.(s.id)}
                  className="mt-0.5"
                />
                <span className={s.done ? "line-through text-gray-500" : ""}>
                  {s.text}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {Array.isArray(steps) && steps.length > 0 ? (
          <ProgressFooter steps={steps} />
        ) : null}
      </div>
    </div>
  );
}

export default MessageItem;

function ProgressFooter({ steps }) {
  const total = steps.length;
  const completed = steps.filter((s) => s.done).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const showMotivation = percent > 0 && percent < 100;

  return (
    <div className="mt-3">
      <div className="text-xs mb-1 opacity-70">
        {completed}/{total} completed ({percent}%)
      </div>
      <div className="h-2 w-full bg-black/10 rounded">
        <div
          className="h-2 bg-green-500 rounded"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showMotivation ? (
        <div className="mt-1 text-xs opacity-70">
          Keep going—you're making great progress!
        </div>
      ) : null}
    </div>
  );
}
