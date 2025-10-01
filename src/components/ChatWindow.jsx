import MessageItem from "./MessageItem.jsx";
import { forwardRef } from "react";

const ChatWindow = forwardRef(function ChatWindow(
  { messages, isLoading, onToggleStep },
  ref
) {
  const showPlaceholder = !messages || messages.length === 0;
  return (
    <div className="overflow-y-auto h-full pt-4 pb-28 rounded-lg border border-neutral-700 px-4 bg-neutral-900/40">
      {showPlaceholder ? (
        <div className="h-full w-full flex items-center justify-center text-neutral-400 text-center px-6">
          <div>
            <div className="text-xl font-semibold mb-2">
              What big task do you want to tackle today?
            </div>
            <div className="text-sm opacity-80">
              Type your goal below to get started.
            </div>
          </div>
        </div>
      ) : (
        <ul className="text-left">
          {messages.map((m) => (
            <li key={m.id} className="mb-2">
              <MessageItem
                type={m.type}
                text={m.text}
                steps={m.steps}
                onToggleStep={(stepId) => onToggleStep?.(m.id, stepId)}
              />
            </li>
          ))}
          {isLoading ? (
            <li className="mb-2">
              <MessageItem type="ai" text="Thinking…" />
            </li>
          ) : null}
        </ul>
      )}
      <div ref={ref} />
    </div>
  );
});

export default ChatWindow;
