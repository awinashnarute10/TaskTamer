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
  const endRef = useRef(null);

  const currentChat = chats.find((c) => c.id === currentChatId);
  const messages = currentChat ? currentChat.messages : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage = { id: Date.now(), type: "user", text: input.trim() };
    const shouldShowSteps = /^yes\s*10\b/i.test(userMessage.text);
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, userMessage] }
          : chat
      )
    );
    setInput("");

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
        steps: shouldShowSteps ? ai.steps : undefined,
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
