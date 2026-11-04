"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  Dumbbell,
  Utensils,
  BookOpen,
  LineChart,
  ShieldAlert,
  MessageSquare,
  Clock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Flame,
  Droplet,
  Info,
} from "lucide-react";

interface CoachMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  suggestedActions?: Array<{
    action: string;
    label: string;
    href?: string;
    payload?: Record<string, unknown>;
  }>;
  createdAt: string;
}

interface CoachConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface CoachInsight {
  id: string;
  category: "nutrition" | "workout" | "progress" | "habits";
  type: "positive" | "warning" | "info";
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  actionHref?: string;
  actionLabelEn?: string;
  actionLabelUr?: string;
}

const DEFAULT_SUGGESTIONS = [
  {
    en: "Am I meeting my daily protein target?",
    ur: "کیا میں اپنا روزانہ پروٹین کا ہدف پورا کر رہا ہوں؟",
    category: "nutrition",
    icon: Utensils,
  },
  {
    en: "How is my weight progress trending?",
    ur: "میرے وزن میں تبدیلی کی رفتار کیسی ہے؟",
    category: "progress",
    icon: TrendingUp,
  },
  {
    en: "Review my recent workout performance",
    ur: "میری حالیہ ورزشوں کی کارکردگی کا جائزہ لیں",
    category: "workout",
    icon: Dumbbell,
  },
  {
    en: "Suggest an affordable high-protein Pakistani meal",
    ur: "آج کے لیے مناسب خرچ میں پروٹین سے بھرپور کھانا تجویز کریں",
    category: "nutrition",
    icon: Flame,
  },
  {
    en: "Why is my weight plateauing?",
    ur: "میرا وزن کیوں رک گیا ہے اور آگے نہیں بڑھ رہا؟",
    category: "progress",
    icon: LineChart,
  },
  {
    en: "Should I adjust my current fitness goal?",
    ur: "کیا مجھے اپنے فٹنس ہدف میں تبدیلی کرنی چاہیے؟",
    category: "goals",
    icon: BookOpen,
  },
];

function CoachMarkdown({ content }: { content: string }) {
  // Simple, safe Markdown parser for Coach responses
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Bullet point
        if (trimmed.startsWith("•") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletText = trimmed.replace(/^(•|-|\*)\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 ps-1">
              <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
              <span className="flex-1">{renderFormattedText(bulletText)}</span>
            </div>
          );
        }

        // Numbered list
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ps-1">
              <span className="text-emerald-500 font-bold text-xs shrink-0 mt-0.5">{numMatch[1]}.</span>
              <span className="flex-1">{renderFormattedText(numMatch[2])}</span>
            </div>
          );
        }

        // Heading
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-bold text-base text-foreground mt-2">
              {renderFormattedText(trimmed.replace(/^###\s+/, ""))}
            </h4>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={idx} className="font-black text-lg text-foreground mt-3">
              {renderFormattedText(trimmed.replace(/^##\s+/, ""))}
            </h3>
          );
        }

        return <p key={idx}>{renderFormattedText(trimmed)}</p>;
      })}
    </div>
  );
}

function renderFormattedText(text: string) {
  // Parse **bold** and `code`
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code key={match.index} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-emerald-600 dark:text-emerald-400">
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

function CoachContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { language, isRtl } = useI18n();

  // Conversations state
  const [conversations, setConversations] = useState<CoachConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [insights, setInsights] = useState<CoachInsight[]>([]);

  // UI state
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/coach");
    }
  }, [status, router]);

  // Load conversations and insights on mount
  useEffect(() => {
    if (status === "authenticated") {
      loadConversations();
      loadInsights();
    }
  }, [status]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function loadConversations() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/coach/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (data.conversations?.length > 0 && !activeConversationId) {
          selectConversation(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadInsights() {
    try {
      const res = await fetch("/api/v1/coach/insights");
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch (err) {
      console.error("Failed to load insights:", err);
    }
  }

  async function selectConversation(id: string) {
    try {
      setActiveConversationId(id);
      setSidebarOpen(false);
      const res = await fetch(`/api/v1/coach/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversation details:", err);
    }
  }

  function handleStartNewChat() {
    setActiveConversationId(null);
    setMessages([]);
    setInputMessage("");
    setSidebarOpen(false);
  }

  async function handleSendMessage(textToSend?: string) {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    // Optimistically append user message
    const tempUserMsg: CoachMessage = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/v1/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId || undefined,
          message: text,
          language: language === "ur" ? "ur" : "en",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!activeConversationId && data.conversationId) {
          setActiveConversationId(data.conversationId);
          await loadConversations();
        }
        setMessages((prev) => [...prev, data.message]);
      } else {
        const errData = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: "err-" + Date.now(),
            role: "assistant",
            content: language === "ur"
              ? "معذرت، رابطہ میں مسئلہ پیش آیا ہے۔ براہ کرم دوبارہ کوشش کریں۔"
              : `Sorry, an error occurred: ${errData.error || "Please try again."}`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: language === "ur"
            ? "نیٹ ورک کی خرابی۔ براہ کرم دوبارہ کوشش کریں۔"
            : "Network error. Please check your connection and try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleRenameConversation(id: string) {
    if (!editTitleValue.trim()) return;
    try {
      const res = await fetch(`/api/v1/coach/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitleValue.trim() }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: editTitleValue.trim() } : c))
        );
        setEditingTitleId(null);
      }
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  }

  async function handleDeleteConversation(id: string) {
    try {
      const res = await fetch(`/api/v1/coach/conversations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          handleStartNewChat();
        }
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Loading Coach Hamza...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 gap-4">
        {/* Top Header & Clinical Disclaimer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                  {language === "ur" ? "فٹ لائف اے آئی کوچ حمزہ" : "FitLife AI Personal Coach"}
                </h1>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                  LLaMA-3.3-70B • Phase 9
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "ur"
                  ? "آپ کے جسمانی ڈیٹا، روزانہ کے کھانے، ورزش اور پیش رفت کے تجزیے پر مبنی رہنمائی"
                  : "Evidence-based coaching reasoning across your goals, nutrition logs, workouts & transformation trends."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-xs font-semibold rounded-xl"
            >
              <MessageSquare className="h-3.5 w-3.5 me-1.5" />
              {language === "ur" ? "گفتگو" : "Chats"} ({conversations.length})
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleStartNewChat}
              className="text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-3.5 w-3.5 me-1.5" />
              {language === "ur" ? "نئی گفتگو" : "New Chat"}
            </Button>
          </div>
        </div>

        {/* Clinical Guardrails Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 leading-relaxed">
            <strong className="font-bold">
              {language === "ur" ? "طبی و کلینیکل احتیاط: " : "Clinical Safety Notice: "}
            </strong>
            {language === "ur"
              ? "فٹ لائف کوچ صرف فٹنس اور غذائی رہنمائی فراہم کرتا ہے۔ یہ ادویات یا بیماریوں کی تشخیص نہیں کرتا۔ شدید درد، چوٹ یا علامات کی صورت میں فوری ڈاکٹر سے رجوع کریں۔"
              : "FitLife Coach provides sports science and nutrition guidance, not medical diagnoses or drug prescriptions. Always consult a qualified medical professional for acute symptoms or injuries."}
          </div>
        </div>

        {/* Proactive Insights Collapsible Bar */}
        {insights.length > 0 && (
          <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-sm">
            <button
              type="button"
              onClick={() => setShowInsights(!showInsights)}
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-1 hover:text-emerald-500 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span>{language === "ur" ? "کوچ کے خودکار مشاہدات" : "Proactive Athlete Insights"}</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px]">
                  {insights.length}
                </span>
              </div>
              {showInsights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showInsights && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 pt-3 border-t border-border/50">
                {insights.map((ins) => (
                  <div
                    key={ins.id}
                    className={`rounded-xl p-3 border text-xs flex flex-col justify-between gap-2 ${
                      ins.type === "warning"
                        ? "bg-amber-500/5 border-amber-500/30 text-amber-900 dark:text-amber-200"
                        : ins.type === "positive"
                        ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                        : "bg-muted/40 border-border text-foreground"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        {ins.type === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                        {ins.type === "positive" && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        {ins.type === "info" && <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                        <span>{language === "ur" ? ins.titleUr : ins.titleEn}</span>
                      </div>
                      <p className="text-[11px] opacity-80 leading-relaxed">
                        {language === "ur" ? ins.descriptionUr : ins.descriptionEn}
                      </p>
                    </div>

                    {ins.actionHref && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(ins.actionHref!)}
                        className="text-[11px] font-bold h-7 px-2 self-start hover:bg-background/80"
                      >
                        <span>{language === "ur" ? ins.actionLabelUr : ins.actionLabelEn}</span>
                        <ArrowRight className={`h-3 w-3 ms-1 ${isRtl ? "rotate-180" : ""}`} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content: Sidebar + Chat Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[500px]">
          {/* Desktop Sidebar / Mobile Sheet */}
          <div
            className={`lg:col-span-1 bg-card border border-border/70 rounded-2xl p-4 flex flex-col gap-3 ${
              sidebarOpen ? "fixed inset-x-4 top-20 z-50 shadow-2xl max-h-[80vh] overflow-y-auto" : "hidden lg:flex"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {language === "ur" ? "پچھلی گفتگو" : "Conversations"}
              </span>
              {sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="h-6 w-6 p-0 lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleStartNewChat}
              className="w-full text-xs font-bold rounded-xl border-dashed"
            >
              <Plus className="h-3.5 w-3.5 me-1.5" />
              {language === "ur" ? "نیا چیٹ شروع کریں" : "Start New Chat"}
            </Button>

            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[450px]">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-40" />
                  <p>{language === "ur" ? "کوئی گفتگو نہیں" : "No chats yet"}</p>
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConversationId === c.id;
                  const isEditing = editingTitleId === c.id;

                  return (
                    <div
                      key={c.id}
                      className={`group rounded-xl p-2 text-xs flex items-center justify-between gap-1.5 transition-colors cursor-pointer ${
                        isActive
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold"
                          : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => !isEditing && selectConversation(c.id)}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameConversation(c.id);
                              if (e.key === "Escape") setEditingTitleId(null);
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameConversation(c.id)}
                            className="p-1 hover:text-emerald-500"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTitleId(null)}
                            className="p-1 hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                            <span className="truncate">{c.title}</span>
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTitleId(c.id);
                                setEditTitleValue(c.title);
                              }}
                              className="p-1 hover:text-foreground text-muted-foreground"
                              title="Rename"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(c.id);
                              }}
                              className="p-1 hover:text-destructive text-muted-foreground"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Chat Stream */}
          <div className="lg:col-span-3 bg-card border border-border/70 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            {/* Chat Messages Viewport */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[550px] min-h-[400px]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 max-w-lg mx-auto">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-4 animate-pulse">
                    <Bot className="h-8 w-8" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-foreground mb-1">
                    {language === "ur" ? "میں آپ کی کس طرح مدد کر سکتا ہوں؟" : "What can I optimize for you today?"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                    {language === "ur"
                      ? "کوچ حمزہ آپ کے ذاتی وزن، ورزش اور کھانے کے ڈیٹا کی بنیاد پر مشورے دیتا ہے۔ ذیل میں دیے گئے سوالات میں سے کوئی بھی منتخب کریں:"
                      : "Coach Hamza synthesizes your real physical assessment, 7-day food logs, workout volume, and body measurements. Choose a topic to begin:"}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                    {DEFAULT_SUGGESTIONS.map((sug, idx) => {
                      const Icon = sug.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(language === "ur" ? sug.ur : sug.en)}
                          className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-background hover:bg-muted/60 text-start text-xs font-semibold text-foreground transition-all hover:scale-[1.01] hover:border-emerald-500/40 shadow-sm"
                        >
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="flex-1 leading-snug">
                            {language === "ur" ? sug.ur : sug.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.role === "user";

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 items-start ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs ${
                          isUser
                            ? "bg-emerald-600 text-white rounded-br-none"
                            : "bg-muted/50 border border-border/80 text-foreground rounded-bl-none"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                        ) : (
                          <div className="space-y-3">
                            <CoachMarkdown content={m.content} />

                            {/* Actionable Suggestions */}
                            {m.suggestedActions && m.suggestedActions.length > 0 && (
                              <div className="pt-2 border-t border-border/60 flex flex-wrap gap-2">
                                {m.suggestedActions.map((act, actIdx) => (
                                  <Button
                                    key={actIdx}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => act.href && router.push(act.href)}
                                    className="text-[11px] font-bold h-7 px-2.5 rounded-lg border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                                  >
                                    <span>{act.label}</span>
                                    <ExternalLink className="h-3 w-3 ms-1 opacity-70" />
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div
                          className={`text-[9px] mt-1.5 opacity-60 ${
                            isUser ? "text-white text-end" : "text-muted-foreground text-start"
                          }`}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      {isUser && (
                        <div className="h-8 w-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                          {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing / Thinking Indicator */}
              {sending && (
                <div className="flex gap-3 items-start justify-start">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted/50 border border-border/80 rounded-2xl rounded-bl-none p-3 text-xs flex items-center gap-2 text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] ms-1">
                      {language === "ur" ? "کوچ حمزہ غور کر رہا ہے..." : "Coach Hamza is reasoning..."}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions Chips (when chatting) */}
            {messages.length > 0 && (
              <div className="px-4 py-2 border-t border-border/50 bg-muted/20 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
                <span className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">
                  {language === "ur" ? "تجویز کردہ:" : "Suggestions:"}
                </span>
                {DEFAULT_SUGGESTIONS.slice(0, 3).map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(language === "ur" ? sug.ur : sug.en)}
                    className="shrink-0 bg-background border border-border/70 hover:border-emerald-500/50 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors"
                  >
                    {language === "ur" ? sug.ur : sug.en}
                  </button>
                ))}
              </div>
            )}

            {/* Composer Bar */}
            <div className="p-3 sm:p-4 border-t border-border/70 bg-card">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    language === "ur"
                      ? "کوچ حمزہ سے غذا، ورزش یا اہداف کے متعلق پوچھیں..."
                      : "Ask Coach Hamza about protein, workouts, plateau, or meal plans..."
                  }
                  disabled={sending}
                  className="flex-1 bg-background border border-border/80 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />

                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-bold text-xs"
                >
                  <Send className={`h-4 w-4 ${isRtl ? "rotate-180" : ""}`} />
                  <span className="hidden sm:inline ms-1.5">{language === "ur" ? "بھیجیں" : "Send"}</span>
                </Button>

                {activeConversationId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(activeConversationId)}
                    className="h-10 w-10 p-0 text-muted-foreground hover:text-destructive shrink-0 rounded-xl"
                    title={language === "ur" ? "گفتگو ختم کریں" : "Delete Conversation"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-card border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-destructive">
                <Trash2 className="h-5 w-5" />
                <h4 className="font-bold text-sm text-foreground">
                  {language === "ur" ? "گفتگو ڈیلیٹ کریں؟" : "Delete Conversation?"}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {language === "ur"
                  ? "کیا آپ واقعی اس گفتگو اور اس کے تمام پیغامات کو مستقل طور پر حذف کرنا چاہتے ہیں؟"
                  : "Are you sure you want to permanently delete this conversation and all its coaching history?"}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirmId(null)}
                  className="text-xs font-semibold rounded-xl"
                >
                  {language === "ur" ? "منسوخ" : "Cancel"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteConversation(deleteConfirmId)}
                  className="text-xs font-bold rounded-xl"
                >
                  {language === "ur" ? "ہاں، ڈیلیٹ کریں" : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CoachPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CoachContent />
    </Suspense>
  );
}

