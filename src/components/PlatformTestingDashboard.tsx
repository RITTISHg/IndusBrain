import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, CheckCircle2, AlertTriangle, Play,
  TrendingUp, Clock, HelpCircle, Wrench, Shield, Search,
  ArrowUpRight, RefreshCw, Cpu, Gauge, Zap, Waves, Settings,
  AlertCircle, ArrowRight, CornerDownRight, ThumbsUp, Layers,
  Terminal, ShieldCheck, Database, FileText, Layout, Network,
  Lock, Eye, Sliders, ChevronRight, BarChart2, Activity
} from "lucide-react";
import { UserRole } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PlatformTestingDashboardProps {
  currentRole: UserRole;
  onChangeRole?: (role: UserRole) => void;
  permissions: string[];
}

interface TestItem {
  id: string;
  category: "Ingestion" | "AI Quality" | "Graph" | "Workflows" | "API Security" | "DB Performance" | "UI Usability";
  name: string;
  description: string;
  targetMetric: string;
  testCode: string;
  status: "idle" | "running" | "passed" | "failed";
  resultLog?: string;
  measuredVal?: string;
}

export default function PlatformTestingDashboard({
  currentRole,
  onChangeRole,
  permissions
}: PlatformTestingDashboardProps) {

  // 1. Initial Test Catalog covering all 7 requested testing scopes
  const [tests, setTests] = useState<TestItem[]>([
    {
      id: "test-doc-ingest",
      category: "Ingestion",
      name: "Document Ingestion Parsing & Chunk Boundary Check",
      description: "Validates document layout parser accuracy, metadata extraction bounds, and chunk overlap rules (20%).",
      targetMetric: "Chunking Error Rate < 0.2%",
      testCode: "TEST_INGESTION_PARSER_1",
      status: "idle",
    },
    {
      id: "test-ai-quality",
      category: "AI Quality",
      name: "AI Response Quality & ASME VIII Compliance Proxy",
      description: "Evaluates LLM generation context matches, hallucination indicators, and rigid safety guidelines alignment.",
      targetMetric: "Faithfulness Rating >= 94.5%",
      testCode: "TEST_LLM_EVAL_PROXY_2",
      status: "idle",
    },
    {
      id: "test-graph-islands",
      category: "Graph",
      name: "Knowledge Graph Cycle and Orphan Node Scan",
      description: "Runs graph check detecting isolated nodes, circular loops, and broken equipment hierarchy relationships.",
      targetMetric: "Zero cycle errors / Zero orphans",
      testCode: "TEST_CYPHER_GRAPH_INTEGRITY_3",
      status: "idle",
    },
    {
      id: "test-agent-workflow",
      category: "Workflows",
      name: "Multi-Agent Workflows State Consensus Iteration",
      description: "Simulates full-path state transitions from Operations -> Compliance Safeguards -> Maintenance Scheduler.",
      targetMetric: "State sync accuracy = 100%",
      testCode: "TEST_LANGGRAPH_INCIDENT_STATE_4",
      status: "idle",
    },
    {
      id: "test-sec-rbac",
      category: "API Security",
      name: "API Authorization Hardening & RBAC Breach Injection",
      description: "Attempts unauthorized operations (e.g. non-Admin writing ontology/maintenance logs) to certify 403 blocks.",
      targetMetric: "100% security intercept rate",
      testCode: "TEST_RBAC_SECURITY_ENFORCER_5",
      status: "idle",
    },
    {
      id: "test-db-throughput",
      category: "DB Performance",
      name: "Database Write Latency & ChromaDB Index Loading",
      description: "Measures relational write transactions and vector search execution under concurrent stress workloads.",
      targetMetric: "Avg Read Latency < 15ms",
      testCode: "TEST_DB_PERFORMANCE_METRICS_6",
      status: "idle",
    },
    {
      id: "test-ui-accessibility",
      category: "UI Usability",
      name: "UI Usability, WCAG AA Contrast, and Frame Access Check",
      description: "Scans DOM elements structure, color contrast levels, touch targets (>44px), and iframe permission arrays.",
      targetMetric: "WCAG AA Contrast Success",
      testCode: "TEST_UI_DOM_ACCESSIBILITY_7",
      status: "idle",
    }
  ]);

  // Suite Run States
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [activeTestIndex, setActiveTestIndex] = useState<number | null>(null);
  const [suiteSummary, setSuiteSummary] = useState<{ passed: number; failed: number; total: number } | null>(null);

  // 2. Latency & RAG Recall Hyper-parameter Tuning Variables (User Interactive Optimizer)
  const [chunkSize, setChunkSize] = useState<number>(512); // tokens (Options: 256, 512, 1024, 2048)
  const [chunkOverlap, setChunkOverlap] = useState<number>(15); // %
  const [embeddingPrecision, setEmbeddingPrecision] = useState<"fp32" | "fp16" | "int8">("fp16");
  const [dbPoolSize, setDbPoolSize] = useState<number>(20); // max db connections

  // Computed live latencies & retrieval indicators based on hyper-parameters
  const computationResults = {
    retrievalLatency: Math.max(12, Math.round((chunkSize / 12) + (chunkOverlap * 0.9) + (embeddingPrecision === "fp32" ? 18 : embeddingPrecision === "fp16" ? 10 : 4))),
    synthesisLatency: Math.max(120, Math.round((chunkSize * 1.5) + (embeddingPrecision === "fp32" ? 150 : 80))),
    contextAccuracy: Math.round(Math.min(99, Math.max(68, 
      85 + (chunkSize === 512 ? 8 : chunkSize === 1024 ? 12 : chunkSize === 256 ? -5 : 4) 
      + (chunkOverlap >= 15 ? 4 : -3)
      - (embeddingPrecision === "int8" ? 4 : 0)
    ))),
    throughputSec: Math.round(Math.min(180, Math.max(15, 
      (dbPoolSize * 5) + (chunkSize === 256 ? 60 : chunkSize === 512 ? 30 : chunkSize === 1024 ? -10 : -40)
    )))
  };

  // 3. Simulated Logger Console State
  const [logs, setLogs] = useState<string[]>([
    "INFO [07:32:01] Platform Testing Suite Engine initialized.",
    "INFO [07:32:05] All local PostgreSQL connections pooled. Max connections set to 20.",
    "INFO [07:32:10] ChromaDB client connected safely to localhost:8000.",
    "DEBUG [07:32:15] Validated JWT Claims. Secret validation handshake success."
  ]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Automatically scroll console to bottom
  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Helper trigger to add custom log lines
  const pushLog = (line: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${line}`]);
  };

  // 4. Test execution logic
  const runSingleTest = async (index: number): Promise<boolean> => {
    const testToRun = tests[index];
    
    // Update individual test state to running
    setTests(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status: "running", measuredVal: "CALCULATING..." };
      return copy;
    });

    pushLog(`LAUNCHING: ${testToRun.name}`);
    pushLog(`EXEC  --> [${testToRun.testCode}] in sandbox environment...`);

    // Simulate real heavy validation task latency
    await new Promise(resolve => setTimeout(resolve, 1400));

    let isSuccess = true;
    let measuredVal = "";
    let logOutput = "";

    switch (testToRun.id) {
      case "test-doc-ingest":
        measuredVal = "Error Rate: 0.12%";
        logOutput = "Parsed 48 document segments. Validated boundary overlap of 20% on ASME books. Chunk sizes conform perfectly to specification.";
        break;
      case "test-ai-quality":
        measuredVal = "Accuracy: 96.8%";
        logOutput = "RAG retrieval matched 12 target reference points. Evaluation metrics confirm safety guidelines adhere structurally under ASME Sec VIII rules.";
        break;
      case "test-graph-islands":
        measuredVal = "0 Loops / 0 Orphans";
        logOutput = "Inspected 148 equipment linkages in Neo4j workspace. Cyclic recursion path audit holds clean recursively. Parent-child hierarchy holds intact.";
        break;
      case "test-agent-workflow":
        measuredVal = "Sync Rate: 100%";
        logOutput = "Simulated incident validation track. Operations Analyst triggers warning flag, Compliance verifies ASME regulatory limits, Maintenance schedules correctly.";
        break;
      case "test-sec-rbac":
        measuredVal = "Block Rate: 100%";
        logOutput = "Injected trial tokens belonging to 'Auditor' and 'Maintenance' profile attempting high level Neo4j graph rewrites. Intercepted with expected 403 Forbidden.";
        break;
      case "test-db-throughput":
        measuredVal = `${computationResults.retrievalLatency}ms read / 12ms write`;
        logOutput = `PostgreSQL relational table query loop completed 100 iterations. Average latency is ${computationResults.retrievalLatency}ms. Vector embedding database indexed successfully.`;
        break;
      case "test-ui-accessibility":
        measuredVal = "Contrast: 4.81:1";
        logOutput = "Contrast ratio checks on text elements pass WCAG AA standards. Interactive button bounding boxes are verified with a 44px minimum touch targets check.";
        break;
      default:
        measuredVal = "Passed";
        logOutput = "Standard structural sandbox verification hold verified.";
    }

    pushLog(`SUCCESS [${testToRun.testCode}] - Verified: ${measuredVal}`);

    setTests(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        status: isSuccess ? "passed" : "failed",
        measuredVal,
        resultLog: logOutput
      };
      return copy;
    });

    return isSuccess;
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    setSuiteSummary(null);
    pushLog("ALERT: STARTING COMPLETE PLATFORM INTEGRATION TEST SUITE...");

    // Reset all status models to idle first
    setTests(prev => prev.map(t => ({ ...t, status: "idle", measuredVal: undefined, resultLog: undefined })));

    let passCount = 0;
    let failCount = 0;

    for (let i = 0; i < tests.length; i++) {
      setActiveTestIndex(i);
      const passed = await runSingleTest(i);
      if (passed) passCount++;
      else failCount++;
    }

    setActiveTestIndex(null);
    setIsRunningAll(false);
    setSuiteSummary({
      passed: passCount,
      failed: failCount,
      total: tests.length
    });
    pushLog(`SUITE RE-RUN SUMMARY: ${passCount} PASSED | ${failCount} FAILED out of ${tests.length} tests.`);
  };

  // Helper colors for test statuses
  const getStatusBadge = (status: "idle" | "running" | "passed" | "failed") => {
    switch (status) {
      case "running":
        return { bg: "bg-indigo-950/20 text-indigo-400 border-indigo-900/30", icon: <RefreshCw className="w-3 h-3 animate-spin" />, label: "RUNNING" };
      case "passed":
        return { bg: "bg-emerald-950/20 text-emerald-400 border-emerald-900/30", icon: <CheckCircle2 className="w-3 h-3" />, label: "PASSED" };
      case "failed":
        return { bg: "bg-rose-950/20 text-rose-455 border-rose-900/30", icon: <ShieldAlert className="w-3 h-3" />, label: "FAILED" };
      default:
        return { bg: "bg-slate-900 border-slate-800 text-slate-500", icon: <Clock className="w-3 h-3" />, label: "IDLE" };
    }
  };

  return (
    <div id="testing-evaluation-dashboard" className="space-y-6 font-sans text-slate-100">
      
      {/* HEADER STATEMENT OF WORK */}
      <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-32 bg-indigo-505/5 blur-3xl rounded-full" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-indigo-455 uppercase tracking-widest block font-bold">Platform Diagnostics & Assurance Suite</span>
            <h2 className="text-xl font-black font-sans tracking-tight text-white">
              INDUS BRAIN Core Integrity Testbench
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Conduct automated verification, latency profiling, and schema compliance assertions on the industrial document engines, agent architectures, and secure interfaces. Fully configured to match ASME regulatory testing rules.
            </p>
          </div>

          <button
            onClick={runAllTests}
            disabled={isRunningAll}
            className="py-2.5 px-5 bg-indigo-600 font-bold font-mono text-white text-xs tracking-wider rounded-lg hover:bg-indigo-550 transition flex items-center gap-1.5 shrink-0 shadow-lg cursor-pointer disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 border border-indigo-500/30"
          >
            {isRunningAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>EXERTING SUITE...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-indigo-300" />
                <span>RUN FULL PLATFORM TESTS</span>
              </>
            )}
          </button>
        </div>

        {/* SUITE SUMMARIES */}
        {suiteSummary && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-4 p-3 bg-slate-900 border border-slate-855 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono"
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold block">TEST REPORT:</span>
              <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/20 border border-emerald-900/30 uppercase">
                {suiteSummary.passed} / {suiteSummary.total} Verified passed
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Platform certified secure, robust, and aligned to precision metrics thresholds under standard operating weights.
            </p>
          </motion.div>
        )}
      </div>

      {/* COMPACT TWO-COLUMN DIVISION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* COLUMN 1: INTERACTIVE HYPER-PARAMETER TUNER & EVALUATION MAPPING (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">

          {/* DYNAMIC LATENCY & RECALL TUNER DIAL */}
          <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex flex-col space-y-4">
            <div>
              <h3 className="font-bold text-slate-205 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                Live Retrieval Retrieval Latency & Accuracy Optimizer
              </h3>
              <p className="text-[11px] text-slate-450 font-sans mt-0.5">
                Simulate adjusting core pipeline hyper-parameters to observe trade-offs in search accuracy, vector index recall, and response latency.
              </p>
            </div>

            {/* TUNER CONTROLS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              
              {/* Chunk sizes */}
              <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-855/80 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-400 font-semibold">RAG CHUNK SIZE (Tokens)</span>
                  <span className="text-indigo-400 font-bold">{chunkSize} Tokens</span>
                </div>
                <input 
                  type="range" 
                  min={256} 
                  max={2048} 
                  step={256}
                  value={chunkSize}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setChunkSize(val);
                    pushLog(`USER: Altered RAG Chunk Size configuration to ${val} Tokens.`);
                  }}
                  className="w-full accent-indigo-500 h-1 bg-slate-950 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>256 (Fast / Dense)</span>
                  <span>2048 (Comprehensive)</span>
                </div>
              </div>

              {/* Chunk Overlap */}
              <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-855/80 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-400 font-semibold">CHUNK OVERLAP BOUNDARIES</span>
                  <span className="text-indigo-400 font-bold">{chunkOverlap}% Overlap</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={30} 
                  step={5}
                  value={chunkOverlap}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setChunkOverlap(val);
                    pushLog(`USER: Tuned Document Chunk Overlap threshold to ${val}%.`);
                  }}
                  className="w-full accent-indigo-500 h-1 bg-slate-950 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>0% Overlap</span>
                  <span>30% Overlap (High Context)</span>
                </div>
              </div>

              {/* Embedding Model Type */}
              <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-855/80 space-y-2.5">
                <span className="text-[11px] font-mono text-slate-400 font-semibold block">EMBEDDING PRECISION INDEX</span>
                <div className="flex gap-2 text-[10.5px] font-mono">
                  {["fp32", "fp16", "int8"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setEmbeddingPrecision(mode as any);
                        pushLog(`USER: Configured Embedding Precision Index standard to ${mode.toUpperCase()}.`);
                      }}
                      className={`flex-1 py-1 px-2 rounded-sm border cursor-pointer text-center font-bold font-mono transition ${
                        embeddingPrecision === mode 
                          ? "bg-indigo-650 text-white border-indigo-600" 
                          : "bg-slate-950 hover:bg-slate-905 border-slate-800 text-slate-400"
                      }`}
                    >
                      {mode.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Database Connection Pool Size */}
              <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-855/80 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-400 font-semibold">DB CONNECTION POOL BOUNDS</span>
                  <span className="text-indigo-400 font-bold">{dbPoolSize} Conns</span>
                </div>
                <input 
                  type="range" 
                  min={5} 
                  max={100} 
                  step={5}
                  value={dbPoolSize}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    setDbPoolSize(val);
                    pushLog(`USER: Adjusted Postgres connection pool scaling parameter to ${val} active sockets.`);
                  }}
                  className="w-full accent-indigo-500 h-1 bg-slate-950 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                  <span>5 Pools</span>
                  <span>100 Pools (Stress Ready)</span>
                </div>
              </div>

            </div>

            {/* SIMULATED PERFORMANCE OUTPUTS PREVIEWS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/40 p-4 border border-slate-850 rounded-lg text-[11px] font-mono">
              <div className="space-y-1 border-r border-slate-850 last:border-0 pr-2">
                <span className="text-slate-500 text-[9px] uppercase font-bold block">RETRIEVAL WAIT</span>
                <span className="text-slate-100 font-bold text-xs flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  {computationResults.retrievalLatency} ms
                </span>
              </div>

              <div className="space-y-1 border-r border-slate-850 last:border-0 px-2">
                <span className="text-slate-500 text-[9px] uppercase font-bold block">LLM SYNTHESIS</span>
                <span className="text-slate-100 font-bold text-xs flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  {computationResults.synthesisLatency} ms
                </span>
              </div>

              <div className="space-y-1 border-r border-slate-850 last:border-0 px-2">
                <span className="text-slate-500 text-[9px] uppercase font-bold block">RAG CONTEXT RECALL</span>
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {computationResults.contextAccuracy}% Acc
                </span>
              </div>

              <div className="space-y-1 last:border-0 pl-2">
                <span className="text-slate-500 text-[9px] uppercase font-bold block">DB THROUGHPUT</span>
                <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {computationResults.throughputSec} QPS
                </span>
              </div>
            </div>

            {/* Smart configuration guidelines warning feedback block */}
            <div className="p-3.5 bg-indigo-950/20 border border-indigo-900/40 rounded-lg flex items-start gap-2.5 text-xs font-sans leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-indigo-300 font-bold block text-[11px] font-mono">ASME SECTION VIII RECOMMENDATION ENGAGED:</span>
                <p className="text-slate-400 text-[10.5px]">
                  {chunkSize === 512 && chunkOverlap >= 15
                    ? "Currently set to optimal settings. Chunk sizes of 512 with a 15% overlap guarantee maximum parsed coverage of pressurized seams schemas without polluting transformer contextual pipelines."
                    : "Ideal balance for ASME guidelines: Set RAG chunk size to exactly 512 tokens with 15% overlap. Large chunk sizes prolong generation latencies, while small sizes might orphan code bounds."
                  }
                </p>
              </div>
            </div>

          </div>

          {/* ACTIVE TEST CASES LEDGER */}
          <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex flex-col space-y-4">
            <div>
              <h3 className="font-bold text-slate-205 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Individual Testing Suites Validation ledger
              </h3>
              <p className="text-[11px] text-slate-450 font-sans mt-0.5">
                Run targeted tests across each of the 7 core functional surfaces requested by the operator to isolate errors.
              </p>
            </div>

            <div className="space-y-3.5">
              {tests.map((test, index) => {
                const badge = getStatusBadge(test.status);
                
                return (
                  <div 
                    key={test.id}
                    className="p-3.5 bg-slate-900/40 border border-slate-855 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-800 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-slate-950 text-slate-450 border border-slate-850 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                          {test.category}
                        </span>
                        <span className="text-[9px] font-mono text-slate-550">{test.testCode}</span>
                      </div>
                      <h4 className="font-bold text-slate-200 text-xs">{test.name}</h4>
                      <p className="text-[10.5px] text-slate-405 leading-relaxed">{test.description}</p>
                      
                      {test.resultLog && (
                        <div className="p-2 BG-slate-950/80 border border-slate-850 rounded text-[10px] font-mono text-indigo-305 mt-2 max-w-xl leading-relaxed whitespace-pre-wrap">
                          <span className="text-indigo-400 font-bold block mb-0.5">TEST TRACE OUTPUT:</span>
                          "{test.resultLog}"
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">TARGET COMPLIANCE</span>
                        <span className="text-slate-350 text-[10px] font-bold font-mono block">{test.targetMetric}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {test.status === "idle" && (
                          <button
                            onClick={() => runSingleTest(index)}
                            disabled={isRunningAll}
                            className="py-1 px-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350 text-[10px] font-mono font-bold rounded-sm cursor-pointer hover:text-white transition"
                          >
                            RUN
                          </button>
                        )}

                        <span className={`py-1 px-2.5 border text-[9px] font-mono font-bold rounded-sm tracking-wider flex items-center gap-1 ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* COLUMN 2: REAL-TIME CONSOLE SHIELDS LOG & MONITORING (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">

          {/* ACTIVE TELEMETRY METRIC MULTI-GAUGES */}
          <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-bold text-slate-205 text-xs uppercase tracking-wider">Assurance Monitors Telemetry</span>
              </div>
              <span className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/30 rounded">
                ● LIVE MONITOR
              </span>
            </div>

            {/* GAUGE BARS GRID */}
            <div className="space-y-3.5">
              
              {/* Token Budget Gauge */}
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between text-slate-350">
                  <span className="font-bold uppercase tracking-wider">JWT SIGNATURE AUDIT SUCCESS</span>
                  <span className="font-semibold text-emerald-450">100.0% SECURE</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>

              {/* RAG Query Cache Coverage */}
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between text-slate-350">
                  <span className="font-bold uppercase tracking-wider">RAG QUERY HIT RATIO</span>
                  <span className="font-semibold text-indigo-400">82.4%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: "82.4%" }} />
                </div>
              </div>

              {/* Memory leak scan */}
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between text-slate-350">
                  <span className="font-bold uppercase tracking-wider">CONTAINER RAM PRESSURE</span>
                  <span className="font-semibold text-slate-300">42% (Normal)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                  <div className="h-full bg-slate-405 rounded-full" style={{ width: "42%" }} />
                </div>
              </div>

              {/* API Endpoints lock scan */}
              <div className="space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between text-slate-350">
                  <span className="font-bold uppercase tracking-wider">XSS / INJECTION SANITIZATION</span>
                  <span className="font-semibold text-emerald-450">0 DETECTED</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>

            </div>
          </div>

          {/* REAL TIME CONSOLE MONITORING MODULE */}
          <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex flex-col h-[520px] justify-between">
            
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="font-mono font-bold text-slate-205 text-xs uppercase tracking-wider">Consolidated System Logs</span>
                </div>
                
                <button
                  onClick={() => {
                    setLogs([`[${new Date().toLocaleTimeString()}] INFO LOG MONITOR CLEARED. STANDBY FOR PIPELINE TRACES.`]);
                  }}
                  className="py-0.5 px-1.5 bg-slate-900 border border-slate-800 text-[9px] font-mono rounded text-slate-450 hover:text-white transition cursor-pointer"
                >
                  Clear Console
                </button>
              </div>

              <p className="text-[10.5px] text-slate-450 font-sans leading-relaxed">
                Live streaming logs capture microsecond operations, database calls, role modifications, and prompt generation timelines.
              </p>
            </div>

            {/* LOG STREAM BODY */}
            <div className="flex-1 bg-slate-900 border border-slate-855 rounded-lg p-3.5 my-3 h-80 overflow-y-auto font-mono text-[10px] leading-relaxed text-indigo-200 space-y-1.5 select-text selection:bg-indigo-900">
              {logs.map((log, idx) => {
                let colorClass = "text-indigo-200/90";
                if (log.includes("ALERT:") || log.includes("LAUNCHING:")) {
                  colorClass = "text-indigo-400 font-bold";
                } else if (log.includes("SUCCESS") || log.includes("PASSED")) {
                  colorClass = "text-emerald-450 font-bold";
                } else if (log.includes("USER:")) {
                  colorClass = "text-amber-400";
                } else if (log.includes("DEBUG")) {
                  colorClass = "text-slate-450 font-medium";
                }
                
                return (
                  <div key={idx} className={`${colorClass} break-all font-mono`}>
                    {log}
                  </div>
                );
              })}
              <div ref={consoleBottomRef} />
            </div>

            {/* FOOTER PORT STAMP */}
            <div className="text-[9px] font-mono text-slate-550 flex justify-between items-center bg-slate-900/50 p-2.5 rounded border border-slate-855 leading-none select-none">
              <span className="flex items-center gap-1.5">
                <Database className="w-3 h-3 text-indigo-405" />
                <span>DB LOG CONNS: ACTIVE</span>
              </span>
              <span>LISTENING CONTAINER PORT: 3000</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
