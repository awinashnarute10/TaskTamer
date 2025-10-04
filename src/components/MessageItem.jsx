function MessageItem({ type, text, steps, onToggleStep }) {
  const isUser = type === "user";
  const bubbleBase = "max-w-[80%] rounded-lg p-3";
  const bubbleColor = isUser
    ? "bg-blue-500 text-white ml-auto"
    : "bg-gray-100 text-gray-900 mr-auto";

  function renderBoldInline(line) {
    // Split by **...** segments (allow multiple words and spaces) and render <strong>
    const parts = String(line).split(/(\*\*[\s\S]+?\*\*)/g);
    return parts.map((part, idx) => {
      const m = part.match(/^\*\*([\s\S]+)\*\*$/);
      if (m) {
        return <strong key={`b-${idx}`}>{m[1].trim()}</strong>;
      }
      return <span key={`t-${idx}`}>{part}</span>;
    });
  }

  function renderFormattedText(t, enableHeadingToBullets = false) {
    const lines = String(t)
      .split(/\r?\n/)
      .filter((line) => line.trim() !== ""); // Remove empty lines
    const nodes = [];
    let listItems = [];

    const flushList = () => {
      if (listItems.length > 0) {
        nodes.push(
          <ul key={`ul-${nodes.length}`} className="list-disc pl-5 my-1">
            {listItems.map((content, idx) => (
              <li key={`li-${idx}`}>{content}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, i) => {
      const m = enableHeadingToBullets && line.match(/^\s*#{3}\s+(.*)$/);
      if (m) {
        listItems.push(renderBoldInline(m[1]));
      } else {
        flushList();
        nodes.push(<span key={`l-${i}`}>{renderBoldInline(line)}</span>);
        if (i < lines.length - 1) nodes.push(<br key={`br-${i}`} />);
      }
    });

    flushList();
    return nodes;
  }

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`${bubbleBase} ${bubbleColor}`}>
        <div className="text-xs opacity-70 mb-1">{isUser ? "You" : "AI"}</div>
        <div>{renderFormattedText(text, !isUser)}</div>
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
                  {renderBoldInline(s.text)}
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

  // Motivational messages arrays for different progress levels
  const motivationalMessages = [
    "Every journey begins with a single step! 🌟",
    "You're off to a great start—keep it up! 🚀",
    "One task down, more to go—you've got this! 💪",
    "Small victories lead to big wins! 🎯",
    "Progress is progress, no matter how small! ⚡",
  ];

  const encouragementMessages = [
    "You're building momentum—don't stop now! 🔥",
    "Halfway there! Keep pushing forward! 🌟",
    "You're in the groove—let's finish strong! 💪",
    "Great progress so far! Almost there! 🚀",
    "You're crushing it—one more push! ⚡",
  ];

  const nearCompleteMessages = [
    "Almost there! Just a few more steps! 🏁",
    "Final stretch—you can see the finish line! 🌟",
    "So close! Push through to the end! 💪",
    "One last effort and you're done! 🚀",
    "Final push—you've got this! 🎯",
  ];

  const congratulationsMessages = [
    "🎉 Congratulations! You've completed all tasks! 🎉",
    "🏆 Mission accomplished! Well done! 🏆",
    "🌟 Incredible work! All tasks finished! 🌟",
    "🎯 Perfect! You've achieved everything! 🎯",
    "🚀 Outstanding! You nailed every task! 🚀",
  ];

  // Select message based on progress
  const getMotivationalMessage = () => {
    if (percent === 100) {
      // Return congratulations message with celebration
      return congratulationsMessages[
        completed % congratulationsMessages.length
      ];
    } else if (percent >= 75) {
      // Near completion
      return nearCompleteMessages[completed % nearCompleteMessages.length];
    } else if (percent >= 50) {
      // More than halfway
      return encouragementMessages[completed % encouragementMessages.length];
    } else if (percent > 0) {
      // Started but less than halfway
      return motivationalMessages[completed % motivationalMessages.length];
    }
    return null;
  };

  const message = getMotivationalMessage();
  const showMotivation = percent > 0;
  const isComplete = percent === 100;

  return (
    <div className="mt-3">
      <div className="text-xs mb-1 opacity-70">
        {completed}/{total} completed ({percent}%)
      </div>
      <div className="h-2 w-full bg-black/10 rounded">
        <div
          className={`h-2 rounded transition-all duration-500 ${
            isComplete
              ? "bg-gradient-to-r from-green-400 to-green-600"
              : "bg-green-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showMotivation ? (
        <div
          className={`mt-1 text-xs ${
            isComplete
              ? "opacity-100 font-semibold text-green-600 animate-pulse"
              : "opacity-70"
          }`}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
