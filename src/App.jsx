import { useEffect, useRef, useState } from "react";
import ChatWindow from "./components/ChatWindow.jsx";
import InputBox from "./components/InputBox.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { sendMessageToAI } from "./services/aiClient.js";
import { usePomodoro } from "./hooks/usePomodoro.js";

import "./App.css";

function App() {
  const initialChat = {
    id: 1,
    title: "Chat 1",
    messages: [],
  };
  const [chats, setChats] = useState([initialChat]);
  const [currentChatId, setCurrentChatId] = useState(initialChat.id);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAwaitingBreakdown, setIsAwaitingBreakdown] = useState(false);
  const [taskCapturedByChat, setTaskCapturedByChat] = useState({});
  const [taskTextByChat, setTaskTextByChat] = useState({});
  const [selectedModel, setSelectedModel] = useState("gpt-oss-120b");
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [showPomodoroWarning, setShowPomodoroWarning] = useState(false);
  const endRef = useRef(null);
  const pomodoro = usePomodoro();

  const currentChat = chats.find((c) => c.id === currentChatId);
  const messages = currentChat ? currentChat.messages : [];

  // Helper function to extract a meaningful task name from the user's description
  function extractTaskName(taskText) {
    if (!taskText || typeof taskText !== "string") return "Task";

    // Clean the text and take the first meaningful phrase
    let cleaned = taskText
      .trim()
      .replace(/^(i want to|i need to|help me|can you|could you)\s+/i, "") // Remove common prefixes
      .replace(/\s+/g, " ") // Normalize whitespace
      .slice(0, 30); // Limit length

    // If the cleaned text is too short or empty, return a generic name
    if (cleaned.length < 4) return "Task";

    // Capitalize first letter
    return cleaned.charAt(0).toLowerCase() === cleaned.charAt(0) &&
      cleaned.length > 1
      ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      : cleaned;
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Load chats from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tasktamer.chats");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChats(parsed);
          setCurrentChatId(parsed[0].id);
        }
      }
    } catch { /* empty */ } finally {
      setHasLoadedFromStorage(true);
    }
  }, []);

  // Persist chats to localStorage
  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    try {
      localStorage.setItem("tasktamer.chats", JSON.stringify(chats));
    } catch { /* empty */ }
  }, [chats, hasLoadedFromStorage]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), type: "user", text: input.trim() };
    const trimmed = userMessage.text;

    // Always append user's message first
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );
    setInput("");

    // First-message guidance: steer user to provide a task
    if (messages.length === 0) {
      const isGreeting = /^(hi|hello|hey|yo|hiya|greetings)\b/i.test(trimmed);
      const guidanceText = isGreeting
        ? "What task do you need to break down?"
        : "Please tell me the task you want simplified into actionable subtasks.";
      const aiReply = {
        id: Date.now() + 1,
        type: "ai",
        text: guidanceText,
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, aiReply] }
            : chat
        )
      );
      return;
    }

    // If task not yet captured for this chat, treat this message as the task description
    const taskCaptured = Boolean(taskCapturedByChat[currentChatId]);
    if (!taskCaptured) {
      const confirmPrompt = {
        id: Date.now() + 1,
        type: "ai",
        text: "Got it. Type 1 to break into subtasks with checkboxes, or add more details for a better checklist.",
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, confirmPrompt] }
            : chat
        )
      );
      setIsAwaitingBreakdown(true);
      setTaskCapturedByChat((prev) => ({ ...prev, [currentChatId]: true }));
      setTaskTextByChat((prev) => ({ ...prev, [currentChatId]: trimmed }));
      return;
    }

    // If awaiting breakdown decision, interpret only '1' as proceed; otherwise ask for more details
    if (isAwaitingBreakdown) {
      const affirmative = /^\s*1\s*$/i.test(trimmed);
      if (!affirmative) {
        const askMore = {
          id: Date.now() + 1,
          type: "ai",
          text: "Please add more details about the task, or type 1 when you're ready to break it into subtasks.",
        };
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: [...chat.messages, askMore] }
              : chat
          )
        );
        return;
      }

      // Proceed with breakdown
      setIsAwaitingBreakdown(false);

      // Update chat title to match the task
      const taskText = taskTextByChat[currentChatId] || "";
      const taskName = extractTaskName(taskText);
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId ? { ...chat, title: taskName } : chat
        )
      );

      const prompt = `Break down this task into a comprehensive, detailed checklist of actionable subtasks:

"${taskText}"

Requirements:
- Create 8-15 specific, actionable subtasks
- Each subtask should be clear and measurable
- Include preparation, execution, and completion steps
- Break complex steps into smaller, manageable parts
- Use action verbs (Create, Write, Research, Review, etc.)
- Consider dependencies and logical order
- Include quality checks and review steps
- Make each step something that can be completed in 15-30 minutes

Format as a numbered or bulleted list. Focus on being thorough and comprehensive.`;
      setIsLoading(true);
      try {
        const ai = await sendMessageToAI({
          prompt,
          history: messages,
          modelOverride: selectedModel,
        });
        const aiReply = {
          id: Date.now() + 1,
          type: "ai",
          text: ai.text ?? "",
          steps: ai.steps,
        };
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: [...chat.messages, aiReply] }
              : chat
          )
        );
      } catch (err) {
        const errorReply = {
          id: Date.now() + 1,
          type: "ai",
          text: `Failed to reach AI: ${err.message}`,
        };
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: [...chat.messages, errorReply] }
              : chat
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If we already created a breakdown in this chat, treat further input as refinement
    const hasExistingChecklist = messages.some(
      (m) => m.type === "ai" && Array.isArray(m.steps) && m.steps.length > 0
    );
    if (taskCaptured && hasExistingChecklist) {
      const initialTask = (taskTextByChat[currentChatId] || "").trim();
      const containsInitialTask = initialTask
        ? trimmed.toLowerCase().includes(initialTask.toLowerCase())
        : true;
      // Detect if user is asking about a different/new task
      const indicatesNewTask =
        /(new|another|different)\s+task\b|^switch(\s+the)?\s+task\b/i.test(
          trimmed
        );
      if (indicatesNewTask || !containsInitialTask) {
        const pleaseNewChat = {
          id: Date.now() + 1,
          type: "ai",
          text: "This looks like a different task. Please open a new chat for each distinct task.",
        };
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: [...chat.messages, pleaseNewChat] }
              : chat
          )
        );
        return;
      }

      // Otherwise, regenerate/refresh the checklist using the extra details
      setIsLoading(true);
      try {
        const ai = await sendMessageToAI({
          prompt: `Update and regenerate the task breakdown with these additional details:

"${trimmed}"

Requirements for the updated breakdown:
- Create a comprehensive list of 8-15 specific, actionable subtasks
- Incorporate the new details provided
- Each subtask should be clear, measurable, and completable in 15-30 minutes
- Include preparation, execution, and completion steps
- Use action verbs and be specific about what needs to be done
- Consider dependencies and logical sequence
- Include quality checks and review steps where appropriate

Return as a detailed numbered or bulleted list.`,
          history: messages.concat([{ type: "user", text: trimmed }]),
          modelOverride: selectedModel,
        });
        const aiReply = {
          id: Date.now() + 1,
          type: "ai",
          text: ai.text ?? "",
          steps: ai.steps,
        };
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: [...chat.messages, aiReply] }
              : chat
          )
        );
      } catch (err) {
        const errorReply = {
          id: Date.now() + 1,
          type: "ai",
          text: `Failed to reach AI: ${err.message}`,
        };
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: [...chat.messages, errorReply] }
              : chat
          )
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Normal flow: forward to AI
    setIsLoading(true);
    try {
      const ai = await sendMessageToAI({
        prompt: userMessage.text,
        history: messages,
        modelOverride: selectedModel,
      });
      const aiReply = {
        id: Date.now() + 1,
        type: "ai",
        text: ai.text ?? "",
        // Do not show steps unless user explicitly opted into breakdown
        steps: undefined,
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, aiReply] }
            : chat
        )
      );

      // Detect AI suggesting a breakdown and set flag
      const aiTextLower = String(ai.text || "").toLowerCase();
      const suggestsBreakdown = [
        "should i break this down",
        "should we break this down",
        "want me to break this down",
        "would you like me to break this down",
        "break this into smaller tasks",
        "break this into subtasks",
      ].some((p) => aiTextLower.includes(p));
      if (suggestsBreakdown) {
        setIsAwaitingBreakdown(true);
        // Add a concise AI prompt that strictly asks for 1 or 0
        const decisionPrompt = {
          id: Date.now() + 2,
          type: "ai",
          text: "Reply 1 to break into subtasks (with checkboxes). Reply 0 to continue without subtasks.",
        };
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === currentChatId
              ? { ...chat, messages: [...chat.messages, decisionPrompt] }
              : chat
          )
        );
      }
    } catch (err) {
      const errorReply = {
        id: Date.now() + 1,
        type: "ai",
        text: `Failed to reach AI: ${err.message}`,
      };
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, errorReply] }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function toggleStep(messageId, stepId) {
    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== currentChatId) return chat;
        return {
          ...chat,
          messages: chat.messages.map((m) => {
            if (m.id !== messageId || !Array.isArray(m.steps)) return m;
            return {
              ...m,
              steps: m.steps.map((s) =>
                s.id === stepId ? { ...s, done: !s.done } : s
              ),
            };
          }),
        };
      })
    );
  }

  function handleSelectChat(id) {
    // Prevent chat switching if Pomodoro is active
    if (pomodoro.isActive && currentChatId !== id) {
      setShowPomodoroWarning(true);
      // Auto-hide warning after 3 seconds
      setTimeout(() => setShowPomodoroWarning(false), 3000);
      return;
    }
    setCurrentChatId(id);
  }

  function handleNewChat() {
    // Prevent new chat creation if Pomodoro is active
    if (pomodoro.isActive) {
      setShowPomodoroWarning(true);
      setTimeout(() => setShowPomodoroWarning(false), 3000);
      return;
    }
    
    const newId = Date.now();
    const newChat = {
      id: newId,
      title: `Chat ${chats.length + 1}`,
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newId);
    setInput("");
    setIsLoading(false);
  }

  function handleDeleteChat(id) {
    // Prevent deletion if Pomodoro is active and this is the current chat
    if (pomodoro.isActive && id === currentChatId) {
      setShowPomodoroWarning(true);
      setTimeout(() => setShowPomodoroWarning(false), 3000);
      return;
    }
    
    setChats((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      
      // If deleting the chat where Pomodoro was running, stop the timer
      if (pomodoro.isActive && id === currentChatId) {
        pomodoro.stopTimer();
      }
      
      // adjust current chat if needed
      if (id === currentChatId) {
        const nextId = filtered[0]?.id ?? Date.now();
        if (!filtered[0]) {
          // ensure at least one chat exists
          const emptyChat = { id: nextId, title: "Chat 1", messages: [] };
          setCurrentChatId(nextId);
          return [emptyChat];
        }
        setCurrentChatId(nextId);
      }
      return filtered;
    });
  }

  return (
    <div className="min-h-screen w-full flex relative">
      {/* Pomodoro Warning Overlay */}
      {showPomodoroWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-orange-600 text-white px-4 py-2 rounded-lg shadow-lg border border-orange-500">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍅</span>
            <span className="font-medium">Pomodoro session is active!</span>
          </div>
          <div className="text-sm opacity-90 mt-1">
            Complete or stop your current session to switch chats.
          </div>
        </div>
      )}
      
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        pomodoroActive={pomodoro.isActive}
      />
      <div
        className="ml-auto flex flex-col gap-4 p-4  bg-neutral-900/40"
        style={{ width: "75vw", height: "100vh", flex: "0 0 auto" }}
      >
        <div className="flex-1">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onToggleStep={toggleStep}
            selectedModel={selectedModel}
            onChangeModel={setSelectedModel}
            currentChatId={currentChatId}
            chats={chats}
            pomodoro={pomodoro}
            ref={endRef}
          />
        </div>
        <InputBox
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

export default App;
