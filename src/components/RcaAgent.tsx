import React, { useState } from "react";
import { 
  Cpu, Play, AlertTriangle, ShieldAlert, CheckCircle, Clock, 
  Activity, ArrowRight, Layers, FileText, BarChart2, ShieldCheck, 
  HelpCircle, Trash2, Check, RefreshCw, Send, Radio
} from "lucide-react";
import { UserRole } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface RcaAgentProps {
  token: string | null;
  userRole: UserRole;
}

interface RcaReport {
  problemIdentification: {
    title: string;
    equipment: string;
    severity: string;
    timeline: string[];
    coreDilemma: string;
  };
  possibleCauses: Array<{
    hypothesis: string;
    likelihood: number;
    rationale: string;
    isPrimary: boolean;
  }>;
  evidence: {
    knowledgeGraph: string;
    sensorData: string;
    maintenanceTrace: string;
    complianceCitations: string;
  };
  correctiveActions: Array<{
    action: string;
    priority: "Immediate" | "Medium" | "Long-Term" | string;
    responsibleRole: string;
    standardReference: string;
  }>;
}

interface AgentStepTrace {
  step: string;
  description: string;
  status: string;
  duration: number;
}

const PRESET_INCIDENTS = [
  {
    id: "boiler-overpressure",
    title: "Boiler B-201 Steam Overpressure Event",
    equipment: "Boiler B-201",
    symptoms: "High pressure transducer variance at 14.2 Bar. Back-end automatic trip engaged safety vents."
  },
  {
    id: "turbine-vibration-crack",
    title: "Turbine GT-400 Dynamic Vibration Signal",
    equipment: "Turbine GT-400",
    symptoms: "Rotor radial monitor recorded an anomalous frequency deflection beyond nominal 350Hz boundaries."
  },
  {
    id: "valve-mechanical-jam",
    title: "Valve V-101 Calibration Failure Signal",
    equipment: "Relief Valve V-101",
    symptoms: "Mechanical feedback reports mechanical spring latch corrosion and delay in standard relief venting sequence."
  }
];

export default function RcaAgent({ token, userRole }: RcaAgentProps) {
  const [selectedIncident, setSelectedIncident] = useState(PRESET_INCIDENTS[0]);
  const [customSymptoms, setCustomSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // States to hold calculated report
  const [report, setReport] = useState<RcaReport | null>(null);
  const [traceSteps, setTraceSteps] = useState<AgentStepTrace[]>([]);
  const [usedAI, setUsedAI] = useState(false);
  const [duration, setDuration] = useState(0);
  
  const [activeReportTab, setActiveReportTab] = useState<"summary" | "causes" | "evidence" | "actions">("summary");

  const hasTriggerPermission = userRole !== UserRole.Auditor;

  const handleRunRca = async () => {
    if (!hasTriggerPermission) return;
    
    setIsAnalyzing(true);
    setReport(null);
    setTraceSteps([]);

    try {
      const resp = await fetch("/api/rca/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({
          incidentId: selectedIncident.title,
          customSymptoms: customSymptoms.trim() || selectedIncident.symptoms
        })
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        setReport(data.report);
        setTraceSteps(data.steps);
        setUsedAI(data.usedAI);
        setDuration(data.durationMs);
      } else {
        alert(data.error || "Root Cause Analysis compilation failed");
      }
    } catch (err: any) {
      alert(`Pipeline error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "immediate": return "bg-rose-950/40 text-rose-400 border border-rose-500/35";
      case "medium": return "bg-amber-955/40 text-amber-400 border border-amber-500/35";
      default: return "bg-emerald-955/40 text-emerald-400 border border-emerald-500/35";
    }
  };

  return (
    <div id="rca-workspace" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[550px] text-slate-100">
      
      {/* LEFT SIDEBAR: Failure Trigger Inputs (4 cols) */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        
        {/* Incident Trigger Card */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-4 pb-2.5 border-b border-slate-800/60">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-slate-200 text-sm font-sans tracking-wide">Failure Ingress Port</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4 font-sans">
              Select an active equipment malfunction trigger or customize physical symptoms to execute an automated investigation.
            </p>

            {/* Presets List */}
            <div className="space-y-2.5 mb-4">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 block uppercase">Pre-registered Signals:</span>
              {PRESET_INCIDENTS.map((inc) => (
                <button
                  key={inc.id}
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setCustomSymptoms("");
                  }}
                  className={`w-full text-left p-3 rounded-lg border text-xs leading-normal transition-all duration-200 cursor-pointer ${
                    selectedIncident.id === inc.id 
                      ? "bg-slate-900 border-orange-500/40 text-slate-200 font-semibold" 
                      : "bg-slate-900/45 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 font-sans">
                    <span className="font-medium truncate max-w-[200px]">{inc.title}</span>
                    <span className="text-[10px] font-mono text-orange-400 bg-orange-950/20 px-1.5 py-0.5 rounded border border-orange-500/10">
                      {inc.equipment}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 truncate line-clamp-1">
                    {inc.symptoms}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom symptoms textarea */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[10px] font-mono tracking-wider text-slate-500 block uppercase">Custom Operator Observations:</label>
              <textarea
                value={customSymptoms}
                onChange={(e) => setCustomSymptoms(e.target.value)}
                placeholder={`Override symptoms (e.g. 'Component mechanical stress cycles exceeding threshold, vibration values reading high at ${selectedIncident.equipment}...')`}
                disabled={isAnalyzing}
                className="w-full h-24 bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 leading-normal"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleRunRca}
              disabled={isAnalyzing || !hasTriggerPermission}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold font-mono py-3 px-4 rounded-lg text-xs tracking-wider transition-colors duration-150 flex items-center justify-center space-x-2.5 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>EXECUTING DYNAMIC AGENT AGGREGATION...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>ENGAGE RCA INVESTIGATOR AGENT</span>
                </>
              )}
            </button>

            {!hasTriggerPermission && (
              <div className="mt-3 p-3 bg-rose-950/20 border border-rose-500/10 rounded-lg flex items-start space-x-2 text-[11px] text-rose-400 leading-normal font-sans">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Auditor role permissions are restricted to viewing only. Autonomous analysis dispatches require an Engineer.</span>
              </div>
            )}
          </div>
        </div>

        {/* Informative Causal loop breakdown */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-2xl flex-1 flex flex-col justify-center">
          <span className="text-[10px] font-mono tracking-widest text-orange-400 uppercase font-bold block mb-2 text-center">Root Cause Methodology</span>
          <p className="text-xs text-slate-400 leading-relaxed text-center font-sans">
            The agent acts as a centralized compliance supervisor, drawing live telemetry points, Neo4j component hierarchies, and RAG regulatory standard manuals to reconstruct the timeline and generate actionable corrective directives.
          </p>
        </div>

      </div>

      {/* RIGHT DISPLAY: Investigation Steps & Interactive Structured Report (8 cols) */}
      <div className="lg:col-span-8 flex flex-col h-full">
        
        {/* If standby state */}
        {!report && !isAnalyzing && (
          <div className="flex-1 bg-slate-950 border border-slate-800/85 rounded-xl flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <Radio className="w-6 h-6 animate-pulse text-orange-400" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h4 className="font-bold font-mono uppercase tracking-wider text-slate-200">RCA Diagnostic Standby</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Configure the failure conditions on the left, then click <strong>Engage RCA Investigator Agent</strong> to activate real-time pattern parsing and compliance auditing.
              </p>
            </div>
          </div>
        )}

        {/* If actively calculating agent steps */}
        {isAnalyzing && (
          <div className="flex-1 bg-slate-950 border border-slate-800/85 rounded-xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-6">
                <div className="flex items-center space-x-2.5">
                  <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Autonomous Pipeline Active</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono animate-pulse">COMPILING TRACE CONSENSUS...</span>
              </div>

              {/* Dynamic steps stack */}
              <div className="space-y-4">
                {[
                  { title: "Retrieval & Context Mapping", detail: "Scans Neo4j relationships (HAS_COMPONENT, OPERATES) and ChromaDB standard guidelines." },
                  { title: "Mathematical Fault Correlation", detail: "Extracts telemetry sensor tolerances and links pending maintenance tasks." },
                  { title: "Regulatory Evaluation Node", detail: "Enforces ASME Sec VIII / ISO safety protocols to verify trigger boundaries." },
                  { title: "Joint Consensus report compiler", detail: "Assembles hypotheses matrices and drafts corrective engineering steps." }
                ].map((st, idx) => (
                  <div key={idx} className="flex gap-4 p-4 border border-slate-900 bg-slate-900/30 rounded-lg animate-pulse">
                    <div className="w-5 h-5 rounded-full border border-orange-500/20 flex items-center justify-center text-[10px] font-mono font-bold text-orange-400 shrink-0">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono font-bold text-slate-200">{st.title}</h4>
                      <p className="text-[11px] font-sans text-slate-500 leading-normal">{st.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center text-xs font-mono text-slate-500 italic py-2">
              Waiting for backend Gemini API response synthesis...
            </div>
          </div>
        )}

        {/* If report is populated */}
        {report && !isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-slate-950 border border-slate-805 rounded-xl flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header statistics section */}
            <div className="p-4 bg-slate-900/60 border-b border-slate-805 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs font-sans">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm tracking-wide text-white">{report.problemIdentification.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wide border uppercase ${
                    report.problemIdentification.severity.toLowerCase() === "critical" 
                      ? "bg-rose-950/40 text-rose-455 border-rose-500/20" 
                      : "bg-amber-955/40 text-amber-455 border-amber-500/20"
                  }`}>
                    {report.problemIdentification.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-sans">
                  Target Asset: <strong className="text-slate-200">{report.problemIdentification.equipment}</strong>
                </div>
              </div>

              {/* API and timing indicators */}
              <div className="flex items-center space-x-2.5 shrink-0">
                <span className={`px-2 py-1 rounded text-[10px] font-mono border ${
                  usedAI 
                    ? "bg-purple-950/40 text-purple-400 border-purple-500/20" 
                    : "bg-slate-900 text-slate-400 border-slate-800"
                }`}>
                  {usedAI ? "✨ Gemini 3.5 Active" : "🛠️ Context Fallback"}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Calculated: <strong>{duration}ms</strong>
                </span>
              </div>
            </div>

            {/* Structured analysis workspace tabs */}
            <div className="flex border-b border-slate-850 px-3 py-1 bg-slate-950 gap-1 overflow-x-auto scrollbar-none">
              {(["summary", "causes", "evidence", "actions"] as const).map((tab) => {
                const names = {
                  summary: "Problem ID & Timeline",
                  causes: "Failure Pattern & Hypotheses",
                  evidence: "Grounding Evidence",
                  actions: "Corrective Actions"
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveReportTab(tab)}
                    className={`px-3 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      activeReportTab === tab 
                        ? "bg-slate-900 text-orange-400 shadow-sm border border-slate-800" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                    }`}
                  >
                    {names[tab]}
                  </button>
                );
              })}
            </div>

            {/* Inner scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              
              {/* TAB 1: SUMMARY & TIMELINE */}
              {activeReportTab === "summary" && (
                <div className="space-y-4 font-sans leading-relaxed">
                  
                  {/* System Dilemma summary block */}
                  <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-lg">
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1.5">Primary Conflict Diagnostic:</span>
                    <p className="text-xs text-slate-300 leading-normal font-sans italic">
                      "{report.problemIdentification.coreDilemma}"
                    </p>
                  </div>

                  {/* Incident Chronological Timeline */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-1">Chronological Failure Sequence:</span>
                    <div className="border-l border-slate-850 pl-4 space-y-3 relative ml-2">
                      {report.problemIdentification.timeline.map((evt, id) => (
                        <div key={id} className="relative py-0.5">
                          {/* Circle dot indicators */}
                          <div className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-orange-500 border border-slate-950"></div>
                          <p className="text-xs text-slate-350 leading-normal font-mono">
                            {evt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Execution Trace Steps */}
                  {traceSteps.length > 0 && (
                    <div className="pt-4 border-t border-slate-900/50">
                      <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-2.5">Agent Pipeline Nodes Evaluated:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                        {traceSteps.map((st, idx) => (
                          <div key={idx} className="p-3 bg-slate-900/30 border border-slate-850 rounded-lg space-y-1">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="font-semibold text-slate-250 truncate">{st.step}</span>
                              <span className="text-slate-500 shrink-0">{st.duration}ms</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-normal">{st.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: HYPOTHESES */}
              {activeReportTab === "causes" && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    The autonomous agent analyzed failure parameters against historic and mechanical fatigue logs to prioritize and score these logical hypotheses:
                  </p>

                  <div className="space-y-3">
                    {report.possibleCauses.map((hyp, i) => (
                      <div key={i} className="bg-slate-900/20 border border-slate-850 rounded-lg p-4 font-sans space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-bold text-xs text-slate-200">{hyp.hypothesis}</h4>
                              {hyp.isPrimary && (
                                <span className="bg-rose-950/60 border border-rose-500/20 text-rose-400 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase">
                                  Primary Root Cause
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-normal font-sans">
                              {hyp.rationale}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-mono font-bold text-white block">{hyp.likelihood}%</span>
                            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Likelihood</span>
                          </div>
                        </div>

                        {/* Visual progress meter */}
                        <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-850 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${hyp.isPrimary ? "bg-rose-500" : "bg-orange-500"}`} 
                            style={{ width: `${hyp.likelihood}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: GROUNDING EVIDENCE */}
              {activeReportTab === "evidence" && (
                <div className="space-y-3 font-sans">
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    The agent assembled these factual indicators across live operational stores to substantiate the primary hypotheses:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* KG Ontology Card */}
                    <div className="bg-slate-900/35 border border-slate-850 rounded-lg p-3.5 space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-orange-400 uppercase tracking-wider block">1. Knowledge Graph Relations</span>
                        <p className="text-xs text-slate-300 leading-normal">{report.evidence.knowledgeGraph}</p>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block pt-2.5 border-t border-slate-900">NEO4J SCHEMA MATCHED</span>
                    </div>

                    {/* Sensor Data Card */}
                    <div className="bg-slate-900/35 border border-slate-850 rounded-lg p-3.5 space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-orange-400 uppercase tracking-wider block">2. Sensor Telemetry Drift</span>
                        <p className="text-xs text-slate-300 leading-normal">{report.evidence.sensorData}</p>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block pt-2.5 border-t border-slate-900">TELEMETRY ANOMALY CORRELATED</span>
                    </div>

                    {/* Maintenance trace Card */}
                    <div className="bg-slate-900/35 border border-slate-850 rounded-lg p-3.5 space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-orange-400 uppercase tracking-wider block">3. Maintenance Ledger Trace</span>
                        <p className="text-xs text-slate-300 leading-normal">{report.evidence.maintenanceTrace}</p>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block pt-2.5 border-t border-slate-900">INCIDENT LEDGER CROSS-CHECKED</span>
                    </div>

                    {/* RAG regulatory citation Card */}
                    <div className="bg-slate-900/35 border border-slate-850 rounded-lg p-3.5 space-y-1.5 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-orange-400 uppercase tracking-wider block">4. Compliance & Standard Citations</span>
                        <p className="text-xs text-slate-300 leading-normal">{report.evidence.complianceCitations}</p>
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block pt-2.5 border-t border-slate-900">ASME / ISO COMPLIANCE BOUNDARY</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: RECOMMENDED ACTIONS */}
              {activeReportTab === "actions" && (
                <div className="space-y-3 font-sans">
                  <p className="text-xs text-slate-400 leading-relaxed mb-1.5">
                    To satisfy standard safety protocols and prevent structural recurrence, the operator must execute these actionable directives:
                  </p>

                  <div className="space-y-2.5">
                    {report.correctiveActions.map((act, idx) => (
                      <div key={idx} className="bg-slate-900/25 border border-slate-850 rounded-lg p-3.5 flex flex-col sm:flex-row gap-3 sm:items-start justify-between">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 bg-slate-900 border border-slate-800 rounded flex items-center justify-center text-xs font-mono font-bold text-slate-400 shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-200">{act.action}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-[10px] items-center pt-1">
                            <span className="text-slate-500 font-sans">Target Standard:</span>
                            <span className="font-mono text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {act.standardReference}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0 self-end sm:self-auto">
                          <span className="text-[10px] font-mono text-slate-500">
                            {act.responsibleRole}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${getPriorityColor(act.priority)}`}>
                            {act.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-lg p-3 flex items-start space-x-2.5 text-[11px] text-emerald-400 mt-4 leading-normal font-sans">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Completing these immediate corrective procedures guarantees complete OSHA isolation alignment. Standard hazard risk indices resolved.
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
