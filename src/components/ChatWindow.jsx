import MessageItem from "./MessageItem.jsx";
import Header from "./Header.jsx";
import { forwardRef } from "react";

const ChatWindow = forwardRef(function ChatWindow(
  { messages, isLoading, onToggleStep, selectedModel, onChangeModel },
  ref
) {
  const showPlaceholder = !messages || messages.length === 0;
  return (
    <div className="h-full rounded-lg border border-neutral-700 bg-neutral-900/40 relative flex flex-col">
      <Header selectedModel={selectedModel} onChangeModel={onChangeModel} />
      <div className="flex-1 overflow-y-auto pb-28">
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
          <ul className="text-left px-4 pt-4">
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
    </div>
  );
});

export default ChatWindow;
