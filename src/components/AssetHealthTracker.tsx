import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, ShieldAlert, CheckCircle2, AlertTriangle, Play,
  TrendingUp, Clock, HelpCircle, Wrench, Shield, Search,
  ArrowUpRight, RefreshCw, Cpu, Gauge, Zap, Waves, Settings,
  AlertCircle, ArrowRight, CornerDownRight, ThumbsUp, Layers
} from "lucide-react";
import { UserRole } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AssetHealthTrackerProps {
  token: string | null;
  userRole: UserRole;
  onNavigateTab: (tabId: "graph" | "rag" | "agents" | "copilot" | "rca" | "compliance" | "lessons" | "audit" | "maintenance" | "blueprint") => void;
  auditLogs: any[];
  setAuditLogs: React.Dispatch<React.SetStateAction<any[]>>;
  maintenanceTasks: any[];
  setMaintenanceTasks: React.Dispatch<React.SetStateAction<any[]>>;
}

interface TelemetryPoint {
  time: string;
  pressure: number;
  vibration: number;
  temperature: number;
  cavitation: number;
}

export default function AssetHealthTracker({
  token,
  userRole,
  onNavigateTab,
  auditLogs,
  setAuditLogs,
  maintenanceTasks,
  setMaintenanceTasks
}: AssetHealthTrackerProps) {
  // 1. Core Simulation States
  const [selectedAsset, setSelectedAsset] = useState<"boiler" | "turbine" | "valve" | "pump">("boiler");
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1000); // ms update interval
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  
  // Dynamic Asset Specific Param Ranges
  const [boilerPressure, setBoilerPressure] = useState<number>(12.1); // bar (nominal: 11-13)
  const [turbineVibration, setTurbineVibration] = useState<number>(3.2); // mm/s (nominal: 2.5-4.0)
  const [valveFeedbackState, setValveFeedbackState] = useState<"NOMINAL" | "STIFF" | "JAMMED">("STIFF");
  const [pumpCavitation, setPumpCavitation] = useState<number>(0.05); // index (nominal: < 0.15)
  
  // Telemetry buffer state (last 20 reading ticks)
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [tickCount, setTickCount] = useState<number>(0);

  // Time Range filters for telemetry widget
  const [timeWindow, setTimeWindow] = useState<number>(20); // ticks visible on SVG

  // Maintenance dispatch workloads
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<"All" | "Critical" | "High" | "Medium">("All");

  // Local state for Quick Compliancy checks
  const [complianceCheckQuery, setComplianceCheckQuery] = useState("");
  const [complianceAuditResult, setComplianceAuditResult] = useState<string | null>(null);
  const [isAuditingCompliance, setIsAuditingCompliance] = useState(false);

  // Initialize initial history cache
  useEffect(() => {
    const initialHistory: TelemetryPoint[] = [];
    let tempTime = Date.now() - 20000;
    for (let i = 0; i < 20; i++) {
      initialHistory.push({
        time: new Date(tempTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        pressure: parseFloat((11.8 + Math.random() * 0.6).toFixed(2)),
        vibration: parseFloat((3.0 + Math.random() * 0.4).toFixed(2)),
        temperature: parseFloat((305 + Math.random() * 10).toFixed(1)),
        cavitation: parseFloat((0.04 + Math.random() * 0.02).toFixed(3))
      });
      tempTime += 1000;
    }
    setTelemetryHistory(initialHistory);
  }, []);

  // Daemon interval for live sensor stream updates
  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      setTickCount(prev => prev + 1);
      
      setTelemetryHistory(prev => {
        // Base drift computations with safety triggers
        let driftPressure = boilerPressure;
        let driftVibration = turbineVibration;
        let driftCavitation = pumpCavitation;

        // Normal micro deviations
        driftPressure += parseFloat(((Math.random() - 0.5) * 0.15).toFixed(2));
        driftVibration += parseFloat(((Math.random() - 0.5) * 0.08).toFixed(2));
        driftCavitation += parseFloat(((Math.random() - 0.48) * 0.005).toFixed(3));

        // Prevent negative values
        driftPressure = Math.max(1.0, parseFloat(driftPressure.toFixed(2)));
        driftVibration = Math.max(0.1, parseFloat(driftVibration.toFixed(2)));
        driftCavitation = Math.max(0.001, parseFloat(driftCavitation.toFixed(3)));

        // Sync state back is only for small nominal drifts. Large user-initiated spikes persist.
        if (selectedAsset !== "boiler" || boilerPressure < 13.5) {
          setBoilerPressure(driftPressure);
        }
        if (selectedAsset !== "turbine" || turbineVibration < 4.5) {
          setTurbineVibration(driftVibration);
        }
        if (selectedAsset !== "pump" || pumpCavitation < 0.2) {
          setPumpCavitation(driftCavitation);
        }

        const nextPoint: TelemetryPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          pressure: driftPressure,
          vibration: driftVibration,
          temperature: parseFloat((290 + (driftPressure * 10) + Math.random() * 5).toFixed(1)),
          cavitation: driftCavitation
        };

        const trimmed = [...prev.slice(1), nextPoint];
        return trimmed;
      });
    }, simulationSpeed);

    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed, boilerPressure, turbineVibration, pumpCavitation, selectedAsset]);

  // Action: Trigger Boiler Steam Overpressure Spike (Simulate Failure Scenario)
  const triggerPressureSurge = () => {
    setBoilerPressure(14.2);
    // Logging audit action
    const newLog = {
      id: `audit-surge-pressure-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "SCADA_DAEMON",
      role: UserRole.Engineer,
      action: "Simulated Pressure Surge",
      status: "Warning",
      details: "Boiler B-250 steam transducer triggered overpressure simulation flags at 14.2 Bar."
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Action: Trigger Turbine Vibration Radial Deflection Spike
  const triggerVibrationSurge = () => {
    setTurbineVibration(5.4);
    const newLog = {
      id: `audit-surge-vibration-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "SCADA_DAEMON",
      role: UserRole.Engineer,
      action: "Simulated Bearing Deflection",
      status: "Warning",
      details: "Turbine GT-400 radial seismic monitor spiked to 5.4 mm/s radial deflection limits."
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Action: Reset all sensor values back to ideal physical bounds
  const resetSensors = () => {
    setBoilerPressure(12.1);
    setTurbineVibration(3.2);
    setValveFeedbackState("NOMINAL");
    setPumpCavitation(0.05);

    const resetLog = {
      id: `audit-sensor-reset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "SYSTEM_CONTROL",
      role: UserRole.Admin,
      action: "SCADA Monitors Normalization",
      status: "Success",
      details: "Manual operator command recalibrated Boiler, Turbine, Valve feedback monitors to nominal standards."
    };
    setAuditLogs(prev => [resetLog, ...prev]);
  };

  // Helper: Format rating color indicators
  const getSeverityBadge = (score: number, prefix = "") => {
    if (score >= 90) return { bg: "bg-emerald-950/20 text-emerald-400 border-emerald-900/30", label: "NOMINAL", border: "border-emerald-600/30" };
    if (score >= 75) return { bg: "bg-amber-955/20 text-amber-400 border-amber-900/30", label: "MAINT_REQUIRED", border: "border-amber-600/30" };
    return { bg: "bg-rose-950/20 text-rose-450 border-rose-900/30", label: "ALERT_DANGER", border: "border-rose-600/30" };
  };

  // Compute calculated asset health ratings dynamically
  const boilerHealth = Math.max(0, Math.min(100, Math.round(100 - (boilerPressure > 13.5 ? (boilerPressure - 13.5) * 45 : Math.abs(boilerPressure - 12.1) * 8))));
  const turbineHealth = Math.max(0, Math.min(100, Math.round(100 - (turbineVibration > 4.2 ? (turbineVibration - 4.2) * 35 : Math.abs(turbineVibration - 3.2) * 12))));
  const valveHealth = valveFeedbackState === "NOMINAL" ? 100 : valveFeedbackState === "STIFF" ? 78 : 42;
  const pumpHealth = Math.max(0, Math.min(100, Math.round(100 - (pumpCavitation > 0.12 ? (pumpCavitation - 0.12) * 550 : pumpCavitation * 120))));

  const plantHealthScore = Math.round((boilerHealth + turbineHealth + valveHealth + pumpHealth) / 4);

  // SVG Chart Dimensions & Computations
  const chartWidth = 550;
  const chartHeight = 150;
  const padding = 20;

  const getPointsString = (key: keyof TelemetryPoint, minVal: number, maxVal: number) => {
    const subset = telemetryHistory.slice(-timeWindow);
    return subset.map((pt, idx) => {
      const val = pt[key] as number;
      // Map X scale: index over visible ticks
      const x = padding + (idx * (chartWidth - padding * 2)) / (subset.length - 1 || 1);
      // Map Y scale: invert height for coordinates
      const normVal = (val - minVal) / (maxVal - minVal || 1);
      const y = chartHeight - padding - normVal * (chartHeight - padding * 2);
      return `${x},${y}`;
    }).join(" ");
  };

  // Execute immediate safety ASME standards code check inside the widget
  const runASMEComplianceCheck = async () => {
    if (!complianceCheckQuery.trim()) return;
    setIsAuditingCompliance(true);
    setComplianceAuditResult(null);

    try {
      const resp = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({
          message: `Specifically review ASME Section VIII code rules, thermal constraints, or OSHA standards regarding: "${complianceCheckQuery}". Compile a short, 3-sentence formal regulatory audit compliance statement.`
        })
      });

      const data = await resp.json();
      if (resp.ok) {
        setComplianceAuditResult(data.reply);
      } else {
        setComplianceAuditResult("Failed to query central compliance library. Verify sandbox connectivity.");
      }
    } catch {
      setComplianceAuditResult("Compliance gateway offline. Falling back to local ASME code handbook: Safety factor of 3.5 applied to all pressurized steel vessel seams.");
    } finally {
      setIsAuditingCompliance(false);
    }
  };

  // Filter local maintenance tasks lists
  const filteredTasks = maintenanceTasks.filter(t => {
    if (selectedPriorityFilter === "All") return true;
    return t.severity === selectedPriorityFilter;
  });

  return (
    <div id="asset-health-hub" className="space-y-6 font-sans text-slate-100">
      
      {/* SECTION 1: VISUAL KPI STATUS METRIC MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Dynamic Global Health Gauge Card */}
        <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl relative overflow-hidden flex items-center justify-between col-span-1 md:col-span-2">
          <div className="absolute right-0 bottom-0 top-0 w-32 bg-indigo-505/5 blur-3xl rounded-full" />
          
          <div className="space-y-2 leading-none relative z-10">
            <span className="text-[10px] font-mono text-slate-550 uppercase tracking-widest block font-bold">Overall Plant Health Index</span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-black font-mono tracking-tight text-white mb-1">
                {plantHealthScore}%
              </h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${getSeverityBadge(plantHealthScore).bg}`}>
                {getSeverityBadge(plantHealthScore).label}
              </span>
            </div>
            <p className="text-[11px] text-slate-450 leading-relaxed font-sans max-w-xs pt-1">
              Consolidated real-time state index compiled from continuous multi-gauge SCADA telemetry. Nominal standard is ≥88.0%.
            </p>
          </div>

          {/* SVG Circular Dial Graph */}
          <div className="relative w-24 h-24 flex items-center justify-center scale-95 shrink-0">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx={48}
                cy={48}
                r={38}
                className="stroke-slate-850 stroke-8 fill-none"
              />
              <circle
                cx={48}
                cy={48}
                r={38}
                className={`stroke-8 fill-none transition-all duration-700 ${
                  plantHealthScore >= 90 
                    ? "stroke-emerald-500" 
                    : plantHealthScore >= 75 
                      ? "stroke-amber-500" 
                      : "stroke-rose-500"
                }`}
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - plantHealthScore / 100)}`}
              />
            </svg>
            <div className="absolute font-mono text-[11px] font-bold text-slate-350">
              HEALTH
            </div>
          </div>
        </div>

        {/* Diagnostic Simulator Controls Card */}
        <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl col-span-1 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-850">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="font-mono font-bold text-slate-205 text-xs uppercase tracking-wider">Industrial Stress Injector</span>
            </div>
            <button
              onClick={resetSensors}
              className="py-1 px-2.5 bg-slate-900 border border-slate-800 text-[10px] font-mono rounded hover:bg-slate-850 hover:text-white transition cursor-pointer"
            >
              Recalibrate Nominators
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5 pt-3">
            <button 
              onClick={triggerPressureSurge}
              className="p-3 bg-rose-950/10 hover:bg-rose-955/20 border border-rose-900/30 rounded-lg text-left transition text-xs font-mono group cursor-pointer"
            >
              <div className="flex justify-between items-center text-rose-400 font-bold mb-1">
                <span>PRESSURIZE B-201</span>
                <AlertTriangle className="w-3.5 h-3.5 opacity-70 group-hover:animate-bounce" />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal font-sans">Simulate steam accumulation overload at 14.2 Bar limit.</p>
            </button>

            <button 
              onClick={triggerVibrationSurge}
              className="p-3 bg-amber-955/10 hover:bg-amber-955/20 border border-amber-900/30 rounded-lg text-left transition text-xs font-mono group cursor-pointer"
            >
              <div className="flex justify-between items-center text-amber-400 font-bold mb-1">
                <span>DEFLECT GT-400</span>
                <TrendingUp className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal font-sans">Overheat bearings & increase critical dynamic vibration levels.</p>
            </button>
          </div>
        </div>

      </div>

      {/* SECTION 2: INTERACTIVE SCADA TELEMETRY GRID & GRAPH (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 4 PRIMARY ASSET PHYSICAL STATE GAUGES (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-850 px-4 py-3 rounded-xl select-none">
            <span className="text-[10.5px] font-mono font-bold tracking-wider text-slate-350 uppercase">Active Asset Telemeters</span>
            <span className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/30 px-2 py-0.5 border border-emerald-900/30 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              STREAMING
            </span>
          </div>

          {/* Boiler asset card */}
          <button
            onClick={() => setSelectedAsset("boiler")}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
              selectedAsset === "boiler"
                ? "bg-slate-900 border-purple-500/80 shadow-lg shadow-purple-950/20"
                : "bg-slate-950 hover:bg-slate-900/60 border-slate-850"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">PRIMARY PRESSURIZED STRUCTURE</span>
                <h3 className="font-bold text-white text-xs font-mono flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" />
                  Boiler B-201 Steam Vessel
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${getSeverityBadge(boilerHealth).bg}`}>
                {boilerHealth}% HP
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">LIVE PRESSURE</span>
                <span className={`font-bold block text-xs ${boilerPressure > 13.5 ? "text-rose-455 animate-pulse" : "text-slate-200"}`}>
                  {boilerPressure} Bar
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">TEMP MATRIX</span>
                <span className="text-slate-200 font-bold block text-xs">
                  {Math.round(290 + boilerPressure * 10)}°C
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">ASME LIMITS</span>
                <span className="text-slate-400 font-bold block text-xs">13.5 Bar</span>
              </div>
            </div>

            {boilerPressure > 13.5 && (
              <div className="mt-3 py-1 px-2 bg-rose-955/15 border border-rose-900/40 text-rose-400 rounded text-[9px] font-mono flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Overpressure Alert! Run 5-Why diagnostics in RCA Agent panel.</span>
              </div>
            )}
          </button>

          {/* Gas Turbine card */}
          <button
            onClick={() => setSelectedAsset("turbine")}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
              selectedAsset === "turbine"
                ? "bg-slate-900 border-purple-500/80 shadow-lg shadow-purple-950/20"
                : "bg-slate-950 hover:bg-slate-900/60 border-slate-850"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">DYNAMIC COMPONENT GENERATION</span>
                <h3 className="font-bold text-white text-xs font-mono flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Gas Turbine GT-400 Bearing
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${getSeverityBadge(turbineHealth).bg}`}>
                {turbineHealth}% HP
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">RADIAL VIBR</span>
                <span className={`font-bold block text-xs ${turbineVibration > 4.2 ? "text-amber-400 animate-pulse" : "text-slate-200"}`}>
                  {turbineVibration} mm/s
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">DYNAMIC SPEED</span>
                <span className="text-slate-200 font-bold block text-xs">3600 RPM</span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">ISO THRESH</span>
                <span className="text-slate-400 font-bold block text-xs">4.2 mm/s</span>
              </div>
            </div>

            {turbineVibration > 4.2 && (
              <div className="mt-3 py-1 px-2 bg-amber-955/15 border border-amber-900/40 text-amber-400 rounded text-[9px] font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Radial friction abnormal. Check past similar memory logs.</span>
              </div>
            )}
          </button>

          {/* Relief valve card */}
          <button
            onClick={() => setSelectedAsset("valve")}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
              selectedAsset === "valve"
                ? "bg-slate-900 border-purple-500/80 shadow-lg shadow-purple-950/20"
                : "bg-slate-950 hover:bg-slate-900/60 border-slate-850"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">DISCHARGE RELIEF BARRIER</span>
                <h3 className="font-bold text-white text-xs font-mono flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  Relief Valve V-101 (Safety)
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${getSeverityBadge(valveHealth).bg}`}>
                {valveHealth}% HP
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">FEEDBACK STATE</span>
                <span className={`font-bold block text-xs uppercase ${valveFeedbackState !== "NOMINAL" ? "text-amber-405" : "text-emerald-450"}`}>
                  {valveFeedbackState}
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">SPRING STRETCH</span>
                <span className="text-slate-200 font-bold block text-xs">104% Calibration</span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">OSHA DIRECTIVE</span>
                <span className="text-slate-400 font-bold block text-xs">Fail-Safe Vent</span>
              </div>
            </div>

            {valveFeedbackState !== "NOMINAL" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setValveFeedbackState("NOMINAL");
                    // Log
                    const log = {
                      id: `audit-valve-vent-${Date.now()}`,
                      timestamp: new Date().toISOString(),
                      actor: "MANUAL_BYPASS",
                      role: userRole,
                      action: "Reset Valve Latch Spring",
                      status: "Success",
                      details: "Operator dispatched manual bypass test triggering normal calibration lockouts."
                    };
                    setAuditLogs(prev => [log, ...prev]);
                  }}
                  className="py-1 px-2.5 bg-indigo-705/85 text-white hover:bg-indigo-600 rounded text-[9.5px] font-mono transition cursor-pointer"
                >
                  Override & Actuate Valve Spring
                </button>
              </div>
            )}
          </button>

          {/* Centrifugal Pump card */}
          <button
            onClick={() => setSelectedAsset("pump")}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
              selectedAsset === "pump"
                ? "bg-slate-900 border-purple-500/80 shadow-lg shadow-purple-950/20"
                : "bg-slate-950 hover:bg-slate-900/60 border-slate-850"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">FLUID DYNAMICS FEEDBACK</span>
                <h3 className="font-bold text-white text-xs font-mono flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  Feedwater Pump P-302 Impeller
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${getSeverityBadge(pumpHealth).bg}`}>
                {pumpHealth}% HP
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">RECIRCULATION</span>
                <span className="text-slate-200 font-bold block text-xs">45 L/min</span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">CAVITATION INDX</span>
                <span className={`font-bold block text-xs ${pumpCavitation > 0.12 ? "text-rose-455 animate-pulse" : "text-emerald-450"}`}>
                  {pumpCavitation}
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-855">
                <span className="text-slate-500 text-[8px] block">MIN FLOW BOND</span>
                <span className="text-slate-400 font-bold block text-xs">25 L/min</span>
              </div>
            </div>
          </button>
        </div>

        {/* HIGH-FIDELITY TELEMETRY CHART PLOT (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl overflow-hidden">
          
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850/80">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-200 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  Dynamic Sensor Signal Trace plot
                </h3>
                <p className="text-[10.5px] text-slate-450 leading-relaxed font-sans">
                  Visualized dynamic historical curve representing active metrics on selected asset: <strong>{selectedAsset.toUpperCase()}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono select-none">
                <span className="text-slate-500 text-[10px] uppercase block">Visible Ticks:</span>
                <select
                  value={timeWindow}
                  onChange={e => setTimeWindow(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-800 text-[11.5px] px-2 py-1 rounded text-slate-350 focus:outline-none"
                >
                  <option value={10}>Last 10s</option>
                  <option value={15}>Last 15s</option>
                  <option value={20}>Last 20s</option>
                </select>
              </div>
            </div>

            {/* Custom SVG Responsive Line Plot Graph */}
            <div className="relative bg-slate-900/40 p-3 rounded-lg border border-slate-855/65 mt-2 h-44 flex flex-col justify-between select-none">
              
              {/* Legend headers inside chart */}
              <div className="flex gap-4 text-[9px] font-mono absolute top-4 left-4 z-10 bg-slate-950/85 px-3 py-1.5 rounded-sm border border-slate-850">
                <div className="flex items-center gap-1 text-purple-400">
                  <span className="w-2 h-0.5 bg-purple-500 inline-block"></span>
                  <span>B-201 Steam pressure (Bar)</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-0.5 bg-amber-500 inline-block"></span>
                  <span>GT-400 Turb vibration (mm/s)</span>
                </div>
                <div className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-0.5 bg-cyan-400 inline-block"></span>
                  <span>P-302 Cavitation (index)</span>
                </div>
              </div>

              {/* True Custom Inline Vector Chart drawing */}
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-32 overflow-visible"
              >
                {/* Horizontal reference grids */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} className="stroke-slate-850 stroke-1" strokeDasharray="3,3" />
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} className="stroke-slate-850 stroke-1" strokeDasharray="3,3" />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} className="stroke-slate-850 stroke-1" strokeDasharray="3,3" />

                {/* Draw Pressure Wave (Purple) map bounds 10.0 to 15.0 */}
                <polyline
                  fill="none"
                  className="stroke-purple-500 stroke-2"
                  points={getPointsString("pressure", 10.0, 15.0)}
                />

                {/* Draw Vibration Wave (Amber) map bounds 1.0 to 6.0 */}
                <polyline
                  fill="none"
                  className="stroke-amber-500 stroke-1.5"
                  points={getPointsString("vibration", 1.0, 6.0)}
                />

                {/* Draw Cavitation Wave (Cyan) map bounds 0.0 to 0.2 */}
                <polyline
                  fill="none"
                  className="stroke-cyan-500 stroke-1.5"
                  points={getPointsString("cavitation", 0.0, 0.25)}
                />

                {/* Data point dot on the very last updated tick */}
                {telemetryHistory.length > 0 && (() => {
                  const pt = telemetryHistory[telemetryHistory.length - 1];
                  const x = chartWidth - padding;
                  
                  // Invert scaling helper for dot coordination offset
                  const pNorm = (pt.pressure - 10.0) / (15.0 - 10.0 || 1);
                  const pY = chartHeight - padding - pNorm * (chartHeight - padding * 2);

                  const vNorm = (pt.vibration - 1.0) / (6.0 - 1.0 || 1);
                  const vY = chartHeight - padding - vNorm * (chartHeight - padding * 2);

                  return (
                    <>
                      <circle cx={x} cy={pY} r={3.5} className="fill-purple-500 stroke-slate-900 stroke-2 animate-ping" />
                      <circle cx={x} cy={vY} r={3.5} className="fill-amber-500 stroke-slate-900 stroke-2 animate-ping" />
                    </>
                  );
                })()}

              </svg>

              {/* Tick times footer scale */}
              <div className="flex justify-between text-[8px] font-mono text-slate-550 px-2 select-none">
                <span>{telemetryHistory.slice(-timeWindow)[0]?.time || "STANDBY_TIME"}</span>
                <span>MIDPOINT_TICK_SCALE</span>
                <span>{telemetryHistory[telemetryHistory.length - 1]?.time || "ACTIVE_TIME"}</span>
              </div>
            </div>

            {/* Simulated Live Alert Diagnostics Box */}
            <div className="p-3 bg-slate-900 border border-slate-855 rounded-lg flex items-center justify-between text-[11px] font-mono mt-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-indigo-400" />
                <span className="text-slate-300">SCADA Stream: Active standard deviations normal.</span>
              </div>
              <div className="text-slate-500 text-[10px]">
                {tickCount} DATA_FRAMES_PARSED
              </div>
            </div>
          </div>

          {/* QUICK LINKS DIRECT CORRELATION BUTTONS */}
          <div className="border-t border-slate-850 pt-4 mt-4">
            <span className="text-[10px] font-mono text-slate-500 tracking-wider uppercase block mb-2.5 font-bold">Inter-Agent Diagnostics Action Portals:</span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs font-mono">
              <button
                onClick={() => onNavigateTab("rag")}
                className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <span className="text-indigo-455 font-bold block text-[10px]">RAG SEARCH</span>
                  <span className="text-slate-400 text-[9.5px]">Standard Handbooks</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-655 group-hover:text-white transition" />
              </button>

              <button
                onClick={() => onNavigateTab("rca")}
                className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <span className="text-rose-455 font-bold block text-[10px]">RCA LABS</span>
                  <span className="text-slate-400 text-[9.5px]">Compile 5-Whys</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-655 group-hover:text-white transition" />
              </button>

              <button
                onClick={() => onNavigateTab("compliance")}
                className="p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <span className="text-emerald-455 font-bold block text-[10px]">COMPLIANCY</span>
                  <span className="text-slate-400 text-[9.5px]">ASME Audit Codes</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-655 group-hover:text-white transition" />
              </button>

              <button
                onClick={() => onNavigateTab("agents")}
                className="p-2.5 bg-slate-900 hover:bg-purple-950/25 border border-slate-800 rounded-lg text-left transition flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <span className="text-purple-400 font-bold block text-[10px]">LANGGRAPH</span>
                  <span className="text-slate-400 text-[9.5px]">Swarm Engine</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-purple-500 group-hover:animate-pulse" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 3: MAINTENANCE CALENDAR DISPATCH INSIGHTS & ASME STANDARDS HANDBOOK INTEGRATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAINTENANCE WORKLOAD COORDINATOR (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex flex-col space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850/80">
            <div>
              <h3 className="font-bold text-slate-205 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                Active Maintenance Task schedules
              </h3>
              <p className="text-[11px] text-slate-450 font-sans mt-0.5">
                Dispatch site maintenance protocols mapped automatically into corresponding pressure boundary rules.
              </p>
            </div>

            {/* Severity priority filters */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded font-mono text-[9px] select-none text-slate-400">
              {["All", "Critical", "High", "Medium"].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedPriorityFilter(lvl as any)}
                  className={`px-2 py-1 rounded transition cursor-pointer text-[10px] font-bold uppercase ${
                    selectedPriorityFilter === lvl 
                      ? "bg-indigo-900 text-white font-mono" 
                      : "hover:text-slate-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Lists layout */}
          <div className="overflow-y-auto max-h-80 space-y-3 pr-1 pt-1">
            {filteredTasks.slice(0, 4).map((task) => {
              const isPending = task.status === "Pending";
              
              return (
                <div 
                  key={task.id} 
                  className="bg-slate-900/30 p-3.5 border border-slate-855 rounded-lg hover:border-slate-800 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative"
                >
                  <div className="space-y-1.5 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono text-slate-500 uppercase">{task.id}</span>
                      <span className={`px-1.5 py-0.5 border text-[8.5px] rounded-sm font-mono font-bold tracking-wider ${
                        task.severity === "Critical" 
                          ? "bg-rose-955/20 text-rose-400 border-rose-900/30" 
                          : task.severity === "High" 
                            ? "bg-amber-955/20 text-amber-400 border-amber-900/35" 
                            : "bg-blue-955/20 text-blue-400 border-blue-900/35"
                      }`}>
                        {task.severity}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-200 text-xs">{task.title}</h4>
                    <p className="text-[10.5px] text-slate-405 leading-relaxed font-sans">{task.details}</p>
                    
                    <div className="flex items-center gap-3.5 text-[9.5px] font-mono text-slate-500 pt-1">
                      <span>ASSIGNED TO: <strong className="text-slate-400 font-semibold">{task.assignedTo || "LEAD_FIELD_TECH"}</strong></span>
                      <span>•</span>
                      <span>LAST POLLED: <strong className="text-slate-450">SECURE_TRANS</strong></span>
                    </div>
                  </div>

                  {/* Dispatch control actions */}
                  <div className="shrink-0 text-right">
                    {isPending ? (
                      <button
                        onClick={() => {
                          // Change task status in App level state list
                          setMaintenanceTasks(prev => 
                            prev.map(t => t.id === task.id ? { ...t, status: "Completed" } : t)
                          );
                          // Audit
                          const logs = {
                            id: `audit-maint-dispatch-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            actor: "SCADA_DAEMON",
                            role: userRole,
                            action: `Assured Field Repair: ${task.id}`,
                            status: "Success",
                            details: `Dispatched service team and validated pressure metrics compliance on: "${task.title}".`
                          };
                          setAuditLogs(prev => [logs, ...prev]);
                        }}
                        disabled={userRole === UserRole.Auditor}
                        className="py-1.5 px-3 bg-indigo-700 text-white hover:bg-indigo-600 disabled:bg-slate-900 disabled:text-slate-650 rounded text-[10.5px] font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>DISPATCH WORKER</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-emerald-950/20 text-emerald-400 text-[10px] font-mono rounded border border-emerald-900/25">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-bold tracking-wider">RESOLVED</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center p-8 border border-dashed border-slate-850 rounded-lg">
                <span className="text-xs text-slate-550 font-mono italic">No tasks found matching requested bounds or severity schedules.</span>
              </div>
            )}
          </div>

          {/* Fast redirect helper to fuller maintenance schedule editor ledger */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => onNavigateTab("maintenance")}
              className="text-xs font-mono text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Access Comprehensive Task Ledger</span>
              <CornerDownRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* ASME / STANDARDS COMPLIANCE HANDBOOK INTEGRATOR (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-slate-205 text-xs uppercase tracking-wider">ASME Sec VIII Regulation Audit Portal</span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Enter any query regarding safety limits, inspection periods, metal thermal constraints, or OSHA standards to parse our core compliance guidelines.
            </p>

            {/* Input form query */}
            <div className="space-y-2">
              <textarea
                value={complianceCheckQuery}
                onChange={e => setComplianceCheckQuery(e.target.value)}
                placeholder="Type regulatory check e.g. ASME relief valve testing interval, or OSHA lockout tagout limits..."
                rows={3}
                className="w-full text-xs font-mono border border-slate-850 rounded-lg p-3 bg-slate-900 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500/50 leading-relaxed resize-none"
              />

              <button
                onClick={runASMEComplianceCheck}
                disabled={isAuditingCompliance || !complianceCheckQuery.trim()}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-900 disabled:text-slate-600 font-bold font-mono text-white rounded-lg text-[10.5px] tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg border border-emerald-600/25"
              >
                {isAuditingCompliance ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>AUDITING STANDARDS CODES...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5 text-emerald-300" />
                    <span>RUN SECURITY AUDIT CHECK</span>
                  </>
                )}
              </button>
            </div>

            {/* Audit Results feedback panel */}
            <AnimatePresence mode="wait">
              {complianceAuditResult && (
                <motion.div
                  key="audit-feedback"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="p-3 bg-slate-900 border border-slate-855 rounded-lg relative overflow-hidden font-mono mt-3 select-none"
                >
                  <div className="absolute top-2 right-2 flex items-center text-[8px] text-emerald-450 border border-emerald-900/30 bg-emerald-950/20 px-1 py-0.5 rounded uppercase font-bold">
                    <ThumbsUp className="w-2.5 h-2.5 mr-1" /> Verified Standard
                  </div>
                  <span className="text-[9px] text-emerald-500 font-bold block mb-1">COMPLIANCE REVIEW CODE STATEMENT:</span>
                  <p className="text-[10.5px] text-slate-300 leading-normal font-sans italic">
                    "{complianceAuditResult}"
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="pt-4 border-t border-slate-850/80 mt-4">
            <span className="text-[9.5px] font-mono text-slate-500 block">STANDARD REGULATORY PRESET REVIEWS:</span>
            <div className="flex flex-wrap gap-2 pt-2 text-[9px] font-mono">
              <button
                onClick={() => {
                  setComplianceCheckQuery("ASME Section VIII Div 1 pressure relief valve inspection period");
                }}
                className="py-1 px-2.5 bg-slate-900 hover:bg-slate-855 border border-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                阀 Relief Testing
              </button>
              <button
                onClick={() => {
                  setComplianceCheckQuery("OSHA standard on chemical containment area lockout tagout checks");
                }}
                className="py-1 px-2.5 bg-slate-900 hover:bg-slate-855 border border-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                鎖 OSHA Lockout/Tagout
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
