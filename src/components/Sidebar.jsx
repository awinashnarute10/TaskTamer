function Sidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  pomodoroActive,
}) {
  return (
    <div className="fixed left-0 top-0 bottom-0 w-[25vw] bg-neutral-900 border-r border-neutral-800 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-neutral-200 text-lg font-semibold">Chats</h2>
        <button
          onClick={onNewChat}
          className={`rounded-md px-3 py-1 text-white text-sm transition-all ${
            pomodoroActive 
              ? "bg-neutral-600 cursor-not-allowed opacity-50" 
              : "bg-blue-600 hover:bg-blue-500"
          }`}
          type="button"
          disabled={pomodoroActive}
          title={pomodoroActive ? "Complete Pomodoro session to create new chat" : "Create new chat"}
        >
          {pomodoroActive ? "🍅 New" : "New"}
        </button>
      </div>
      <ul className="space-y-1">
        {chats.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <button
              onClick={() => onSelectChat(c.id)}
              className={`flex-1 text-left px-3 py-2 rounded-md transition-colors ${
                c.id === currentChatId
                  ? "bg-neutral-800 text-white"
                  : pomodoroActive 
                    ? "bg-neutral-900 text-neutral-500 cursor-not-allowed"
                    : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
              }`}
              disabled={pomodoroActive && c.id !== currentChatId}
              title={pomodoroActive && c.id !== currentChatId ? "Complete Pomodoro session to switch chats" : undefined}
            >
              {c.id === currentChatId && pomodoroActive ? "🍅 " : ""}{c.title || "Untitled chat"}
            </button>
            <button
              type="button"
              onClick={() => onDeleteChat?.(c.id)}
              title={pomodoroActive && c.id === currentChatId ? "Complete Pomodoro session to delete chat" : "Delete chat"}
              className={`shrink-0 px-2 py-2 rounded-md text-white transition-all ${
                pomodoroActive && c.id === currentChatId
                  ? "bg-neutral-600 cursor-not-allowed opacity-50"
                  : "bg-red-600/80 hover:bg-red-600"
              }`}
              disabled={pomodoroActive && c.id === currentChatId}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
