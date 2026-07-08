"use client"

import { ChangeEvent, useEffect, useRef, useState } from "react"

type ChatSummary = {
  id: string
  title: string | null
  created_at: string
}

type ChatMessage = {
  id: string
  chat_id: string
  role: "user" | "assistant"
  content: string
  image_url?: string | null
  created_at: string
  pending?: boolean
  showSaveButton?: boolean
  saveState?: "idle" | "saving" | "saved" | "error"
}

function getRelativeDate(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function parseConceptPayload(text: string) {
  const normalized = text.replace(/\r/g, "")
  const overview = normalized.split(/\n\n/)[0]?.trim() || normalized.trim()

  const strongAreas = Array.from(normalized.matchAll(/strong areas?:\s*([^\n]+)/gi)).map((match) => match[1].trim())
  const weakAreas = Array.from(normalized.matchAll(/weak areas?:\s*([^\n]+)/gi)).map((match) => match[1].trim())
  const nextSteps = Array.from(normalized.matchAll(/next steps?:\s*([^\n]+)/gi)).map((match) => match[1].trim())

  const deepDiveGist = normalized
    .split(/\n\n/)
    .slice(1)
    .map((section) => section.trim())
    .filter(Boolean)

  return {
    overviewGist: overview,
    deepDiveGist,
    strongAreas: strongAreas.length ? strongAreas : [],
    weakAreas: weakAreas.length ? weakAreas : [],
    nextSteps: nextSteps.length ? nextSteps : [],
    notes: normalized,
  }
}

function sanitizeContent(text: string) {
  if (!text) return text
  // Remove Markdown headings (leading #'s)
  let out = text.replace(/^#{1,6}\s+/gm, '')
  // Convert list markers to a clean bullet
  out = out.replace(/(^|\n)\s*[-*+]\s+/g, '$1• ')
  // Strip bold/italic markup (**bold**, *italic*, __bold__, _italic_)
  out = out.replace(/(\*\*|__)(.*?)\1/g, '$2')
  out = out.replace(/(\*|_)(.*?)\1/g, '$2')
  // Collapse multiple blank lines
  out = out.replace(/\n{3,}/g, '\n\n')
  return out.trim()
}

export default function Home() {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadChats = async () => {
    const response = await fetch("/api/chats")
    if (!response.ok) return
    const data = (await response.json()) as ChatSummary[]
    setChats(data)
  }

  const loadMessages = async (chatId: string) => {
    setIsLoadingMessages(true)
    const response = await fetch(`/api/chats/${chatId}/messages`)
    if (!response.ok) {
      setIsLoadingMessages(false)
      return
    }
    const data = (await response.json()) as ChatMessage[]
    setMessages(data.map((m) => ({ ...m, content: sanitizeContent(m.content) })))
    setIsLoadingMessages(false)
  }

  useEffect(() => {
    void loadChats()
  }, [])

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId)
    setIsSidebarOpen(false)
    await loadMessages(chatId)
  }

  const handleNewChat = () => {
    setActiveChatId(null)
    setMessages([])
    setSelectedImageFile(null)
    setSelectedImagePreview(null)
    setInput("")
    setIsSidebarOpen(false)
  }

  const handleRenameChat = async (chatId: string) => {
    const current = chats.find((chat) => chat.id === chatId)
    const nextTitle = window.prompt("Rename chat", current?.title || "")
    if (!nextTitle || !nextTitle.trim()) return

    await fetch(`/api/chats/${chatId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: nextTitle.trim() }),
    })
    await loadChats()
  }

  const handleDeleteChat = async (chatId: string) => {
    if (!window.confirm("Delete this chat?")) return
    await fetch(`/api/chats/${chatId}`, { method: "DELETE" })
    if (activeChatId === chatId) {
      setActiveChatId(null)
      setMessages([])
    }
    await loadChats()
  }

  const handleImagePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedImageFile(file)
    setSelectedImagePreview(URL.createObjectURL(file))
  }

  const removeSelectedImage = () => {
    setSelectedImageFile(null)
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview)
    }
    setSelectedImagePreview(null)
  }

  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput && !selectedImageFile) return

    setIsSending(true)

    let chatId = activeChatId
    if (!chatId) {
      const created = await fetch("/api/chats", { method: "POST" })
      const createdData = (await created.json()) as { id: string }
      chatId = createdData.id
      setActiveChatId(chatId)
      await loadChats()
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      chat_id: chatId,
      role: "user",
      content: trimmedInput || "Sent an image",
      image_url: null,
      created_at: new Date().toISOString(),
    }

    const assistantMessageId = `assistant-${Date.now()}`
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      chat_id: chatId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      pending: true,
      showSaveButton: false,
      saveState: "idle",
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInput("")

    let imageUrl: string | undefined
    if (selectedImageFile) {
      const formData = new FormData()
      formData.append("image", selectedImageFile)
      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })
      const uploadData = (await uploadResponse.json()) as { imageUrl?: string }
      imageUrl = uploadData.imageUrl
    }

    const detectionResponse = await fetch("/api/detect-concept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: trimmedInput }),
    })
    const detected = (await detectionResponse.json()) as { subject: string; concept: string }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: trimmedInput,
        subject: detected.subject,
        concept: detected.concept,
        chatId,
        imageUrl,
      }),
    })

    if (!response.body) {
      setIsSending(false)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let streamedText = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      streamedText += decoder.decode(value, { stream: true })
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId ? { ...message, content: sanitizeContent(streamedText) } : message,
        ),
      )
    }

    streamedText += decoder.decode()
    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantMessageId ? { ...message, content: sanitizeContent(streamedText), pending: false, showSaveButton: Boolean(detected.subject && detected.concept) } : message,
      ),
    )

    if (selectedImageFile) {
      removeSelectedImage()
    }
    await loadChats()
    setIsSending(false)
  }

  const handleSaveProgress = async (assistantMessage: ChatMessage) => {
    const payload = parseConceptPayload(assistantMessage.content)
    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantMessage.id ? { ...message, saveState: "saving" } : message,
      ),
    )

    const response = await fetch("/api/save-concept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "",
        concept: "",
        masteryLevel: "Developing",
        overviewGist: payload.overviewGist,
        deepDiveGist: payload.deepDiveGist,
        strongAreas: payload.strongAreas,
        weakAreas: payload.weakAreas,
        nextSteps: payload.nextSteps,
        notes: payload.notes,
      }),
    })

    if (!response.ok) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id ? { ...message, saveState: "error" } : message,
        ),
      )
      return
    }

    setMessages((prev) =>
      prev.map((message) =>
        message.id === assistantMessage.id ? { ...message, saveState: "saved" } : message,
      ),
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_30%),linear-gradient(180deg,#02040d_0%,#050813_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className={`${isSidebarOpen ? "flex" : "hidden"} w-full flex-col rounded-[2rem] border border-white/10 bg-[#081124]/90 shadow-[0_45px_120px_-50px_rgba(0,0,0,0.8)] backdrop-blur-xl lg:flex lg:w-80 lg:border-b-0 lg:border-r`}>
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-cyan-200">Study Agent</p>
              <p className="text-xs text-slate-400">3D learning workspace</p>
            </div>
            <button
              className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-200 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-500/25"
              onClick={handleNewChat}
            >
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chats.map((chat) => (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                onClick={() => void handleSelectChat(chat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    void handleSelectChat(chat.id)
                  }
                }}
                className={`group flex w-full items-center justify-between rounded-[1.75rem] border border-white/5 bg-[#0d172b]/90 px-4 py-4 text-left shadow-[0_24px_60px_-45px_rgba(0,0,0,0.85)] transition duration-200 ${activeChatId === chat.id ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100" : "hover:border-white/10 hover:bg-white/5"}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{chat.title || "Untitled chat"}</p>
                  <p className="mt-1 text-xs tracking-wide text-slate-400">{getRelativeDate(chat.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 opacity-0 transition duration-200 group-hover:opacity-100">
                  <button
                    className="rounded-full border border-white/10 p-2 text-xs text-slate-300 hover:border-cyan-300 hover:text-cyan-200"
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleRenameChat(chat.id)
                    }}
                    aria-label="Rename chat"
                  >
                    ✏️
                  </button>
                  <button
                    className="rounded-full border border-white/10 p-2 text-xs text-slate-300 hover:border-rose-300 hover:text-rose-200"
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleDeleteChat(chat.id)
                    }}
                    aria-label="Delete chat"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex flex-1 flex-col">
          <div className="flex items-center justify-between gap-3 rounded-[2rem] border border-white/10 bg-[#081124]/85 px-5 py-4 shadow-[0_25px_70px_-45px_rgba(0,0,0,0.8)] backdrop-blur-xl lg:hidden">
            <button className="rounded-full border border-white/10 bg-slate-900/40 p-2 text-slate-200 transition duration-200 hover:bg-slate-800/70" onClick={() => setIsSidebarOpen((value) => !value)}>
              ☰
            </button>
            <p className="text-sm font-semibold tracking-wide text-slate-100">Study Agent</p>
            <button className="rounded-full border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-200 transition duration-200 hover:bg-cyan-500/25" onClick={handleNewChat}>
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-0 py-4 sm:px-2 lg:px-6">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-[56vh] items-center justify-center rounded-[2rem] border border-white/10 bg-[#0b1224]/80 p-10 text-center shadow-[0_30px_90px_-55px_rgba(0,0,0,0.8)]">
                <div>
                  <p className="text-2xl font-semibold text-slate-100">Start a new study conversation</p>
                  <p className="mt-3 text-sm text-slate-400">Ask anything, attach an image, and I’ll help you learn it step by step.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-[2rem] border ${message.role === "user" ? "border-cyan-400/20 bg-cyan-600/90 text-slate-100 shadow-[0_28px_80px_-45px_rgba(56,189,248,0.45)]" : "border-white/10 bg-[#0d162b]/95 text-slate-200 shadow-[0_28px_80px_-45px_rgba(15,23,42,0.65)]"} px-5 py-4 backdrop-blur-sm`}> 
                      {message.image_url ? (
                        <img src={message.image_url} alt="Attached message image" className="mb-3 h-auto max-h-60 w-full rounded-[1.5rem] object-cover shadow-[0_18px_60px_-40px_rgba(0,0,0,0.55)]" />
                      ) : null}
                      <p className="whitespace-pre-wrap text-sm leading-7">{message.content || (message.pending ? "Thinking…" : "")}</p>
                      {message.role === "assistant" && message.showSaveButton ? (
                        <div className="mt-4 flex justify-end">
                          <button
                            className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200 transition duration-200 hover:bg-cyan-500/20"
                            onClick={() => void handleSaveProgress(message)}
                            disabled={message.saveState === "saving"}
                          >
                            {message.saveState === "saving"
                              ? "Saving..."
                              : message.saveState === "saved"
                                ? "Saved"
                                : "Save progress"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isLoadingMessages ? <p className="mt-4 text-center text-sm text-slate-400">Loading messages…</p> : null}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#081124]/90 p-4 shadow-[0_30px_90px_-55px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-6">
            {selectedImagePreview ? (
              <div className="mb-4 flex items-center gap-3 rounded-[1.75rem] border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 shadow-[0_20px_60px_-45px_rgba(56,189,248,0.35)]">
                <img src={selectedImagePreview} alt="Selected preview" className="h-16 w-16 rounded-[1.5rem] object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-cyan-100">Image ready to upload</p>
                  <p className="text-xs text-slate-400">It will be attached to your next message.</p>
                </div>
                <button className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition duration-200 hover:bg-white/10" onClick={removeSelectedImage}>✕</button>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImagePick}
              />
              <button
                className="inline-flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/80 text-xl text-cyan-200 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800/90"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
              >
                📎
              </button>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a study question…"
                className="min-h-[56px] flex-1 rounded-[1.75rem] border border-white/10 bg-[#061026]/90 px-4 py-3 text-sm text-slate-100 outline-none transition duration-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                rows={1}
              />
              <button
                className="inline-flex h-14 items-center justify-center rounded-[1.75rem] bg-cyan-500 px-6 text-sm font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleSend()}
                disabled={isSending}
              >
                {isSending ? "Sending" : "Send"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
