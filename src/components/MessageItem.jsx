import { useState, useEffect } from "react";
import PomodoroButton from "./PomodoroButton.jsx";
import PomodoroSettingsModal from "./PomodoroSettingsModal.jsx";

function MessageItem({ type, text, steps, onToggleStep, taskTitle, messageId, pomodoro }) {
  const isUser = type === "user";
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
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
        {!Array.isArray(steps) || steps.length === 0 ? (
          <div>{renderFormattedText(text, !isUser)}</div>
        ) : null}
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
          <ProgressFooter steps={steps} taskTitle={taskTitle} pomodoro={pomodoro} messageId={messageId} />
        ) : null}
        
        {/* Add Pomodoro button only to AI messages with steps/checkboxes */}
        {!isUser && pomodoro && Array.isArray(steps) && steps.length > 0 && (
          <PomodoroButton 
            messageId={messageId}
            pomodoro={pomodoro}
            onShowSettings={() => setShowPomodoroSettings(true)}
          />
        )}
      </div>
      
      {/* Pomodoro Settings Modal */}
      {showPomodoroSettings && (
        <PomodoroSettingsModal 
          isOpen={showPomodoroSettings}
          onClose={() => setShowPomodoroSettings(false)}
          pomodoro={pomodoro}
        />
      )}
    </div>
  );
}

export default MessageItem;

function ProgressFooter({ steps, taskTitle, pomodoro, messageId }) {
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [isGeneratingMotivation, setIsGeneratingMotivation] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [previousMotivations, setPreviousMotivations] = useState([]);
  const [lastGeneratingMilestone, setLastGeneratingMilestone] = useState(0);

  const total = steps.length;
  const completed = steps.filter((s) => s.done).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const showMotivation = percent > 0;
  const isComplete = percent === 100;

  // Stop Pomodoro when progress reaches 100%
  useEffect(() => {
    if (isComplete && pomodoro && pomodoro.isTimerForMessage(messageId)) {
      pomodoro.stopTimer();
    }
  }, [isComplete, pomodoro, messageId]);

  // Generate AI motivation at each new 5% milestone only
  useEffect(() => {
    if (!showMotivation || !taskTitle) return;

    // Determine current 5% milestone crossed (e.g., 5, 10, 15, ...)
    const currentMilestone = Math.floor(percent / 5) * 5;

    // Only trigger when we reach a NEW milestone and milestones start at 5%
    if (currentMilestone >= 5 && currentMilestone > lastGeneratingMilestone) {
      // Optimistically record the milestone to avoid duplicate triggers on re-renders
      setLastGeneratingMilestone(currentMilestone);

      const generateMotivation = async () => {
        setIsGeneratingMotivation(true);
        try {
          const { generateMotivation: getAI } = await import(
            "../services/aiClient.js"
          );
          const message = await getAI({
            taskDescription: taskTitle,
            completedTasks: completed,
            totalTasks: total,
            progressPercent: percent,
          });
          setMotivationalMessage(message);
        } catch (error) {
          console.warn("Failed to generate motivation:", error);
          // Fallback messages
          const fallbacks = {
          100: "🏆 Flawless finish. Champion.",
          75: "🏁 Almost there! Push through!",
          50: "🔥 Great momentum! Keep it up!",
          25: "🌟 Great start! Keep going!",
          5: "✨ You’re rolling!",
          };
          // Pick the closest lower-or-equal fallback milestone
          const available = Object.keys(fallbacks)
            .map((k) => parseInt(k))
            .filter((k) => percent >= k)
            .sort((a, b) => b - a);
          const chosen = available[0];
          setMotivationalMessage(
            (chosen && fallbacks[chosen]) || "💪 Keep pushing forward! 💪"
          );
        } finally {
          setIsGeneratingMotivation(false);
        }
      };

      generateMotivation();
    }
  }, [completed, total, percent, taskTitle, showMotivation, lastGeneratingMilestone]);

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
          {isGeneratingMotivation
            ? "✨ Generating motivation..."
            : motivationalMessage}
        </div>
      ) : null}
    </div>
  );
}
