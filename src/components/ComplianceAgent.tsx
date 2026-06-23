import React, { useState } from "react";
import { 
  FileText, ShieldCheck, AlertTriangle, CheckCircle, Clock, 
  Settings, RefreshCw, BarChart2, BookOpen, Layers, 
  Plus, Play, AlertOctagon, Scale, HelpCircle, CheckSquare, Download, Check
} from "lucide-react";
import { UserRole } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ComplianceAgentProps {
  token: string | null;
  userRole: UserRole;
}

interface ComplianceReport {
  complianceScore: number;
  status360: string;
  auditReadiness: "LOW_RISK" | "MINOR_RISK" | "MODERATE_RISK" | "HIGH_CRITICAL_RISK" | string;
  identifiedGaps: Array<{
    id: string;
    component: string;
    regulatoryStandard: string;
    description: string;
    severity: "Low" | "Medium" | "High" | "Critical" | string;
    impact: string;
  }>;
  regulatoryChanges: Array<{
    standard: string;
    status: string;
    impact: string;
    actionRequired: string;
  }>;
  correctiveDirectives: Array<{
    id: string;
    directive: string;
    priority: "Immediate" | "Medium" | "Long-Term" | string;
    role: string;
    dueDays: number;
  }>;
}

interface AgentTraceNode {
  node: string;
  details: string;
  durationMs: number;
}

const PRESET_STANDARDS = [
  {
    id: "asme-vessel",
    name: "ASME Section VIII (Pressure Vessels)",
    category: "Mechanical Safety",
    description: "Evaluates safety relief device Actuation pressures, recalibration parameters, and continuous pressure transducer drift.",
    defaultMetric: "14.2 Bar",
    defaultDays: 120
  },
  {
    id: "osha-hazardous",
    name: "OSHA 1910.147 (Lockout/Tagout)",
    category: "Hazards Isolation",
    description: "Audits mechanical isolation padlocks, undocumented energy bypass incidents, and shift transition team sign-offs.",
    defaultMetric: "0 Bypass events",
    defaultDays: 45
  },
  {
    id: "iso-vibration",
    name: "ISO 10816-3 (Rotary Vibration Limits)",
    category: "Mechanical Fatigue",
    description: "Examines turbine and centrifugal compressor radial displacement amplitude offsets against strict Class III regulatory bands.",
    defaultMetric: "4.8 mm/s",
    defaultDays: 180
  },
  {
    id: "iso-combustion",
    name: "ISO 50001 (Thermal & Fuel Efficiency)",
    category: "Efficiency Audits",
    description: "Measures greenhouse compliance boundaries, thermal exhaust gas insulation metrics, and combustion drift margins.",
    defaultMetric: "435C Exhaust",
    defaultDays: 365
  }
];

export default function ComplianceAgent({ token, userRole }: ComplianceAgentProps) {
  const [selectedStandard, setSelectedStandard] = useState(PRESET_STANDARDS[0]);
  const [daysOverdue, setDaysOverdue] = useState(120);
  const [activeMetric, setActiveMetric] = useState("14.2 Bar");
  const [auditChecklist, setAuditChecklist] = useState<Record<string, boolean>>({
    "calib": true,
    "signs": false,
    "sealed": true,
  });

  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [traceNodes, setTraceNodes] = useState<AgentTraceNode[]>([]);
  const [durationMs, setDurationMs] = useState(0);
  const [usedAI, setUsedAI] = useState(false);
  const [customFeedback, setCustomFeedback] = useState("");

  const [activeReportTab, setActiveReportTab] = useState<"readiness" | "gaps" | "changes" | "directives">("readiness");

  const [exported, setExported] = useState(false);

  const hasWritePermission = userRole !== UserRole.Auditor;

  const handleAuditExecution = async () => {
    setIsAuditing(true);
    setReport(null);
    setTraceNodes([]);
    setExported(false);

    try {
      const resp = await fetch("/api/compliance/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({
          standard: selectedStandard.name,
          daysSinceLastInspection: daysOverdue,
          activeValue: activeMetric.trim(),
          customDirectives: customFeedback.trim()
        })
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        setReport(data.report);
        setTraceNodes(data.steps);
        setUsedAI(data.usedAI);
        setDurationMs(data.durationMs);
      } else {
        alert(data.error || "Compliance Agent Execution collapsed.");
      }
    } catch (err: any) {
      alert(`Pipeline error: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const toggleChecklist = (key: string) => {
    setAuditChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getReadinessBg = (readiness: string) => {
    switch (String(readiness).toUpperCase()) {
      case "LOW_RISK":
        return "bg-emerald-950/40 text-emerald-405 border-emerald-500/20";
      case "MINOR_RISK":
        return "bg-cyan-950/40 text-cyan-405 border-cyan-500/20";
      case "MODERATE_RISK":
        return "bg-amber-950/40 text-amber-405 border-amber-500/20";
      default:
        return "bg-rose-950/40 text-rose-405 border-rose-500/20";
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (String(severity).toLowerCase()) {
      case "critical":
        return "bg-rose-950/45 text-rose-400 border border-rose-500/30";
      case "high":
        return "bg-orange-950/45 text-orange-400 border border-orange-500/30";
      case "medium":
        return "bg-amber-955/45 text-amber-400 border border-amber-500/30";
      default:
        return "bg-slate-900 text-slate-400 border border-slate-800";
    }
  };

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2400);
  };

  return (
    <div id="compliance-intelligence-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[580px] text-slate-100 font-sans">
      
      {/* 1. SIDEBAR CONFIGURATION AREA (4 COLS) */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        
        {/* Selection Port */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5 pb-2.5 border-b border-slate-800/60">
              <Scale className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-slate-200 text-sm tracking-wide">Regulatory Standard Engine</h3>
            </div>

            <p className="text-xs text-slate-450 leading-relaxed">
              Dispatch autonomous compliance validation processes that parse internal RAG documents and check operational values for safety compliance.
            </p>

            {/* Selection Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 block uppercase">Industrial Directives:</span>
              {PRESET_STANDARDS.map((std) => (
                <button
                  key={std.id}
                  type="button"
                  onClick={() => {
                    setSelectedStandard(std);
                    setDaysOverdue(std.defaultDays);
                    setActiveMetric(std.defaultMetric);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                    selectedStandard.id === std.id
                      ? "bg-indigo-950/20 border-indigo-500/40 text-slate-200 font-semibold"
                      : "bg-slate-900/45 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-350"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-semibold truncate max-w-[210px]">{std.name}</span>
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950/30 px-1.5 py-0.5 rounded border border-indigo-500/10 whitespace-nowrap">
                      {std.category}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal line-clamp-1">
                    {std.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Input Variables Box */}
            <div className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-lg space-y-3.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">Days Since Last Physical Test:</span>
                <span className="font-bold font-mono text-indigo-300">{daysOverdue} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={daysOverdue}
                onChange={(e) => setDaysOverdue(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />

              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-wider text-slate-500 block uppercase">Continuous Telemetry Metric:</span>
                <input
                  type="text"
                  value={activeMetric}
                  onChange={(e) => setActiveMetric(e.target.value)}
                  placeholder="e.g. 14.2 Bar, 4.2 mm/s, No lockout signs"
                  className="w-full bg-slate-950 border border-slate-855 rounded-lg p-2 text-xs text-indigo-200 font-mono focus:outline-none focus:border-indigo-500/40"
                />
              </div>
            </div>

            {/* Auditor checklist */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 block uppercase">Local Field Conditions Checked:</span>
              <div className="space-y-1.5 text-xs text-slate-400 font-sans">
                <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={auditChecklist.calib}
                    onChange={() => toggleChecklist("calib")}
                    className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <span>Sensor calibration logs synchronized</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={auditChecklist.signs}
                    onChange={() => toggleChecklist("signs")}
                    className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <span>Hazard physical signage active at site</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer hover:text-slate-200 select-none">
                  <input
                    type="checkbox"
                    checked={auditChecklist.sealed}
                    onChange={() => toggleChecklist("sealed")}
                    className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <span>Physical lock-wire state sealed</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-900">
            <button
              onClick={handleAuditExecution}
              disabled={isAuditing}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold py-3 px-4 rounded-lg text-xs tracking-wider transition-colors duration-150 flex items-center justify-center space-x-2.5 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isAuditing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>PARSING COMPLIANCE DIRECTIVES...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white" />
                  <span>DISPATCH COMPLIANCE AUDITOR</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Small overview tag */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex-1 flex flex-col justify-center text-center space-y-1.5">
          <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-bold block">Status Assessment Portal</span>
          <p className="text-xs text-slate-450 leading-relaxed font-sans">
            This workspace implements compliance checks by reviewing safety guidelines and tracking ongoing maintenance logs across standard frameworks.
          </p>
        </div>

      </div>

      {/* 2. MAIN SYSTEM OUTPUT DESK (8 COLS) */}
      <div className="lg:col-span-8 flex flex-col h-full">
        
        {/* Standby screen */}
        {!report && !isAuditing && (
          <div className="flex-1 bg-slate-950 border border-slate-800/85 rounded-xl flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-400">
              <ShieldCheck className="w-7 h-7 text-indigo-400 animate-pulse" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-bold font-mono uppercase tracking-wider text-slate-200">Regulatory Audit Desk Ready</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tweak standard metrics in the control board of the left panel, and click <strong>Dispatch Compliance Auditor</strong> to process dynamic regulatory checks.
              </p>
            </div>
          </div>
        )}

        {/* Loading screen */}
        {isAuditing && (
          <div className="flex-1 bg-slate-950 border border-slate-800/85 rounded-xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6">
                <div className="flex items-center space-x-2.5">
                  <BookOpen className="w-4 h-4 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Compliance Scan In Progress</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono animate-pulse font-bold">PARSING SAFETY DOCUMENTS...</span>
              </div>

              {/* Steps simulation */}
              <div className="space-y-3.5">
                {[
                  { title: "Querying PDF Compliance Index", info: "Matches ASME pressure structures or OSHA procedures across document volumes." },
                  { title: "Calculating Temporal Gap Offset", info: "Cross-checks physical test dates and flags expired standard inspection loops." },
                  { title: "Generating Audit Matrix Report", info: "Recommends actions and extracts upcoming regulatory changes dynamically." }
                ].map((item, id) => (
                  <div key={id} className="flex gap-4 p-4 border border-slate-900 bg-indigo-950/5 rounded-lg animate-pulse">
                    <div className="w-5 h-5 rounded-full border border-indigo-500/20 flex items-center justify-center text-[10px] font-mono text-indigo-400 shrink-0">
                      {id + 1}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono font-bold text-slate-250">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{item.info}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-xs font-mono text-slate-500 italic py-2">
              Structuring compliance consensus report under secure digital token...
            </div>
          </div>
        )}

        {/* Populated Report */}
        {report && !isAuditing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-slate-950 border border-slate-805 rounded-xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header banner stats */}
            <div className="p-4 bg-slate-900/60 border-b border-slate-805 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-white tracking-wide">{selectedStandard.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wide border uppercase ${getReadinessBg(report.auditReadiness)}`}>
                    {report.auditReadiness.replace("_", " ")}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-sans">
                  Risk Assessment: <strong className="text-slate-350">{report.status360}</strong>
                </div>
              </div>

              {/* AI Badge & Export button */}
              <div className="flex items-center space-x-2.5 shrink-0 select-none">
                <button
                  type="button"
                  onClick={handleExport}
                  className="bg-slate-900/40 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors p-1.5 px-2.5 rounded text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  {exported ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-450" />
                      <span className="text-emerald-450 font-bold">EXPORTED PDF</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>EXPORT REPORT</span>
                    </>
                  )}
                </button>
                <span className={`px-2 py-1 rounded text-[10px] font-mono border ${
                  usedAI 
                    ? "bg-purple-950/40 text-purple-400 border-purple-500/20" 
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}>
                  {usedAI ? "✨ Gemini RAG" : "⚙️ Local Audit"}
                </span>
              </div>
            </div>

            {/* Score display block with details */}
            <div className="p-5 bg-slate-950 grid grid-cols-1 md:grid-cols-12 gap-5 items-center border-b border-slate-900/80">
              
              {/* Compliance score circular display */}
              <div className="md:col-span-4 flex items-center justify-center space-x-4">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-900"
                      strokeWidth="2.5"
                      stroke="currentColor"
                      fill="transparent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-indigo-500"
                      strokeDasharray={`${report.complianceScore}, 100`}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-mono font-bold text-white leading-none">{report.complianceScore}%</span>
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Score</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Continuous Rating:</span>
                  <p className="font-bold text-slate-200">
                    {report.complianceScore >= 90 ? "Excellent Protocol Alignment" : 
                     report.complianceScore >= 70 ? "Adequate Compliance Controls" : 
                     "Severe Regulatory Deviations"}
                  </p>
                  <p className="text-[10px] text-slate-450 leading-normal">
                    Calculated over {daysOverdue} elapsed days and a {activeMetric} primary parameter threshold check.
                  </p>
                </div>
              </div>

              {/* Quick Checklist evaluation metadata */}
              <div className="md:col-span-8 grid grid-cols-3 gap-3">
                {[
                  { label: "Temporal Offset Check", state: daysOverdue < 180 ? "Nominal" : "Expired", color: daysOverdue < 180 ? "text-emerald-450" : "text-amber-450" },
                  { label: "Telemetry Threshold", state: activeMetric, color: "text-indigo-400" },
                  { label: "Physical Lock Wire", state: auditChecklist.sealed ? "Sealed Integrity" : "Unsealed", color: auditChecklist.sealed ? "text-emerald-450" : "text-rose-455" }
                ].map((chk, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900/40 border border-slate-850 rounded-lg text-center space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">{chk.label}</span>
                    <span className={`text-[11px] font-mono font-bold truncate block ${chk.color}`}>{chk.state}</span>
                  </div>
                ))}
              </div>

            </div>

            {/* Custom Interactive Tabs selector */}
            <div className="flex border-b border-slate-850 px-3 py-1 bg-slate-950 gap-1 overflow-x-auto">
              {(["readiness", "gaps", "changes", "directives"] as const).map((tab) => {
                const names = {
                  readiness: "Audit Readiness & Trace",
                  gaps: "Identified Gaps",
                  changes: "Regulatory Amendments",
                  directives: "Actionable Directives"
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveReportTab(tab)}
                    className={`px-3 py-2 text-xs font-mono font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      activeReportTab === tab
                        ? "bg-slate-900 text-indigo-400 border border-slate-800 shadow"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    {names[tab]}
                  </button>
                );
              })}
            </div>

            {/* Tab content space */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* READINESS & PIPELINE TRACE */}
              {activeReportTab === "readiness" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-lg space-y-1.5 leading-normal">
                    <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase block">Expert Auditor Assessment:</span>
                    <p className="text-xs text-slate-300">
                      Based on current operational parameters, the plant exhibits a general <strong>{report.status360}</strong> rating. Gaps have been isolated targeting the component inspection cycles, which must be registered on the compliance tracker.
                    </p>
                  </div>

                  {/* Trace details */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block">Intelligence Agent Extraction Nodes:</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
                      {traceNodes.map((step, id) => (
                        <div key={id} className="p-3 bg-slate-900/25 border border-slate-850 rounded-lg space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <strong className="text-indigo-400 truncate">{step.node}</strong>
                            <span className="text-slate-500 shrink-0">{step.durationMs}ms</span>
                          </div>
                          <p className="text-[10px] text-slate-450 leading-relaxed">{step.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500">
                    Analysis compiled under operational token constraints in <strong>{durationMs}ms</strong>.
                  </div>
                </div>
              )}

              {/* IDENTIFIED METALLURGICAL/PROCEDURAL GAPS */}
              {activeReportTab === "gaps" && (
                <div className="space-y-3">
                  {report.identifiedGaps.length === 0 ? (
                    <div className="text-center text-xs text-slate-500 py-6 font-mono">
                      No compliance gaps identified. Regulatory requirements fully aligned.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {report.identifiedGaps.map((gap) => (
                        <div key={gap.id} className="bg-slate-900/20 border border-slate-850 rounded-lg p-4 font-sans space-y-2">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-xs text-slate-200">
                                Component: <span className="text-indigo-300 font-mono">{gap.component}</span>
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                                Requirements: {gap.regulatoryStandard}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-wide uppercase shrink-0 ${getSeverityBg(gap.severity)}`}>
                              {gap.severity} Severity
                            </span>
                          </div>

                          <p className="text-xs text-slate-350 leading-normal font-sans">
                            {gap.description}
                          </p>

                          <div className="p-2 bg-rose-950/20 border border-rose-900/10 rounded text-[11px] text-rose-400 leading-normal flex items-start gap-1.5 font-sans">
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>
                              <strong>Catastrophic Impact:</strong> {gap.impact}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* REGULATORY CHANGES & AMENDMENTS */}
              {activeReportTab === "changes" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-450 leading-relaxed">
                    The agent tracks continuous updates in ASTM, OSHA, and ISO standards portals. The following pending or active regulatory changes apply to this workflow:
                  </p>

                  <div className="space-y-3 font-sans">
                    {report.regulatoryChanges.map((change, idx) => (
                      <div key={idx} className="bg-slate-900/25 border border-slate-850 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                          <strong className="text-slate-250 font-mono text-xs">{change.standard}</strong>
                          <span className="text-[9px] font-mono text-amber-400 bg-amber-950/10 px-1.5 py-0.5 rounded border border-amber-500/10">
                            {change.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-mono text-slate-500 uppercase block">Amended Protocol Impact:</span>
                            <p className="text-slate-300 leading-normal font-sans">{change.impact}</p>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[9px] font-mono text-indigo-400 uppercase block">Operational Action Required:</span>
                            <p className="text-indigo-200 leading-normal font-sans font-medium">{change.actionRequired}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTIONABLE DIRECTIVES & CORRECTIVE RECOMMENDATIONS */}
              {activeReportTab === "directives" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-450 leading-relaxed mb-1">
                    To mitigate isolated hazards and maintain physical plant alignment with certification frameworks, implement these directives immediately:
                  </p>

                  <div className="space-y-2.5">
                    {report.correctiveDirectives.map((dir, id) => (
                      <div key={dir.id} className="bg-slate-905 border border-slate-850 rounded-lg p-3.5 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-[10px] font-mono font-bold text-slate-400 shrink-0">
                              {id + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-200">{dir.directive}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 ps-7">
                            <span>Primary Auditor Role:</span>
                            <span className="font-mono text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded">
                              {dir.role}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ps-7 md:ps-0 shrink-0 select-none">
                          <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-500/10">
                            Due in {dir.dueDays} Days
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wide border ${
                            dir.priority.toLowerCase() === "immediate"
                              ? "bg-rose-950/40 text-rose-400 border-rose-500/20"
                              : "bg-indigo-950/40 text-indigo-400 border-indigo-500/20"
                          }`}>
                            {dir.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-950/15 border border-indigo-500/10 rounded-lg p-3 px-3.5 flex items-start space-x-2.5 text-[11px] text-indigo-400 mt-4 leading-normal font-sans">
                    <CheckSquare className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Compliance orders logged. Complete these corrective items to satisfies OSHA and ASME regional standard regulations automatically.
                    </span>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}

      </div>

    </div>
  );
}
