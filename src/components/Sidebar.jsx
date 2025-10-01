function Sidebar({ chats, currentChatId, onSelectChat, onNewChat }) {
  return (
    <div className="fixed left-0 top-0 bottom-0 w-[25vw] bg-neutral-900 border-r border-neutral-800 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-neutral-200 text-lg font-semibold">Chats</h2>
        <button
          onClick={onNewChat}
          className="rounded-md bg-blue-600 hover:bg-blue-500 px-3 py-1 text-white text-sm"
          type="button"
        >
          New
        </button>
      </div>
      <ul className="space-y-1">
        {chats.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onSelectChat(c.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                c.id === currentChatId
                  ? "bg-neutral-800 text-white"
                  : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
              }`}
            >
              {c.title || "Untitled chat"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
