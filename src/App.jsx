import { useEffect, useRef, useState } from "react";
import ChatWindow from "./components/ChatWindow.jsx";
import InputBox from "./components/InputBox.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { sendMessageToAI } from "./services/aiClient.js";

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
  const endRef = useRef(null);

  const currentChat = chats.find((c) => c.id === currentChatId);
  const messages = currentChat ? currentChat.messages : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
      const prompt =
        "Break this task into smaller subtasks with progress tracking.";
      setIsLoading(true);
      try {
        const ai = await sendMessageToAI({ prompt, history: messages });
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
    setCurrentChatId(id);
  }

  function handleNewChat() {
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

  return (
    <div className="min-h-screen w-full flex">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
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
