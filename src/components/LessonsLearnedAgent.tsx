import React, { useState, useEffect } from "react";
import { 
  BookOpen, Search, Plus, ThumbsUp, Tag, Calendar, 
  User, ShieldAlert, CheckCircle, RefreshCw, AlertCircle, 
  HelpCircle, Sparkles, Send, Download, Check, Clipboard
} from "lucide-react";
import { UserRole, LessonLearned } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LessonsLearnedAgentProps {
  token: string | null;
  userRole: UserRole;
}

export default function LessonsLearnedAgent({ token, userRole }: LessonsLearnedAgentProps) {
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [isQueryingAI, setIsQueryingAI] = useState(false);
  const [queryDurationMs, setQueryDurationMs] = useState(0);
  const [usedAI, setUsedAI] = useState(false);

  // New Lesson form state
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Mechanical");
  const [newEquipment, setNewEquipment] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newRootCause, setNewRootCause] = useState("");
  const [newPreventativeAction, setNewPreventativeAction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [downloadedMemo, setDownloadedMemo] = useState(false);

  // Load standard list on load
  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch("/api/lessons", {
        headers: {
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        }
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setLessons(data.lessons);
      }
    } catch (err) {
      console.error("Error loading lessons:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsQueryingAI(true);
    setAiInsight("");

    try {
      const resp = await fetch("/api/lessons/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setLessons(data.matched);
        setAiInsight(data.aiInsight);
        setUsedAI(data.usedAI);
        setQueryDurationMs(data.durationMs);
      }
    } catch (err) {
      console.error("Error searching lessons:", err);
    } finally {
      setIsQueryingAI(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newEquipment.trim() || !newDescription.trim()) {
      alert("Please fill in key attributes (Title, Equipment code, and Memory description).");
      return;
    }

    setIsSubmitting(true);
    setFormFeedback(null);

    try {
      const resp = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          equipment: newEquipment.trim(),
          description: newDescription.trim(),
          rootCause: newRootCause.trim(),
          preventativeAction: newPreventativeAction.trim()
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setLessons(prev => [data.lesson, ...prev]);
        setFormFeedback(`Contribution Registered! ${data.aiEnhancement}`);
        
        // Clear inputs
        setNewTitle("");
        setNewEquipment("");
        setNewDescription("");
        setNewRootCause("");
        setNewPreventativeAction("");
      } else {
        setFormFeedback(`Registration error: ${data.error}`);
      }
    } catch (err: any) {
      setFormFeedback(`Registration error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["All", "Mechanical", "Electrical", "Operational", "Safety", "Calibration"];

  // Gather unique tags for filtering
  const allTagsSet = new Set<string>();
  lessons.forEach(l => l.tags.forEach(t => allTagsSet.add(t)));
  const uniqueTags = Array.from(allTagsSet).slice(0, 10);

  const filteredLessons = lessons.filter(l => {
    if (selectedCategory !== "All" && l.category !== selectedCategory) return false;
    if (selectedTag && !l.tags.includes(selectedTag)) return false;
    return true;
  });

  const handleDownloadMemo = () => {
    setDownloadedMemo(true);
    setTimeout(() => {
      setDownloadedMemo(false);
    }, 2500);
  };

  return (
    <div id="lessons-learned-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[580px] text-slate-100 font-sans">
      
      {/* LEFT SIDEBAR: EXPERT KNOWLEDGE CAPTURE CARD (4 COLS) */}
      <div className="lg:col-span-4 flex flex-col space-y-6 overflow-y-auto pr-1">
        
        {/* Knowledge Submission form */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/60 mb-4">
              <Clipboard className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-slate-200 text-sm tracking-wide">Capture Expert Knowledge</h3>
            </div>

            <p className="text-xs text-slate-450 leading-relaxed mb-4">
              Enter newly discovered troubleshooting methodologies or preventative insights to convert personal expertise into reusable team knowledge.
            </p>

            <form onSubmit={handleCreateLesson} className="space-y-3.5">
              
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider text-slate-450 uppercase block">Memory Lesson Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Recurrent high-pressure pump cavitation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40"
                />
              </div>

              {/* Grid Category & Equipment */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-slate-450 uppercase block">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500/40 cursor-pointer"
                  >
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Operational">Operational</option>
                    <option value="Safety">Safety</option>
                    <option value="Calibration">Calibration</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono tracking-wider text-slate-450 uppercase block">Equipment Tag:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Turbine GT-400"
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 font-mono"
                  />
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider text-slate-450 uppercase block">Discovered Incident Event:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe failure details, mechanical observations, and sensor anomalies..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 resize-none"
                />
              </div>

              {/* Root Cause */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider text-slate-450 uppercase block font-semibold text-rose-400">Identified Root Cause:</label>
                <textarea
                  rows={1.5}
                  placeholder="Why did this anomaly occur? e.g. Throttled valve resistance..."
                  value={newRootCause}
                  onChange={(e) => setNewRootCause(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 resize-none"
                />
              </div>

              {/* Preventative actions */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider text-slate-450 uppercase block font-semibold text-emerald-400">Preventative Action / Mitigation Rule:</label>
                <textarea
                  rows={1.5}
                  placeholder="Rule for next time: e.g. enforce safety bypass limits..."
                  value={newPreventativeAction}
                  onChange={(e) => setNewPreventativeAction(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/40 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-700 hover:bg-purple-650 disabled:opacity-50 text-white font-mono font-bold py-2.5 px-3 rounded-lg text-[11px] tracking-wider transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg mt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>REGISTRY SAVING...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-white" />
                    <span>REGISTER MEMORY LOG</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Form Feedback */}
          {formFeedback && (
            <div className="mt-4 p-3 bg-purple-950/20 border border-purple-500/10 rounded-lg text-[11px] leading-relaxed text-purple-300">
              {formFeedback}
            </div>
          )}
        </div>

        {/* Informative widget */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex-1 flex flex-col justify-center text-center space-y-1.5">
          <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase font-bold block">Avoid Repeat Failures</span>
          <p className="text-xs text-slate-450 leading-relaxed font-sans">
            By compiling past issues in this dynamic knowledge interface, teams prevent repeated engineering faults and resolve operations safely.
          </p>
        </div>

      </div>

      {/* RIGHT WORKPLACE BOARD: HISTORICAL SEARCH ENGINE & ADVISER (8 COLS) */}
      <div className="lg:col-span-8 flex flex-col h-full space-y-4">
        
        {/* TOP Search & AI input block */}
        <div className="bg-slate-950 border border-slate-800/85 rounded-xl p-4.5 shadow-2xl">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search past solutions by machinery (e.g., turbine, pump), anomaly (cavitation, vibration), tags, or cause..."
                className="w-full bg-slate-900 border border-slate-850 rounded-lg py-2.5 pl-10 pr-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            
            <button
              type="submit"
              disabled={isQueryingAI}
              className="bg-purple-650 hover:bg-purple-600 disabled:opacity-50 text-white font-mono font-bold px-4 rounded-lg text-xs tracking-wider transition-colors duration-150 flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              {isQueryingAI ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>SYNTHESIZING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                  <span>AI SEARCH</span>
                </>
              )}
            </button>
          </form>

          {/* Quick filter labels */}
          <div className="flex flex-wrap items-center mt-3 gap-1.5 text-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mr-1 select-none">Quick Filter:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedTag(null);
                }}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer select-none transition-colors ${
                  selectedCategory === cat && !selectedTag
                    ? "bg-purple-950/40 text-purple-400 border-purple-500/30"
                    : "bg-slate-900 text-slate-400 border-slate-850 hover:text-slate-300"
                }`}
              >
                {cat}
              </button>
            ))}

            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="px-2.5 py-0.5 rounded text-[10px] font-mono border bg-amber-950/40 text-amber-400 border-amber-500/30 cursor-pointer select-none flex items-center space-x-1"
              >
                <span>Tag: {selectedTag}</span>
                <span className="font-sans font-bold">×</span>
              </button>
            )}
          </div>
        </div>

        {/* AI ADVISORY CONSOLES */}
        <AnimatePresence mode="wait">
          {aiInsight && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-4 shadow-xl space-y-2.5 relative overflow-hidden"
            >
              {/* background flow design */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/5 blur-2xl rounded-full" />
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400 fill-purple-400 animate-bounce" />
                  <span className="text-xs font-mono text-purple-300 uppercase tracking-widest font-bold">Lessons Learned AI Counsel</span>
                </div>
                <button
                  onClick={handleDownloadMemo}
                  className="text-[11px] font-mono text-slate-450 hover:text-slate-200 transition-colors flex items-center space-x-1.5"
                >
                  {downloadedMemo ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-450" />
                      <span className="text-emerald-450 font-bold">MEMO COMPILED</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>DOWNLOAD MEMO</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed space-y-1.5 relative z-10 bg-slate-950/30 p-3 rounded-lg border border-purple-500/5 font-sans whitespace-pre-line">
                {aiInsight}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 relative z-10 pt-1">
                <span>RAG Retrieval matches filtered history</span>
                <span>Compiled using {usedAI ? "✨ Gemini Pro" : "⚙️ Pattern-matching"} in {queryDurationMs}ms</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN QUERY RESULTS WATERFALL */}
        <div className="flex-1 bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex flex-col overflow-hidden">
          
          <div className="flex justify-between items-center pb-3 border-b border-slate-850 mb-4 text-xs font-mono">
            <div className="flex items-center space-x-2 text-slate-400">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Historical Database ({filteredLessons.length} records)</span>
            </div>

            <span className="text-slate-500">
              Showing {selectedCategory} repairs
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                <span>RETRIEVING HISTORICAL REPOS...</span>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-500 py-12 space-y-2">
                <AlertCircle className="w-6 h-6 text-slate-600 animate-pulse" />
                <p className="font-mono">No matching lessons found in past reports.</p>
                <p className="text-[11px] text-slate-600 max-w-xs">
                  Try typing basic terms (e.g. "valve", "turbine", "boiler") or register a new lesson under the left capture card.
                </p>
              </div>
            ) : (
              filteredLessons.map((lesson) => (
                <div key={lesson.id} className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 transition-all rounded-lg p-4 space-y-3 font-sans">
                  
                  {/* Top bar info */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <h4 className="font-bold text-xs text-slate-200">
                          {lesson.title}
                        </h4>
                        <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-950/10 px-1.5 py-0.5 rounded border border-purple-500/10 uppercase shrink-0">
                          {lesson.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-450 font-mono">
                        <span className="text-slate-350 bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded font-mono">
                          Equipment: {lesson.equipment}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {lesson.incidentDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-450 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 select-none shrink-0">
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{lesson.contributor}</span>
                    </div>
                  </div>

                  {/* Incident observation */}
                  <p className="text-xs text-slate-350 leading-relaxed font-sans">
                    <strong>Incident Event:</strong> {lesson.description}
                  </p>

                  {/* Cause & preventative boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-normal">
                    
                    {/* Cause */}
                    <div className="p-2.5 bg-rose-950/10 border border-rose-900/15 rounded-lg space-y-1">
                      <div className="flex items-center space-x-1.5 text-[10px] text-rose-450 font-mono font-bold uppercase">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Root Cause Analysis</span>
                      </div>
                      <p className="text-slate-300 font-sans">{lesson.rootCause}</p>
                    </div>

                    {/* Action */}
                    <div className="p-2.5 bg-emerald-950/10 border border-emerald-900/15 rounded-lg space-y-1">
                      <div className="flex items-center space-x-1.5 text-[10px] text-emerald-450 font-mono font-bold uppercase">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Preventative Mitigation</span>
                      </div>
                      <p className="text-slate-300 font-sans">{lesson.preventativeAction}</p>
                    </div>

                  </div>

                  {/* Hash tags */}
                  <div className="flex flex-wrap items-center gap-1.5 select-none pt-1">
                    <Tag className="w-3 h-3 text-slate-500" />
                    {lesson.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        className="text-[9px] font-mono text-slate-500 hover:text-purple-300 transition-colors hover:underline"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
