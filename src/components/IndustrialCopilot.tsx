import React, { useState, useEffect } from "react";
import { 
  Bot, Network, Database, Search, Sparkles, Cpu, Layers, Send, 
  Terminal, ArrowRight, BookOpen, Clock, AlertCircle, CheckCircle, 
  HelpCircle, Activity, FileText, Check, ShieldAlert, Award
} from "lucide-react";
import { UserRole } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface IndustrialCopilotProps {
  token: string | null;
  userRole: UserRole;
}

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  confidenceScore?: number;
  searchStats?: {
    nodesFound: number;
    edgesFound: number;
    chunksFound: number;
    userRole: string;
  };
  trace?: Array<{
    nodeName: string;
    status: string;
    latencyMs: number;
    insights: string;
    artifact?: any;
  }>;
}

export default function IndustrialCopilot({ token, userRole }: IndustrialCopilotProps) {
  const [customAssets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("indus_assets");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dynamicQueries = customAssets.length > 0 ? customAssets.flatMap(asset => {
    return [
      {
        label: `${asset.name} Limits`,
        query: `What is the active maintenance logs and safety limits for ${asset.name}?`
      },
      {
        label: `${asset.name} LOTO procedure`,
        query: `Provide a detailed step-by-step Lockout/Tagout (LOTO) isolation physical procedure for ${asset.name}.`
      }
    ];
  }).slice(0, 4) : [
    {
      label: "Regulatory LOTO safety guidelines",
      query: "Provide a detailed step-by-step Lockout/Tagout (LOTO) isolation physical procedure for general high-pressure systems."
    },
    {
      label: "Pressure vessel maintenance codes",
      query: "What is the typical active maintenance log schedule and safety limits for standard industrial pressure vessel systems?"
    },
    {
      label: "ASME compliance code details",
      query: "What ASME Section VIII compliance codes apply to industrial safety valves and how must they be physically calibrated and tested?"
    }
  ];

  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-msg",
      sender: "copilot",
      text: "### Welcome to the Indus Brain Al Copilot\n\nI am connected directly to your simulated **Neo4j Knowledge Graph** and **ChromaDB Vector Index** to answer complex operator queries using an agentic, multi-stage LangGraph workflow.\n\nAsk me about equipment specifications, active maintenance records, ASME safety regulations, or step-by-step physical standard procedures (LOTO). Use the quick quick-presets below to test the full context-aware search immediately.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>("initial-msg");

  const activeMessage = messages.find(m => m.id === activeMessageId) || messages[messages.length - 1];

  const handleSendQuery = async (userQuery: string) => {
    if (!userQuery.trim()) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const copilotMessageId = `msg-copilot-${Date.now()}`;
    const messageTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Add user message
    const newMessages: Message[] = [
      ...messages,
      {
        id: userMessageId,
        sender: "user",
        text: userQuery,
        timestamp: messageTimestamp
      }
    ];

    setMessages(newMessages);
    setIsAnalyzing(true);
    setQuery("");

    try {
      const resp = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({ query: userQuery })
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: copilotMessageId,
            sender: "copilot",
            text: data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            confidenceScore: data.confidenceScore,
            searchStats: data.searchStats,
            trace: data.trace
          }
        ]);
        setActiveMessageId(copilotMessageId);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: copilotMessageId,
            sender: "copilot",
            text: `⚠️ **Server Engineering Error:**\n\n${data.error || "Could not deconstruct query. Please check pipeline database connections."}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setActiveMessageId(copilotMessageId);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: copilotMessageId,
          sender: "copilot",
          text: `❌ **Failed to establish network pipeline with fullstack agent gateway.**\n\nEnsure server process is running and authorized correctly. Detailed logs: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setActiveMessageId(copilotMessageId);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendQuery(query);
  };

  // Helper to color nodes in trace visualizer
  const getNodeIconColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-emerald-400 bg-emerald-950/40 border-emerald-500/30";
      case "RUNNING": return "text-amber-400 bg-amber-950/40 border-amber-500/30";
      default: return "text-slate-400 bg-slate-900 border-slate-700/50";
    }
  };

  return (
    <div id="copilot-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[550px] text-slate-100">
      
      {/* LEFT PANEL: Chat Feed + Preset list (7 Cols) */}
      <div id="copilot-chat-panel" className="lg:col-span-7 flex flex-col bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
        {/* Terminal Titlebar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            </div>
            <span className="text-xs font-mono text-slate-400 tracking-wider">GATEWAY://INDUS-BRAIN-AGENTIC-COPILOT</span>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>AGENTIC FEED ACTIVE</span>
          </div>
        </div>

        {/* Scrollable messages container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 pr-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "copilot" && (
                  <div className="w-8 h-8 rounded-lg bg-orange-950/50 border border-orange-500/30 flex items-center justify-center shrink-0 text-orange-400 text-sm font-semibold">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                
                <div 
                  onClick={() => msg.sender === "copilot" && setActiveMessageId(msg.id)}
                  className={`group relative max-w-[85%] rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    msg.sender === "user" 
                      ? "bg-slate-800 border border-slate-700/80 text-white ml-auto" 
                      : `bg-slate-900/40 border text-slate-200 ${
                          activeMessageId === msg.id 
                            ? "border-orange-500/40 shadow-[0_0_15px_-3px_rgba(239,125,49,0.15)] bg-slate-900/90" 
                            : "border-slate-800/80 hover:border-slate-700/60 hover:bg-slate-900/60"
                        }`
                  }`}
                >
                  {/* Speaker name */}
                  <div className="flex items-center justify-between gap-4 mb-1.5 text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                    <span>{msg.sender === "user" ? "OPERATOR INQUIRY" : "INDUS CO-INTELLIGENCE"}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Content (Render Markdown / code blocks beautifully) */}
                  <div className="text-sm leading-relaxed prose prose-invert font-sans whitespace-pre-wrap select-text">
                    {msg.text}
                  </div>

                  {/* Context Summary Tag for Copilot Answers */}
                  {msg.sender === "copilot" && msg.confidenceScore && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                      <div className="flex items-center space-x-2">
                        <Award className="w-3.5 h-3.5 text-orange-400" />
                        <span>Confidence Model: <strong className="text-white">{msg.confidenceScore}%</strong></span>
                      </div>
                      <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-orange-400">
                        Click details in right panel ➜
                      </span>
                    </div>
                  )}
                </div>

                {msg.sender === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 font-mono text-xs font-bold text-slate-300">
                    OP
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-950/50 border border-orange-500/30 flex items-center justify-center text-orange-400 animate-spin shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="bg-slate-900/40 border border-slate-800/80 max-w-[70%] rounded-lg p-4 flex flex-col space-y-2">
                <span className="text-[10px] font-mono tracking-wider text-amber-400 animate-pulse uppercase">
                  LANGRAPH NODE STATE LOOP ENGAGED...
                </span>
                <div className="flex items-center space-x-2 text-sm text-slate-400 font-mono py-1">
                  <span className="inline-block w-1.5 h-4 bg-orange-500 animate-[bounce_1s_infinite]"></span>
                  <span>Synthesizing Graph-RAG vectors and documents...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Sandbox + Presets in footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/30">
          {/* Quick presets list */}
          <div className="mb-3.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-2">Preset Copilot Inquiries:</span>
            <div className="flex flex-wrap gap-2">
              {dynamicQueries.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => {
                    setQuery(preset.query);
                    handleSendQuery(preset.query);
                  }}
                  className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-750 transition-all text-slate-300 px-3 py-1.5 rounded-md text-left max-w-sm truncate line-clamp-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎯 {preset.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Copilot (e.g., 'What is the ASME sec VIII safety rating for V-101 and pressure metrics?')..."
              disabled={isAnalyzing}
              className="flex-1 bg-slate-900 border border-slate-805 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 text-white placeholder-slate-500 disabled:opacity-55"
            />
            <button
              type="submit"
              disabled={isAnalyzing || !query.trim()}
              className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 disabled:bg-slate-800 disabled:text-slate-500 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: LangGraph Trace & Grounding Metrics (5 Cols) */}
      <div id="copilot-context-panel" className="lg:col-span-5 flex flex-col space-y-6">
        
        {/* LangGraph Agentic Pipeline Tracer Visualizer */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex-1 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5 mb-4">
            <div className="flex items-center space-x-2.5">
              <Network className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-slate-200">LangGraph Agent Pipeline</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 text-slate-400 rounded">WORKFLOW TRACER</span>
          </div>

          {!activeMessage.trace ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3 font-mono">
              <Cpu className="w-10 h-10 text-slate-700 animate-pulse" />
              <div className="text-xs">
                Select a processed response to visualize the active multi-agent pipeline trace.
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
                The chart below traces the in-memory **LangGraph state transitions** evaluated sequentially during context extraction:
              </p>

              {/* Steps timeline list */}
              <div className="flex-1 space-y-4">
                {activeMessage.trace.map((step, idx) => (
                  <div key={idx} className="relative pl-5 border-l border-slate-805 pb-1">
                    {/* Ring Indicator */}
                    <div className="absolute -left-[9px] top-1 w-4 border-2 border-slate-950 bg-slate-900 rounded-full flex items-center justify-center">
                      <span className={`w-2 h-2 rounded-full ${step.status === "COMPLETED" ? "bg-emerald-400 animate-none" : "bg-orange-500 animate-pulse"}`}></span>
                    </div>

                    <div className={`p-3 rounded-lg border transition-all duration-300 ${getNodeIconColor(step.status)}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-semibold text-slate-250">
                          {idx + 1}. {step.nodeName}
                        </span>
                        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{step.latencyMs}ms</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {step.insights}
                      </p>

                      {step.artifact && (
                        <div className="mt-2 text-[10px] font-mono bg-slate-950/80 p-1.5 rounded text-slate-400 border border-slate-800/40 overflow-hidden text-ellipsis">
                          <span className="text-orange-400 font-bold">Artifacts:</span> {JSON.stringify(step.artifact)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Database Search & Semantic Validation stats */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center space-x-2.5">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-slate-200">Joint Context Grounding</h3>
            </div>
            <span className="text-[10px] bg-slate-900 px-2 py-0.5 text-slate-400 rounded font-mono">STATS</span>
          </div>

          {activeMessage.searchStats ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/50 border border-slate-850 p-3 rounded-lg text-center">
                <span className="text-xs font-sans text-slate-400 block mb-1">KG Entities</span>
                <span className="text-xl font-mono text-white font-bold block">
                  {activeMessage.searchStats.nodesFound}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 mt-0.5 block">GraphRAG Nodes</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-850 p-3 rounded-lg text-center">
                <span className="text-xs font-sans text-slate-400 block mb-1">KG Edges</span>
                <span className="text-xl font-mono text-white font-bold block">
                  {activeMessage.searchStats.edgesFound}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 mt-0.5 block">GraphRAG Rules</span>
              </div>
              <div className="bg-slate-900/50 border border-slate-850 p-3 rounded-lg text-center">
                <span className="text-xs font-sans text-slate-400 block mb-1">Cited Chunks</span>
                <span className="text-xl font-mono text-white font-bold block">
                  {activeMessage.searchStats.chunksFound}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 mt-0.5 block">ChromaDB Pages</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono py-2 py-3 justify-center">
              <HelpCircle className="w-4 h-4 text-slate-600" />
              <span>Metrics are compiled after executing queries.</span>
            </div>
          )}

          {activeMessage.confidenceScore && (
            <div className="mt-4 pt-4 border-t border-slate-850/80">
              <div className="flex justify-between items-center text-xs text-slate-400 font-sans mb-1.5">
                <span>Joint Retrieval Relevance Target:</span>
                <span className="font-semibold text-white">{activeMessage.confidenceScore}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${activeMessage.confidenceScore}%` }}
                ></div>
              </div>
              <div className="mt-2.5 flex items-start space-x-2 text-[10px] font-mono text-slate-400 p-2 bg-emerald-950/20 border border-emerald-500/10 rounded">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  The answer matches regulatory documentation. Risk score: <strong className="text-white">LOW</strong>, ASME alignment certified.
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
