import React, { useState } from "react";
import { 
  Cpu, RotateCcw, AlertTriangle, ShieldCheck, UserCheck, Play, 
  Activity, ChevronRight, CheckCircle, Loader2, Lock, Sparkles, 
  ArrowRight, Database, FileCheck, Network, CornerDownRight, Info, Plus
} from "lucide-react";
import { AgentStep, UserRole } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AgentWorkflowProps {
  token: string | null;
  userRole: UserRole;
}

interface GraphTraceNode {
  nodeName: string;
  state: "COMPLETED" | "SKIPPED" | "PENDING" | "RUNNING";
  inputs: any;
  findings: string;
  latencyMs: number;
}

export default function AgentWorkflow({ token, userRole }: AgentWorkflowProps) {
  // Modes: "orchestrator" or "sequential"
  const [workflowMode, setWorkflowMode] = useState<"orchestrator" | "sequential">("orchestrator");

  // Dynamic Orchestrator States
  const [orchestratorQuery, setOrchestratorQuery] = useState(
    "Boiler B-201 experienced steam pressure spike of 14.2 Bar. Identify the root cause, verify ASME compliance rules, check similar historical lessons, and construct operational guidelines."
  );
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestratorResult, setOrchestratorResult] = useState<{
    activeAgents: string[];
    graphTrace: GraphTraceNode[];
    synthesis: string;
    totalLatencyMs: number;
  } | null>(null);
  const [selectedTraceNode, setSelectedTraceNode] = useState<GraphTraceNode | null>(null);

  // Sequential Simulator States
  const [telemetryId, setTelemetryId] = useState("TEL-2489");
  const [alertMessage, setAlertMessage] = useState(
    "Boiler B-201 structural Steam Overpressure reported (14.2 Bar gauge) - Sensor S-Boiler-P1 flashing critical red."
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [finalAssessment, setFinalAssessment] = useState("");
  const [workflowStatus, setWorkflowStatus] = useState("");

  const hasDiagnosePermission = userRole !== UserRole.Auditor;

  const incidentOptions = [
    {
      id: "inc-1",
      name: "Boiler B-201 Overpressure Event",
      alert: "Boiler B-201 structural Steam Overpressure reported (14.2 Bar gauge) - Sensor S-Boiler-P1 flashing critical red.",
      telemetry: "TEL-2489",
      prompt: "Boiler B-201 experienced steam pressure spike of 14.2 Bar. Identify the root cause, verify ASME compliance rules, check similar historical lessons, and construct operational guidelines."
    },
    {
      id: "inc-2",
      name: "Thermocouple Temperature Spike",
      alert: "Sensor S-Boiler-T1 registering anomalous temperature reading of 435C. Exceeds warning thresholds.",
      telemetry: "TEL-8012",
      prompt: "Sensor S-Boiler-T1 registering temperature spike of 435C on turbine GT-400 bearings. Analyze thermal breakdown, verify ISO risk limits, and find past bearing memory logs."
    },
    {
      id: "inc-3",
      name: "Valve Actuator Unresponsive Fault",
      alert: "Safety Valve V-101 fail-safe feedback reporting mechanical spring jam during quarterly automatic check run.",
      telemetry: "TEL-4091",
      prompt: "Safety Valve V-101 reported spring mechanical jam. Diagnose root cause springs stiffness, verify OSHA worker safety requirements, and recommend operational bypass instructions."
    }
  ];

  const selectIncident = (inc: typeof incidentOptions[0]) => {
    setTelemetryId(inc.telemetry);
    setAlertMessage(inc.alert);
    setOrchestratorQuery(inc.prompt);
    
    // Clear results
    setSteps([]);
    setFinalAssessment("");
    setWorkflowStatus("");
    setActiveStep(null);
    setOrchestratorResult(null);
    setSelectedTraceNode(null);
  };

  // Launch the true dynamic LangGraph orchestrator
  const runLangGraphOrchestrator = async () => {
    if (!hasDiagnosePermission) return;
    setIsOrchestrating(true);
    setOrchestratorResult(null);
    setSelectedTraceNode(null);

    try {
      const resp = await fetch("/api/agents/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({ query: orchestratorQuery })
      });

      const data = await resp.json();
      if (resp.ok && data.success) {
        setOrchestratorResult({
          activeAgents: data.activeAgents,
          graphTrace: data.graphTrace,
          synthesis: data.synthesis,
          totalLatencyMs: data.totalLatencyMs
        });
        // Select the first node by default for user review
        if (data.graphTrace && data.graphTrace.length > 0) {
          setSelectedTraceNode(data.graphTrace[0]);
        }
      } else {
        alert(`Orchestration error: ${data.error || "Failed dynamic dispatch"}`);
      }
    } catch (e: any) {
      console.error("Orchestration network error:", e);
    } finally {
      setIsOrchestrating(false);
    }
  };

  // Pre-configured sequential diagnostic simulation
  const startSequentialWorkflow = async () => {
    if (!hasDiagnosePermission) return;
    setIsRunning(true);
    setSteps([]);
    setFinalAssessment("");
    setWorkflowStatus("Starting...");
    
    try {
      setActiveStep(0);
      setWorkflowStatus("Operations Analyst Active");
      await new Promise(r => setTimeout(r, 800));

      setActiveStep(1);
      setWorkflowStatus("Safety & Risk Assessor Evaluating");
      await new Promise(r => setTimeout(r, 800));

      setActiveStep(2);
      setWorkflowStatus("Compliance Officer Auditing");
      await new Promise(r => setTimeout(r, 800));

      setActiveStep(3);
      setWorkflowStatus("Lead Coordinator Resolving Consensus");
      await new Promise(r => setTimeout(r, 600));

      const resp = await fetch("/api/agents/diagnose", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({ telemetryId, alertMessage })
      });

      const data = await resp.json();
      if (resp.ok) {
        setSteps(data.workflow.steps || []);
        setFinalAssessment(data.workflow.finalAssessment || "Consensus compiled.");
        setWorkflowStatus("Workflow Completed");
        setActiveStep(4);
      } else {
        setWorkflowStatus(`Failed: ${data.error}`);
        setActiveStep(null);
      }
    } catch (e: any) {
      setWorkflowStatus("Workflow Exception: Connection failed");
      setActiveStep(null);
    } finally {
      setIsRunning(false);
    }
  };

  const getNodeIcon = (name: string) => {
    if (name.includes("Router")) return <Network className="w-4 h-4 text-sky-400" />;
    if (name.includes("Copilot")) return <Cpu className="w-4 h-4 text-purple-400" />;
    if (name.includes("Cause") || name.includes("RCA")) return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    if (name.includes("Compliance") || name.includes("Officer")) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    if (name.includes("Lessons") || name.includes("Learned")) return <Database className="w-4 h-4 text-amber-400" />;
    return <Sparkles className="w-4 h-4 text-indigo-400" />;
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "Critical": return "bg-rose-950/60 text-rose-400 border-rose-900/50";
      case "High": return "bg-amber-955/65 text-amber-400 border-amber-900/50";
      case "Medium": return "bg-blue-955/65 text-blue-400 border-blue-900/50";
      default: return "bg-slate-950 text-slate-400 border-slate-800";
    }
  };

  const formatTextWithMD = (text: string) => {
    // Basic formatting helper for simple markdown headers and bullets inside synthesis
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="text-sm font-bold text-slate-200 mt-5 mb-2 border-b border-slate-800/60 pb-1 font-mono tracking-wider text-purple-400 uppercase">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="text-base font-bold text-slate-100 mt-6 mb-3 font-mono tracking-widest text-indigo-400 uppercase">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 pl-2 my-1 leading-relaxed">
            <span className="text-purple-500 font-bold select-none">•</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      if (line.trim().length === 0) return <div key={idx} className="h-2" />;
      return <p key={idx} className="text-xs text-slate-300 leading-relaxed my-1">{line}</p>;
    });
  };

  return (
    <div id="multi-agent-system-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-185px)] min-h-[550px] font-sans text-slate-100">
      
      {/* LEFT SIDEBAR: ACTIVE TELEMETRY CHECKLISTS & SWARM INITIATOR (4 COLS) */}
      <div className="lg:col-span-4 flex flex-col space-y-6 overflow-y-auto pr-1">
        
        {/* Toggle Mode: LangGraph Orchestrator vs Sequential Sim */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 shadow-2xl flex gap-1 select-none">
          <button
            onClick={() => setWorkflowMode("orchestrator")}
            disabled={isOrchestrating || isRunning}
            className={`flex-1 py-2 text-center rounded-lg font-mono text-[10px] tracking-wider font-bold transition-all cursor-pointer ${
              workflowMode === "orchestrator"
                ? "bg-purple-900 text-white shadow-md border-b-2 border-purple-500"
                : "bg-transparent text-slate-450 hover:bg-slate-900"
            }`}
          >
            LANGGRAPH SWARM (LIVE)
          </button>
          
          <button
            onClick={() => setWorkflowMode("sequential")}
            disabled={isOrchestrating || isRunning}
            className={`flex-1 py-2 text-center rounded-lg font-mono text-[10px] tracking-wider font-bold transition-all cursor-pointer ${
              workflowMode === "sequential"
                ? "bg-indigo-900 text-white shadow-md border-b-2 border-indigo-500"
                : "bg-transparent text-slate-450 hover:bg-slate-900"
            }`}
          >
            SEQUENTIAL DIAG (SIM)
          </button>
        </div>

        {/* Selected Incident Template Selector */}
        <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl">
          <h3 className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider mb-3">Pre-registered Asset Anomalies</h3>
          <div className="space-y-2.5">
            {incidentOptions.map(inc => (
              <button
                key={inc.id}
                onClick={() => selectIncident(inc)}
                disabled={isOrchestrating || isRunning}
                className={`w-full text-left p-3.5 border rounded-lg transition-all text-xs font-sans relative overflow-hidden ${
                  (workflowMode === "orchestrator" && orchestratorQuery === inc.prompt) || 
                  (workflowMode === "sequential" && telemetryId === inc.telemetry)
                    ? "bg-purple-950/20 border-purple-800/55 font-semibold"
                    : "bg-slate-900/40 hover:bg-slate-900/90 border-slate-850"
                }`}
              >
                <div className="flex justify-between items-center mb-1.5 relative z-10">
                  <span className="text-slate-200 font-bold text-xs">{inc.name}</span>
                  <span className="text-[9px] font-mono text-purple-400 bg-purple-950/30 border border-purple-900/30 px-1.5 py-0.5 rounded uppercase">
                    {inc.telemetry}
                  </span>
                </div>
                <p className="text-[10px] text-slate-450 leading-relaxed line-clamp-2 font-mono">{inc.alert}</p>
                
                {/* Visual accent if active */}
                {((workflowMode === "orchestrator" && orchestratorQuery === inc.prompt) || 
                  (workflowMode === "sequential" && telemetryId === inc.telemetry)) && (
                  <div className="absolute right-0 bottom-0 top-0 w-1 bg-purple-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Left Control Card */}
        <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-850 mb-3.5">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="font-mono font-bold text-slate-200 text-xs uppercase tracking-wider">Dynamic Control Panel</span>
            </div>

            <AnimatePresence mode="wait">
              {workflowMode === "orchestrator" ? (
                /* ORCHESTRATOR COMPONENT CONTROL */
                <motion.div
                  key="orc-control"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono tracking-wider text-slate-500 uppercase block">ORCHESTRATOR RAW INDUSTRIAL QUERY:</label>
                    <textarea
                      value={orchestratorQuery}
                      onChange={e => setOrchestratorQuery(e.target.value)}
                      disabled={isOrchestrating}
                      rows={5}
                      className="w-full text-xs font-mono border border-slate-850 rounded-lg p-3 bg-slate-900 text-slate-200 focus:outline-none focus:border-purple-500/50 leading-relaxed resize-none"
                    />
                  </div>

                  <button
                    onClick={runLangGraphOrchestrator}
                    disabled={isOrchestrating || !orchestratorQuery.trim() || !hasDiagnosePermission}
                    className="w-full py-3 bg-purple-700 hover:bg-purple-605 disabled:bg-slate-900 disabled:text-slate-600 font-bold font-mono text-white rounded-lg text-[11px] tracking-wider transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg border border-purple-600/25"
                  >
                    {isOrchestrating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>ORCHESTRATING SWARM...</span>
                      </>
                    ) : (
                      <>
                        <Network className="w-4 h-4 text-purple-300" />
                        <span>EXECUTE LANGGRAPH DISPATCH</span>
                      </>
                    )}
                  </button>
                </motion.div>
              ) : (
                /* SEQUENTIAL COMPONENT CONTROL */
                <motion.div
                  key="seq-control"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-mono tracking-wider text-slate-500 block mb-1 uppercase">Selected Asset ID:</label>
                      <input 
                        type="text" 
                        value={telemetryId}
                        onChange={e => setTelemetryId(e.target.value)}
                        disabled={isRunning}
                        className="w-full text-xs font-mono border border-slate-850 rounded-lg p-2.5 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono tracking-wider text-slate-500 block mb-1 uppercase">Active Threat Warning:</label>
                      <textarea 
                        value={alertMessage}
                        onChange={e => setAlertMessage(e.target.value)}
                        disabled={isRunning}
                        rows={3.5}
                        className="w-full text-xs font-mono border border-slate-850 rounded-lg p-2.5 bg-slate-900 text-slate-200 focus:outline-none focus:border-indigo-500/50 leading-relaxed resize-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={startSequentialWorkflow}
                    disabled={isRunning || !alertMessage.trim() || !hasDiagnosePermission}
                    className="w-full py-3 bg-indigo-700 hover:bg-indigo-605 disabled:bg-slate-900 disabled:text-slate-600 font-bold font-mono text-white rounded-lg text-[11px] tracking-wider transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg border border-indigo-600/25"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>DISPATCHING PIPELINE...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-indigo-300 text-indigo-300" />
                        <span>RUN SEQUENTIAL WORKFLOW</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Locked feedback block if auditor role */}
          {!hasDiagnosePermission && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/25 rounded-lg flex items-start gap-2 text-[10px] text-rose-405 font-mono mt-4">
              <Lock className="w-4 h-4 text-rose-505 shrink-0" />
              <span>Diagnostics Restricted: Only 'Admin', 'Engineer', or 'Safety Staff' accounts can run Dynamic Swarms.</span>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT WORKPLACE BOARD: GRAPH STATE RENDERER & ADVISOR LOG WATERFALL (8 COLS) */}
      <div className="lg:col-span-8 flex flex-col h-full space-y-4">
        
        {/* TOP STATUS BAR ACCENTS */}
        <div className="bg-slate-950 border border-slate-805 rounded-xl p-4.5 shadow-2xl flex justify-between items-center select-none">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-purple-950/30 border border-purple-900/30 rounded-lg text-purple-400">
              <Network className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wide">Multi-Agent swarm state machine</h3>
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                {workflowMode === "orchestrator" 
                  ? "LangGraph Routing & Dynamic Context Assembler" 
                  : "Static Multi-Agent Node Sequencing Pipeline"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOrchestrating || isRunning ? "bg-amber-400" : "bg-emerald-400"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isOrchestrating || isRunning ? "bg-amber-500" : "bg-emerald-500"
              }`}></span>
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-450">
              {isOrchestrating 
                ? "Planning Swarm..." 
                : isRunning 
                  ? workflowStatus 
                  : "State Standby"
              }
            </span>
          </div>
        </div>

        {/* WORKPLACE SWITCHED CARD DESIGNS */}
        {workflowMode === "orchestrator" ? (
          
          /* -----------------------------------------------------------------*/
          /* 1. LANGGRAPH ORCHESTRATOR PLAYGROUND                             */
          /* -----------------------------------------------------------------*/
          <div className="flex-1 bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex flex-col space-y-5 overflow-hidden">
            
            {/* If Not Started */}
            {!orchestratorResult && !isOrchestrating && (
              <div className="flex-1 border border-dashed border-slate-850 rounded-xl flex flex-col justify-center items-center text-center p-8">
                <Network className="w-12 h-12 text-slate-800 mb-3 animate-pulse" />
                <h4 className="font-bold font-mono text-xs uppercase tracking-wider text-slate-350">Dynamic LangGraph Orchestrator</h4>
                <p className="text-[11px] text-slate-500 font-mono leading-relaxed max-w-sm mt-1.5">
                  Input an industrial query (e.g. "Turbine secondary bearings spike temperature, and check safety rules") and click dispatch on the left panel.
                </p>
              </div>
            )}

            {/* If actively processing */}
            {isOrchestrating && (
              <div className="flex-1 border border-dashed border-slate-850 rounded-xl flex flex-col justify-center items-center text-center p-8 space-y-3 font-mono">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase text-slate-300">Orchestrator Agent Planning...</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Running sub-agent routing guidelines</p>
                </div>
              </div>
            )}

            {/* Compiled LangGraph Results */}
            {orchestratorResult && !isOrchestrating && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-5">
                
                {/* Visual Graph Trace Flow Container */}
                <div>
                  <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase block mb-3 font-bold">LangGraph Active State Trace (Click node to inspect detail):</span>
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-slate-900/40 p-4 rounded-xl border border-slate-855/80 select-none">
                    {orchestratorResult.graphTrace.map((node, index) => {
                      const isSelected = selectedTraceNode?.nodeName === node.nodeName;
                      const isSkipped = node.state === "SKIPPED";
                      
                      return (
                        <div key={node.nodeName} className="flex flex-col md:flex-row items-center cursor-pointer">
                          
                          {/* Node Card */}
                          <button
                            onClick={() => setSelectedTraceNode(node)}
                            className={`flex flex-col p-2.5 items-center justify-between text-center w-full rounded-lg border transition-all ${
                              isSelected 
                                ? "bg-purple-950/25 border-purple-500/70 shadow-lg shadow-purple-950/40 scale-105" 
                                : isSkipped 
                                  ? "bg-slate-950/30 border-slate-900 opacity-35 hover:opacity-55" 
                                  : "bg-slate-950 hover:bg-slate-900/80 border-slate-850"
                            }`}
                          >
                            <span className={`p-1.5 rounded border mb-1.5 ${
                              isSelected 
                                ? "bg-purple-700/80 text-white border-purple-400/20" 
                                : "bg-slate-900 text-slate-450 border-slate-800"
                            }`}>
                              {getNodeIcon(node.nodeName)}
                            </span>

                            <span className="text-[10px] font-mono leading-none font-bold text-slate-200 truncate max-w-full">
                              {node.nodeName.replace(" Agent", "")}
                            </span>

                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded uppercase mt-2 font-bold tracking-wider ${
                              isSkipped 
                                ? "bg-slate-950 text-slate-600" 
                                : "bg-emerald-950/50 text-emerald-400 border border-emerald-500/10"
                            }`}>
                              {node.state === "COMPLETED" ? `${node.latencyMs}ms` : "SKIPPED"}
                            </span>
                          </button>

                          {/* Connection Arrow (Except last) */}
                          {index < orchestratorResult.graphTrace.length - 1 && (
                            <div className="hidden md:flex flex-1 items-center justify-center text-slate-700 mx-1">
                              <ArrowRight className="w-4 h-4 text-slate-800" />
                            </div>
                          )}

                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Selected Node State Inspection Inspector */}
                {selectedTraceNode && (
                  <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 space-y-2 select-none relative overflow-hidden shrink-0">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 blur-2xl rounded-full" />
                    
                    <div className="flex justify-between items-center relative z-10 border-b border-slate-800/50 pb-2">
                      <div className="flex items-center space-x-2">
                        {getNodeIcon(selectedTraceNode.nodeName)}
                        <span className="text-xs font-mono font-bold text-slate-200">{selectedTraceNode.nodeName} State Data</span>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                        selectedTraceNode.state === "SKIPPED" 
                          ? "bg-slate-950 text-slate-500 border-slate-900" 
                          : "bg-purple-950/40 text-purple-400 border-purple-500/20 uppercase"
                      }`}>
                        State: {selectedTraceNode.state}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs leading-normal relative z-10 font-mono">
                      {/* Node inputs */}
                      <div className="md:col-span-4 p-2 bg-slate-950 border border-slate-850 rounded space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Input Channels:</span>
                        <div className="text-[10px] text-slate-350 overflow-x-auto break-all">
                          {selectedTraceNode.inputs ? (
                            <pre className="font-mono whitespace-pre-wrap">{JSON.stringify(selectedTraceNode.inputs, null, 1)}</pre>
                          ) : (
                            <span className="text-slate-600 block">N/A</span>
                          )}
                        </div>
                      </div>

                      {/* Findings / Output */}
                      <div className="md:col-span-8 p-2 bg-slate-950 border border-slate-850 rounded space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Output Findings Buffer:</span>
                        <p className="text-[10.5px] text-slate-300 leading-relaxed font-sans font-medium italic">
                          "{selectedTraceNode.findings}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SCROLLABLE COMPILED ADVISORY REPORT */}
                <div className="flex-1 bg-slate-900 border border-slate-855 rounded-xl p-5 shadow-inner overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs font-mono">
                    <div className="flex items-center space-x-2 text-slate-455">
                      <FileCheck className="w-4 h-4 text-slate-400" />
                      <span>Unified Corporate Intelligence Synthesis Report</span>
                    </div>
                    <span className="text-slate-500 uppercase">
                      Latency: {(orchestratorResult.totalLatencyMs / 1000).toFixed(2)}s
                    </span>
                  </div>

                  <div className="space-y-4 font-sans max-w-none text-slate-300">
                    {formatTextWithMD(orchestratorResult.synthesis)}
                  </div>
                </div>

              </div>
            )}

          </div>

        ) : (

          /* -----------------------------------------------------------------*/
          /* 2. SEQUENTIAL SIMULATOR VIEW (Backward Compatibility & Detailed Check) */
          /* -----------------------------------------------------------------*/
          <div className="flex-1 bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="overflow-y-auto space-y-5 pr-1 flex-1">
              
              {/* Standby State empty container */}
              {steps.length === 0 && !isRunning && (
                <div className="py-24 text-center border border-dashed border-slate-850 rounded-xl my-4">
                  <Cpu className="w-12 h-12 text-slate-800 mx-auto mb-3 animate-pulse" />
                  <h4 className="font-bold text-slate-300 text-xs uppercase font-mono tracking-wider">Sequential Pipeline Standing By</h4>
                  <p className="text-xs text-slate-500 font-mono max-w-sm mx-auto leading-relaxed mt-1.5">
                    Click "Run Sequential Workflow" on the left dashboard to trigger consecutive analysis steps.
                  </p>
                </div>
              )}

              {/* Running simulator sequence node list */}
              {isRunning && steps.length === 0 && (
                <div className="space-y-4.5 my-4">
                  {[
                    { name: "Operations Analyst", label: "Correlating active telemeter spikes..." },
                    { name: "Safety & Risk Assessor", label: "Resolving thermal bounds explosion equations..." },
                    { name: "Compliance Officer", label: "Auditing ASME Section VIII code compliance guidelines..." },
                    { name: "Lead Coordinator", label: "Logging consolidated mandate details to PostgreSQL AuditLog schema..." }
                  ].map((nodeAgent, idx) => {
                    const isActive = activeStep === idx;
                    const isDone = activeStep !== null && activeStep > idx;

                    return (
                      <div key={nodeAgent.name} className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${
                        isActive 
                          ? "bg-indigo-950/20 border-indigo-500/50" 
                          : isDone 
                            ? "bg-slate-900/60 border-slate-850 opacity-100"
                            : "bg-slate-950/40 border-slate-900/80 opacity-40"
                      }`}>
                        <span className={`p-2.5 rounded-lg border ${
                          isActive 
                            ? "bg-indigo-600 text-white animate-pulse border-indigo-400" 
                            : isDone
                              ? "bg-slate-900 text-emerald-450 border-emerald-950"
                              : "bg-slate-950 text-slate-550 border-slate-850"
                        }`}>
                          {isActive ? <Loader2 className="w-4 h-4 animate-spin" /> : getNodeIcon(nodeAgent.name)}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs font-mono text-slate-200">{nodeAgent.name}</h4>
                          <p className="text-xs text-slate-405 font-mono mt-0.5">{nodeAgent.label}</p>
                          {isActive && (
                            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-indigo-405 font-mono font-bold">
                              <span>PROCESSING DATA SHIELDS</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Fully Resolved Sequence report */}
              {steps.length > 0 && (
                <div className="space-y-4.5 my-4">
                  {steps.map((step, idx) => (
                    <div key={idx} className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-lg p-4.5 shadow-sm flex flex-col md:flex-row md:items-start gap-4 relative">
                      
                      {/* Connection Vertical Connector Line */}
                      {idx < steps.length - 1 && (
                        <div className="hidden md:block absolute left-9 top-14 w-0.5 h-12 bg-slate-850" />
                      )}

                      <span className="p-2.5 bg-slate-950 border border-slate-855 rounded-lg self-start">
                        {getNodeIcon(step.agentName)}
                      </span>

                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-200 text-xs font-mono">{step.agentName}</span>
                          <span className={`px-2.5 py-0.5 border rounded-md text-[9px] font-mono font-bold tracking-wider ${getSeverityBadge(step.severity || "medium")}`}>
                            {step.severity}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-450 font-mono italic leading-relaxed">
                          Thought: "{step.thought}"
                        </p>

                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-855 text-xs text-slate-350 font-mono leading-relaxed">
                          <span className="font-bold text-indigo-400 mr-2 uppercase block text-[9.5px] pb-1 border-b border-slate-850 mb-1 font-mono">Verdict Resolution:</span> 
                          {step.verdict}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assessment Consensus footer footer */}
            {finalAssessment && steps.length > 0 && (
              <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-5 mt-5 flex flex-col sm:flex-row gap-4 items-start shadow-xl shrink-0">
                <span className="p-2.5 bg-indigo-600 text-white rounded-lg shadow-md border border-indigo-500/25">
                  <CheckCircle className="w-5 h-5 animate-bounce" />
                </span>
                <div>
                  <h4 className="font-bold text-indigo-400 text-xs uppercase tracking-wider font-mono">Ledger Consensus Action Complete</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1 font-mono">
                    {finalAssessment}
                  </p>
                  <span className="text-[8px] font-mono text-slate-550 mt-2.5 uppercase tracking-widest block font-bold">SQLITE AUDIT_LOG TRANSACTION RECORD COMMITTED TO PHYSICAL STACK</span>
                </div>
              </div>
            )}
          </div>

        )}

      </div>

    </div>
  );
}
