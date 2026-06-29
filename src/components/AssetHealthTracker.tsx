import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, ShieldAlert, CheckCircle2, AlertTriangle, Play,
  TrendingUp, Clock, HelpCircle, Wrench, Shield, Search,
  ArrowUpRight, RefreshCw, Cpu, Gauge, Zap, Waves, Settings,
  AlertCircle, ArrowRight, CornerDownRight, ThumbsUp, Layers,
  Plus, Trash2
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

interface CustomAsset {
  id: string;
  name: string;
  type: "boiler" | "turbine" | "valve" | "pump";
  metricLabel: string;
  metricValue: number;
  metricUnit: string;
  limitLabel: string;
  limitValue: number;
  subMetricLabel?: string;
  subMetricValue?: string | number;
}

interface TelemetryPoint {
  time: string;
  values: Record<string, number>;
}

const DEFAULT_ASSETS: CustomAsset[] = [
  {
    id: "boiler",
    name: "Boiler B-201 Steam Vessel",
    type: "boiler",
    metricLabel: "LIVE PRESSURE",
    metricValue: 12.1,
    metricUnit: "Bar",
    limitLabel: "ASME LIMITS",
    limitValue: 13.5,
    subMetricLabel: "TEMP MATRIX",
    subMetricValue: "412°C"
  },
  {
    id: "turbine",
    name: "Gas Turbine GT-400 Bearing",
    type: "turbine",
    metricLabel: "RADIAL VIBR",
    metricValue: 3.2,
    metricUnit: "mm/s",
    limitLabel: "ISO THRESH",
    limitValue: 4.2,
    subMetricLabel: "DYNAMIC SPEED",
    subMetricValue: "3600 RPM"
  },
  {
    id: "valve",
    name: "Relief Valve V-101 (Safety)",
    type: "valve",
    metricLabel: "FEEDBACK STATE",
    metricValue: 1,
    metricUnit: "state",
    limitLabel: "OSHA DIRECTIVE",
    limitValue: 0,
    subMetricLabel: "SPRING STRETCH",
    subMetricValue: "104% Calibration"
  },
  {
    id: "pump",
    name: "Feedwater Pump P-302 Impeller",
    type: "pump",
    metricLabel: "CAVITATION INDX",
    metricValue: 0.05,
    metricUnit: "",
    limitLabel: "MIN FLOW BOND",
    limitValue: 0.12,
    subMetricLabel: "RECIRCULATION",
    subMetricValue: "45 L/min"
  }
];

export default function AssetHealthTracker({
  token,
  userRole,
  onNavigateTab,
  auditLogs,
  setAuditLogs,
  maintenanceTasks,
  setMaintenanceTasks
}: AssetHealthTrackerProps) {
  // 1. Dynamic Asset Configuration States
  const [assets, setAssets] = useState<CustomAsset[]>(() => {
    const saved = localStorage.getItem("indus_assets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    // Seed with DEFAULT_ASSETS
    localStorage.setItem("indus_assets", JSON.stringify(DEFAULT_ASSETS));
    return DEFAULT_ASSETS;
  });

  const [selectedAssetId, setSelectedAssetId] = useState<string>(() => {
    const saved = localStorage.getItem("indus_assets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed[0].id;
      } catch (e) {}
    }
    return DEFAULT_ASSETS[0].id;
  });
  const [controlBoardTab, setControlBoardTab] = useState<"adjust" | "add">(() => {
    const saved = localStorage.getItem("indus_assets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return "adjust";
      } catch (e) {}
    }
    return "adjust";
  });
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1000); // ms update interval
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  
  // Custom Asset Creator fields
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetType, setNewAssetType] = useState<"boiler" | "turbine" | "valve" | "pump">("boiler");
  const [newMetricLabel, setNewMetricLabel] = useState("Pressure");
  const [newMetricValue, setNewMetricValue] = useState("12.0");
  const [newMetricUnit, setNewMetricUnit] = useState("Bar");
  const [newLimitLabel, setNewLimitLabel] = useState("ASME LIMIT");
  const [newLimitValue, setNewLimitValue] = useState("13.5");
  const [newSubMetricLabel, setNewSubMetricLabel] = useState("TEMP MATRIX");
  const [newSubMetricValue, setNewSubMetricValue] = useState("412°C");

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

  // Save to localStorage when assets change
  useEffect(() => {
    localStorage.setItem("indus_assets", JSON.stringify(assets));
  }, [assets]);

  // Initialize initial history cache
  useEffect(() => {
    const initialHistory: TelemetryPoint[] = [];
    let tempTime = Date.now() - 20000;
    for (let i = 0; i < 20; i++) {
      const pointValues: Record<string, number> = {};
      assets.forEach(asset => {
        if (asset.type === "boiler") {
          pointValues[asset.id] = parseFloat((asset.metricValue + (Math.random() - 0.5) * 0.4).toFixed(2));
        } else if (asset.type === "turbine") {
          pointValues[asset.id] = parseFloat((asset.metricValue + (Math.random() - 0.5) * 0.2).toFixed(2));
        } else if (asset.type === "valve") {
          pointValues[asset.id] = asset.metricValue;
        } else {
          pointValues[asset.id] = parseFloat((asset.metricValue + (Math.random() - 0.5) * 0.01).toFixed(3));
        }
      });
      initialHistory.push({
        time: new Date(tempTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        values: pointValues
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
        const nextValues: Record<string, number> = {};
        
        setAssets(currentAssets => {
          return currentAssets.map(asset => {
            let nextVal = asset.metricValue;
            if (asset.type === "boiler") {
              nextVal += parseFloat(((Math.random() - 0.5) * 0.15).toFixed(2));
              nextVal = Math.max(1.0, parseFloat(nextVal.toFixed(2)));
            } else if (asset.type === "turbine") {
              nextVal += parseFloat(((Math.random() - 0.5) * 0.08).toFixed(2));
              nextVal = Math.max(0.1, parseFloat(nextVal.toFixed(2)));
            } else if (asset.type === "pump") {
              nextVal += parseFloat(((Math.random() - 0.48) * 0.005).toFixed(3));
              nextVal = Math.max(0.001, parseFloat(nextVal.toFixed(3)));
            }
            nextValues[asset.id] = nextVal;
            return { ...asset, metricValue: nextVal };
          });
        });

        const nextPoint: TelemetryPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          values: nextValues
        };

        const trimmed = [...prev.slice(1), nextPoint];
        return trimmed;
      });
    }, simulationSpeed);

    return () => clearInterval(timer);
  }, [isSimulating, simulationSpeed]);

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    const newId = `asset-${Date.now()}`;
    const initialVal = Number(newMetricValue) || 0;
    const limitVal = Number(newLimitValue) || 0;

    const newAsset: CustomAsset = {
      id: newId,
      name: newAssetName.trim(),
      type: newAssetType,
      metricLabel: newMetricLabel.trim() || "Value",
      metricValue: initialVal,
      metricUnit: newMetricUnit.trim(),
      limitLabel: newLimitLabel.trim() || "LIMIT",
      limitValue: limitVal,
      subMetricLabel: newSubMetricLabel.trim() || undefined,
      subMetricValue: newSubMetricValue.trim() || undefined
    };

    setAssets(prev => [...prev, newAsset]);
    setSelectedAssetId(newId);

    // Seed telemetryHistory with initial point values
    setTelemetryHistory(prev => {
      return prev.map(p => ({
        ...p,
        values: {
          ...p.values,
          [newId]: initialVal
        }
      }));
    });

    const newLog = {
      id: `audit-add-asset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "OPERATOR",
      role: userRole,
      action: "Asset Registered",
      status: "Success",
      details: `Registered custom plant asset: [${newAssetName}] (${newAssetType}) with limit boundaries.`
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Reset Form
    setNewAssetName("");
    setNewMetricLabel("Pressure");
    setNewMetricValue("12.0");
    setNewMetricUnit("Bar");
    setNewLimitLabel("ASME LIMIT");
    setNewLimitValue("13.5");
    setNewSubMetricLabel("");
    setNewSubMetricValue("");
    setControlBoardTab("adjust");
  };

  const updateSelectedAssetField = (field: keyof CustomAsset, val: any) => {
    setAssets(prev => prev.map(asset => {
      if (asset.id === selectedAssetId) {
        const updated = { ...asset, [field]: val };
        // Update live telemetry history
        if (field === "metricValue") {
          setTelemetryHistory(history => history.map((pt, index) => {
            if (index === history.length - 1) {
              return { ...pt, values: { ...pt.values, [selectedAssetId]: Number(val) } };
            }
            return pt;
          }));
        }
        return updated;
      }
      return asset;
    }));
  };

  const deleteSelectedAsset = () => {
    if (assets.length <= 1) {
      alert("At least one active physical asset profile must remain monitored.");
      return;
    }
    const currentId = selectedAssetId;
    const remaining = assets.filter(a => a.id !== currentId);
    setAssets(remaining);
    setSelectedAssetId(remaining[0].id);

    const newLog = {
      id: `audit-delete-asset-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: "OPERATOR",
      role: userRole,
      action: "Asset Decommissioned",
      status: "Warning",
      details: `Decommissioned physical asset profile ID [${currentId}].`
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const resetSensors = () => {
    setAssets(prev => prev.map(asset => {
      let nominalVal = asset.metricValue;
      if (asset.type === "boiler") nominalVal = 12.1;
      else if (asset.type === "turbine") nominalVal = 3.2;
      else if (asset.type === "valve") nominalVal = 0;
      else if (asset.type === "pump") nominalVal = 0.05;
      return { ...asset, metricValue: nominalVal };
    }));

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
    return { bg: "bg-rose-950/20 text-rose-455 border-rose-900/30", label: "ALERT_DANGER", border: "border-rose-600/30" };
  };

  // Compute calculated asset health ratings dynamically
  const getAssetHealth = (asset: CustomAsset) => {
    if (asset.type === "boiler") {
      return Math.max(0, Math.min(100, Math.round(100 - (asset.metricValue > asset.limitValue ? (asset.metricValue - asset.limitValue) * 45 : Math.abs(asset.metricValue - 12.1) * 8))));
    } else if (asset.type === "turbine") {
      return Math.max(0, Math.min(100, Math.round(100 - (asset.metricValue > asset.limitValue ? (asset.metricValue - asset.limitValue) * 35 : Math.abs(asset.metricValue - 3.2) * 12))));
    } else if (asset.type === "valve") {
      return asset.metricValue === 0 ? 100 : asset.metricValue === 1 ? 78 : 42;
    } else {
      return Math.max(0, Math.min(100, Math.round(100 - (asset.metricValue > asset.limitValue ? (asset.metricValue - asset.limitValue) * 550 : asset.metricValue * 120))));
    }
  };

  const plantHealthScore = assets.length > 0 
    ? Math.round(assets.reduce((sum, asset) => sum + getAssetHealth(asset), 0) / assets.length)
    : 100;

  // SVG Chart Dimensions & Computations
  const chartWidth = 550;
  const chartHeight = 150;
  const padding = 20;

  const getPointsString = (assetId: string, minVal: number, maxVal: number) => {
    const subset = telemetryHistory.slice(-timeWindow);
    return subset.map((pt, idx) => {
      const val = (pt.values && pt.values[assetId] !== undefined) ? pt.values[assetId] : 0;
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

  const selectedAssetProfile = assets.find(a => a.id === selectedAssetId) || assets[0] || null;  return (
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

        {/* Operational Telemetry Control Board Card */}
        <div className="bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl col-span-1 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-850">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="font-mono font-bold text-slate-205 text-xs uppercase tracking-wider">Operational Desk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setControlBoardTab("adjust")}
                className={`py-1 px-2.5 rounded text-[10px] font-mono transition cursor-pointer font-bold ${
                  controlBoardTab === "adjust" ? "bg-indigo-900 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                ADJUST
              </button>
              <button
                onClick={() => setControlBoardTab("add")}
                className={`py-1 px-2.5 rounded text-[10px] font-mono transition cursor-pointer font-bold ${
                  controlBoardTab === "add" ? "bg-indigo-900 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                + NEW ASSET
              </button>
            </div>
          </div>

          <div className="pt-3">
            {controlBoardTab === "adjust" ? (
              <div className="space-y-3">
                {selectedAssetProfile ? (
                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 uppercase">ACTIVE TARGET PROFILE</span>
                      <button
                        onClick={deleteSelectedAsset}
                        className="text-rose-455 hover:text-rose-400 text-[10px] flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> DECOMMISSION
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase">ASSET PROFILE NAME</label>
                        <input
                          type="text"
                          value={selectedAssetProfile.name}
                          onChange={e => updateSelectedAssetField("name", e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-500 uppercase">REDLINE CONSTRAINT</label>
                        <input
                          type="number"
                          step={selectedAssetProfile.type === "pump" ? 0.01 : 0.1}
                          value={selectedAssetProfile.limitValue}
                          onChange={e => updateSelectedAssetField("limitValue", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[9px] text-slate-500 uppercase">
                        <span>LIVE SENSOR FEED ({selectedAssetProfile.metricLabel})</span>
                        <span className="font-bold text-slate-300">
                          {selectedAssetProfile.type === "valve" 
                            ? (selectedAssetProfile.metricValue === 0 ? "NOMINAL" : selectedAssetProfile.metricValue === 1 ? "STIFF" : "JAMMED")
                            : `${selectedAssetProfile.metricValue} ${selectedAssetProfile.metricUnit}`}
                        </span>
                      </div>
                      {selectedAssetProfile.type === "valve" ? (
                        <select
                          value={selectedAssetProfile.metricValue}
                          onChange={e => updateSelectedAssetField("metricValue", Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value={0}>NOMINAL</option>
                          <option value={1}>STIFF</option>
                          <option value={2}>JAMMED</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={0}
                            max={selectedAssetProfile.limitValue * 2 || 100}
                            step={selectedAssetProfile.type === "pump" ? 0.01 : 0.1}
                            value={selectedAssetProfile.metricValue}
                            onChange={e => updateSelectedAssetField("metricValue", parseFloat(e.target.value))}
                            className="flex-1 accent-indigo-500"
                          />
                          <input
                            type="number"
                            step={selectedAssetProfile.type === "pump" ? 0.01 : 0.1}
                            value={selectedAssetProfile.metricValue}
                            onChange={e => updateSelectedAssetField("metricValue", parseFloat(e.target.value) || 0)}
                            className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-xs text-white focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Select an asset card below to adjust its live telemetry readings.</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddAsset} className="space-y-2 text-[10px] font-mono">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-slate-500 block">ASSET NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flare Condenser F-112"
                      value={newAssetName}
                      onChange={e => setNewAssetName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 block">TYPE</label>
                    <select
                      value={newAssetType}
                      onChange={e => {
                        const type = e.target.value as any;
                        setNewAssetType(type);
                        if (type === "boiler") {
                          setNewMetricLabel("Pressure");
                          setNewMetricUnit("Bar");
                          setNewLimitLabel("ASME LIMIT");
                          setNewLimitValue("13.5");
                        } else if (type === "turbine") {
                          setNewMetricLabel("Radial Vibr");
                          setNewMetricUnit("mm/s");
                          setNewLimitLabel("ISO THRESH");
                          setNewLimitValue("4.2");
                        } else if (type === "valve") {
                          setNewMetricLabel("Feedback State");
                          setNewMetricUnit("state");
                          setNewLimitLabel("OSHA DIRECTIVE");
                          setNewLimitValue("0");
                        } else {
                          setNewMetricLabel("Cavitation Indx");
                          setNewMetricUnit("");
                          setNewLimitLabel("MIN FLOW BOND");
                          setNewLimitValue("0.12");
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white text-[9.5px]"
                    >
                      <option value="boiler">Boiler</option>
                      <option value="turbine">Turbine</option>
                      <option value="valve">Valve</option>
                      <option value="pump">Pump</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-500 block">METRIC LABEL</label>
                    <input
                      type="text"
                      required
                      value={newMetricLabel}
                      onChange={e => setNewMetricLabel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 block">INITIAL VALUE</label>
                    <input
                      type="number"
                      step={0.01}
                      required
                      value={newMetricValue}
                      onChange={e => setNewMetricValue(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 block">REDLINE THRESHOLD</label>
                    <input
                      type="number"
                      step={0.01}
                      required
                      value={newLimitValue}
                      onChange={e => setNewLimitValue(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-500 block">UNIT</label>
                    <input
                      type="text"
                      value={newMetricUnit}
                      onChange={e => setNewMetricUnit(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded font-bold transition flex items-center justify-center gap-1 uppercase"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register Custom Asset Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setControlBoardTab("adjust")}
                    className="px-3 py-1 bg-slate-900 text-slate-400 hover:text-white rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
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

          {assets.length === 0 ? (
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 text-center space-y-4">
              <div className="w-10 h-10 rounded-full bg-indigo-950/50 border border-indigo-900/40 flex items-center justify-center mx-auto">
                <Plus className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-white font-mono font-bold uppercase">No Active Assets Registered</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">To begin monitoring real-time telemetry, please click the "Register Custom Asset Profile" tab above to provision a device.</p>
              </div>
              <button 
                onClick={() => setControlBoardTab("add")}
                className="py-1.5 px-4 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-[10px] font-mono font-bold transition cursor-pointer uppercase tracking-wider"
              >
                + Register First Asset
              </button>
            </div>
          ) : (
            assets.map((asset) => {
              const health = getAssetHealth(asset);
              const isAbnormal = asset.metricValue > asset.limitValue && asset.type !== "valve";
              
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                    selectedAssetId === asset.id
                      ? "bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-950/20"
                      : "bg-slate-950 hover:bg-slate-900/60 border-slate-850"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase">{asset.type.toUpperCase()} STATE MATRIX</span>
                      <h3 className="font-bold text-white text-xs font-mono flex items-center gap-1.5 font-sans">
                        {asset.type === "boiler" && <Gauge className="w-3.5 h-3.5 text-purple-400" />}
                        {asset.type === "turbine" && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                        {asset.type === "valve" && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                        {asset.type === "pump" && <Waves className="w-3.5 h-3.5 text-cyan-400" />}
                        {asset.name}
                      </h3>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${getSeverityBadge(health).bg}`}>
                      {health}% HP
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-mono">
                    <div className="p-2 bg-slate-950 rounded border border-slate-855">
                      <span className="text-slate-500 text-[8px] block uppercase">{asset.metricLabel}</span>
                      <span className={`font-bold block text-xs truncate ${isAbnormal ? "text-rose-455 animate-pulse" : "text-slate-200"}`}>
                        {asset.type === "valve" 
                          ? (asset.metricValue === 0 ? "NOMINAL" : asset.metricValue === 1 ? "STIFF" : "JAMMED")
                          : `${asset.metricValue} ${asset.metricUnit}`}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-855">
                      <span className="text-slate-500 text-[8px] block uppercase">{asset.subMetricLabel || "STATUS"}</span>
                      <span className="text-slate-200 font-bold block text-xs truncate">
                        {asset.subMetricValue || "CALIBRATED"}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-855">
                      <span className="text-slate-500 text-[8px] block uppercase">THRESHOLD</span>
                      <span className="text-slate-400 font-bold block text-xs truncate">
                        {asset.type === "valve" ? "Fail-Safe Vent" : `${asset.limitValue} ${asset.metricUnit}`}
                      </span>
                    </div>
                  </div>

                  {isAbnormal && (
                    <div className="mt-3 py-1 px-2 bg-rose-955/15 border border-rose-900/40 text-rose-450 rounded text-[9px] font-mono flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                      <span>Metrics out of bounds! Check or run 5-Why diagnostics in RCA tab.</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* HIGH-FIDELITY TELEMETRY CHART PLOT (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 border border-slate-805 rounded-xl p-5 shadow-2xl overflow-hidden">
          
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850/80">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-205 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  Dynamic Sensor Signal Trace plot
                </h3>
                <p className="text-[10.5px] text-slate-450 leading-relaxed font-sans">
                  Visualized dynamic historical curve representing active metrics on selected asset: <strong>{selectedAssetProfile?.name || "None"}</strong>.
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
                <div className="flex items-center gap-1 text-indigo-400">
                  <span className="w-2 h-0.5 bg-indigo-500 inline-block"></span>
                  <span>{selectedAssetProfile?.name || "Asset"} Live Feed</span>
                </div>
                {selectedAssetProfile && selectedAssetProfile.type !== "valve" && (
                  <div className="flex items-center gap-1 text-rose-500 font-bold">
                    <span className="w-2 h-0.5 bg-rose-500 inline-block stroke-dasharray"></span>
                    <span>Redline safety: {selectedAssetProfile.limitValue} {selectedAssetProfile.metricUnit}</span>
                  </div>
                )}
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

                {selectedAssetProfile && (
                  <>
                    {/* Draw Redline boundary */}
                    {selectedAssetProfile.type !== "valve" && (() => {
                      const maxVal = selectedAssetProfile.limitValue * 1.5 || 10;
                      const normLimit = selectedAssetProfile.limitValue / maxVal;
                      const y = chartHeight - padding - normLimit * (chartHeight - padding * 2);
                      return (
                        <line 
                          x1={padding} 
                          y1={y} 
                          x2={chartWidth - padding} 
                          y2={y} 
                          className="stroke-rose-500/70 stroke-1.5" 
                          strokeDasharray="4,4" 
                        />
                      );
                    })()}

                    {/* Draw Asset Telemetry Line */}
                    <polyline
                      fill="none"
                      className="stroke-indigo-400 stroke-2"
                      points={getPointsString(selectedAssetProfile.id, 0, selectedAssetProfile.limitValue * 1.5 || 10)}
                    />

                    {/* Glowing blink dot on last updated tick */}
                    {telemetryHistory.length > 0 && (() => {
                      const pt = telemetryHistory[telemetryHistory.length - 1];
                      const val = (pt.values && pt.values[selectedAssetProfile.id] !== undefined) ? pt.values[selectedAssetProfile.id] : 0;
                      const maxVal = selectedAssetProfile.limitValue * 1.5 || 10;
                      const normVal = val / maxVal;
                      const y = chartHeight - padding - normVal * (chartHeight - padding * 2);
                      const x = chartWidth - padding;
                      return (
                        <>
                          <circle cx={x} cy={y} r={4} className="fill-indigo-400 stroke-slate-900 stroke-2 animate-ping" />
                          <circle cx={x} cy={y} r={3} className="fill-indigo-400 stroke-slate-950 stroke-1" />
                        </>
                      );
                    })()}
                  </>
                )}

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
