import React, { useState, useEffect } from "react";
import { 
  Network, 
  Search, 
  BookOpen, 
  Cpu, 
  Settings, 
  ShieldCheck, 
  Library, 
  Globe, 
  Database, 
  UserCheck, 
  AlertCircle, 
  LogOut, 
  KeyRound, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  UserPlus, 
  Activity, 
  RefreshCw, 
  Lock,
  ListFilter,
  CheckSquare,
  ClipboardList,
  Bot,
  Scale
} from "lucide-react";
import { UserRole, UserProfile, AuditLogEntry } from "./types";
import GraphExplorer from "./components/GraphExplorer";
import RAGEngine from "./components/RAGEngine";
import AgentWorkflow from "./components/AgentWorkflow";
import DevOpsControl from "./components/DevOpsControl";
import IndustrialCopilot from "./components/IndustrialCopilot";
import RcaAgent from "./components/RcaAgent";
import ComplianceAgent from "./components/ComplianceAgent";
import LessonsLearnedAgent from "./components/LessonsLearnedAgent";
import AssetHealthTracker from "./components/AssetHealthTracker";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Authentication State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Login / Registraion Form Panel States
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.Engineer);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Core Platform States
  const [activeTab, setActiveTab ] = useState<"health" | "graph" | "rag" | "agents" | "copilot" | "rca" | "compliance" | "lessons" | "audit" | "maintenance" | "blueprint">("health");
  const [graphStats, setGraphStats] = useState({ nodes: 7, edges: 7, chunks: 3 });
  
  // Watchdog variables
  const [timeToExpiry, setTimeToExpiry] = useState<number | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateLog, setRotateLog] = useState<string[]>([]);

  // SECURE Audit Trail logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState("");
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // SECURE Maintenance task state
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [isTransitioningTask, setIsTransitioningTask] = useState<string | null>(null);

  // Restore and Sync Session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("indus_token");
    const rToken = localStorage.getItem("indus_refresh_token");
    if (token && rToken) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const expiryTime = payload.exp * 1000;
          if (expiryTime > Date.now()) {
            setUserProfile({
              username: payload.username,
              fullName: payload.fullName,
              role: payload.role as UserRole,
              permissions: payload.permissions,
              token: token,
              refreshToken: rToken,
              tokenExpiry: payload.exp
            });
            // Auto focus on right tab
            setActiveTab("health");
          } else {
            // Token expired, attempt auto renewal immediately
            handleBackgroundRefresh(rToken);
          }
        }
      } catch (e) {
        handleLogout();
      }
    }
  }, []);

  // Poll server for stats updates
  const fetchTelemetryStats = async () => {
    const storedToken = localStorage.getItem("indus_token");
    if (!storedToken) return;

    try {
      const h = { "Authorization": `Bearer ${storedToken}` };
      const [gResp, rResp] = await Promise.all([
        fetch("/api/graph/data", { headers: h }),
        fetch("/api/rag/chunks", { headers: h })
      ]);
      if (gResp.ok && rResp.ok) {
        const gData = await gResp.json();
        const rData = await rResp.json();
        setGraphStats({
          nodes: gData.nodes?.length || 0,
          edges: gData.edges?.length || 0,
          chunks: rData.chunks?.length || 0
        });
      }
    } catch (e) {
      console.warn("Telemetry stats polling disabled or unauthenticated.");
    }
  };

  useEffect(() => {
    if (userProfile?.token) {
      fetchTelemetryStats();
      const interval = setInterval(fetchTelemetryStats, 6000);
      return () => clearInterval(interval);
    }
  }, [userProfile?.token]);

  // Expiry Timer Watchdog Tick logic
  useEffect(() => {
    if (!userProfile?.tokenExpiry) {
      setTimeToExpiry(null);
      return;
    }
    const updateCountdown = () => {
      const remainingSeconds = Math.max(0, Math.floor((userProfile.tokenExpiry! * 1000 - Date.now()) / 1000));
      setTimeToExpiry(remainingSeconds);

      // Auto rotation threshold (below 60 seconds left)
      if (remainingSeconds === 30 && userProfile.refreshToken) {
        setRotateLog(prev => [...prev, `[System Watchdog] Access Token critical low (30s) - launching dynamic auto-refresh...`]);
        handleBackgroundRefresh(userProfile.refreshToken);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [userProfile?.tokenExpiry]);

  // Handle Account login submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!loginUsername || !loginPassword) {
      setAuthError("Identify credentials check failed. Missing parameters.");
      return;
    }

    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await resp.json();

      if (resp.ok) {
        localStorage.setItem("indus_token", data.token);
        localStorage.setItem("indus_refresh_token", data.refreshToken);
        
        setUserProfile({
          username: data.user.username,
          fullName: data.user.fullName,
          role: data.user.role as UserRole,
          permissions: data.user.permissions,
          token: data.token,
          refreshToken: data.refreshToken,
          tokenExpiry: Math.floor(Date.now() / 1000) + data.expiresInSeconds
        });
        setAuthSuccess(`Authentication verified successfully! Active claims synchronized.`);
        setLoginUsername("");
        setLoginPassword("");
        setRotateLog([`[Security Handshake] Session mounted. Generated access and refresh keychains.`]);
      } else {
        setAuthError(data.error || "Authentication failed. Incorrect username or password.");
      }
    } catch (e) {
      setAuthError("Failed contacting authentication cluster. Try again.");
    }
  };

  // Handle Account Registration submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!regUsername || !regFullName || !regPassword) {
      setAuthError("Registration rejected. All configuration fields are required.");
      return;
    }

    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regUsername,
          fullName: regFullName,
          password: regPassword,
          role: regRole
        })
      });
      const data = await resp.json();

      if (resp.ok) {
        setAuthSuccess(`Account "${regUsername}" provisioned nicely! Please proceed to login.`);
        setIsRegistering(false);
        setRegUsername("");
        setRegFullName("");
        setRegPassword("");
      } else {
        setAuthError(data.error || "Failed registering account.");
      }
    } catch (e) {
      setAuthError("Failed connecting to registry database cluster.");
    }
  };

  // Dynamic Token Rotation handshake (Refresh Token)
  const handleManualTokenRefresh = async () => {
    const currentRefreshToken = userProfile?.refreshToken || localStorage.getItem("indus_refresh_token");
    if (!currentRefreshToken) {
      setRotateLog(prev => [...prev, `[Security Handshake Exception] Token rotation aborted: No Refresh Token exists.`]);
      return;
    }
    setIsRotating(true);
    setRotateLog(prev => [...prev, `[Security Handshake] Inbound token rotation requested...`]);

    try {
      const resp = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentRefreshToken })
      });
      const data = await resp.json();

      if (resp.ok) {
        localStorage.setItem("indus_token", data.token);
        
        // Parse claims
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        setUserProfile(prev => prev ? {
          ...prev,
          token: data.token,
          tokenExpiry: payload.exp
        } : null);

        setRotateLog(prev => [...prev, `[Success] HMAC Access Token updated. Expiration reset to +15 minutes.`]);
      } else {
        setRotateLog(prev => [...prev, `[Failed] JWT Handshake rejected: ${data.error}`]);
        handleLogout();
      }
    } catch (err: any) {
      setRotateLog(prev => [...prev, `[Failed] Handshake network error: ${err.message}`]);
    } finally {
      setIsRotating(false);
    }
  };

  // Background token rotation logic
  const handleBackgroundRefresh = async (rToken: string) => {
    try {
      const resp = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rToken })
      });
      const data = await resp.json();

      if (resp.ok) {
        localStorage.setItem("indus_token", data.token);
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        setUserProfile({
          username: payload.username,
          fullName: payload.fullName,
          role: payload.role as UserRole,
          permissions: payload.permissions,
          token: data.token,
          refreshToken: rToken,
          tokenExpiry: payload.exp
        });
        setRotateLog(prev => [...prev, `[Auto Switch] Access token automatically rotated in background.`]);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  // Log Out and session cleanup
  const handleLogout = async () => {
    const currentUsername = userProfile?.username;
    if (currentUsername) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUsername })
        });
      } catch (e) {}
    }

    localStorage.removeItem("indus_token");
    localStorage.removeItem("indus_refresh_token");
    setUserProfile(null);
    setRotateLog([]);
  };

  // Quick preset logger for testing demo roles
  const loginWithPreset = (uname: string, pword: string) => {
    setLoginUsername(uname);
    setLoginPassword(pword);
    setAuthError(null);
    setAuthSuccess(null);
  };

  // Fetch audit trail logs securely
  const fetchAuditLogs = async () => {
    if (!userProfile?.token) return;
    setIsLoadingAudit(true);
    try {
      const resp = await fetch("/api/audit/logs", {
        headers: {
          "Authorization": `Bearer ${userProfile.token}`
        }
      });
      const data = await resp.json();
      if (resp.ok) {
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, userProfile?.token]);

  // Fetch Maintenance Tasks
  const fetchMaintenanceTasks = async () => {
    if (!userProfile?.token) return;
    try {
      const resp = await fetch("/api/maintenance/tasks", {
        headers: {
          "Authorization": `Bearer ${userProfile.token}`
        }
      });
      const data = await resp.json();
      if (resp.ok) {
        setMaintenanceTasks(data.tasks || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "maintenance") {
      fetchMaintenanceTasks();
    }
  }, [activeTab, userProfile?.token]);

  // transition a maintenance task (ASME Section VIII inspection, boiler status, etc.)
  const handleTransitionTask = async (taskId: string, targetStatus: string) => {
    if (!userProfile?.token) return;
    setIsTransitioningTask(taskId);

    try {
      const resp = await fetch("/api/maintenance/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userProfile.token}`
        },
        body: JSON.stringify({ taskId, action: targetStatus })
      });
      
      const data = await resp.json();
      if (resp.ok) {
        // update local list
        setMaintenanceTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus, assignedTo: userProfile.fullName } : t));
        // complete fetch to log correctly
        fetchTelemetryStats();
      } else {
        alert(`Failed to transition task: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTransitioningTask(null);
    }
  };

  // Filter audit logs list dynamically based on search
  const filteredAuditLogs = auditLogs.filter(log => {
    const searchString = auditSearch.toLowerCase();
    return (
      log.actor.toLowerCase().includes(searchString) ||
      log.role.toLowerCase().includes(searchString) ||
      log.action.toLowerCase().includes(searchString) ||
      log.details.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans selection:bg-indigo-900 selection:text-indigo-100" id="app-canvas-container">
      
      {/* Dynamic Header */}
      <header className="bg-slate-900/60 text-slate-100 border-b border-slate-800 shadow-lg sticky top-0 z-50 px-4 md:px-8 py-3.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo and descriptor */}
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-indigo-600 border border-indigo-500 rounded-sm flex items-center justify-center font-bold text-white font-mono text-base shadow-lg shadow-indigo-950/20">
              IB
            </span>
            <div>
              <div className="flex items-center gap-1.5ClassName">
                <span className="font-extrabold tracking-tight text-base text-white font-mono uppercase">INDUS BRAIN</span>
                <span className="text-[9px] font-mono tracking-widest bg-slate-800 border border-slate-700 text-indigo-400 font-extrabold px-2 py-0.5 rounded-sm">
                  // ENTERPRISE SECURE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Automated Industrial Knowledge Intelligence Platform</p>
            </div>
          </div>

          {userProfile && (
            <>
              {/* Telemetry Indicator */}
              <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono border-l border-slate-850 pl-6 mr-auto">
                <div>
                  <span className="text-slate-500">GRAPH NODES</span>
                  <span className="text-indigo-400 font-bold text-sm block tracking-wider">{graphStats.nodes}</span>
                </div>
                <div>
                  <span className="text-slate-500">ONTOLOGY EDGES</span>
                  <span className="text-emerald-400 font-bold text-sm block tracking-wider">{graphStats.edges}</span>
                </div>
                <div>
                  <span className="text-slate-500">KNOWLEDGE CHUNKS</span>
                  <span className="text-amber-400 font-bold text-sm block tracking-wider">{graphStats.chunks}</span>
                </div>
              </div>

              {/* Identity Claims & Session controls */}
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 border border-slate-800 p-2 rounded-sm flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-450" />
                  <div className="text-left font-mono">
                    <p className="text-[10px] font-bold text-slate-205 leading-none">{userProfile.fullName}</p>
                    <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-sm border border-slate-700/60 font-extrabold tracking-wider mt-1 block w-max uppercase">
                      {userProfile.role}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  title="Dissolve Ingress Session (Logout)"
                  className="p-2.5 bg-slate-900 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/40 text-slate-400 hover:text-rose-450 transition rounded-sm cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

        </div>
      </header>

      {/* Main Container Workspace */}
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        <AnimatePresence mode="wait">
          {!userProfile ? (
            /* SECURE REGISTRATION & SECURE LOGIN VIEW (GEOMETRIC BALANCE INTERFACES) */
            <motion.div
              key="auth-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-12 border border-slate-800 rounded-sm bg-slate-900/30 overflow-hidden shadow-2xl my-auto max-w-4xl mx-auto w-full min-h-[500px]"
            >
              {/* Left Column: Industrial security standards catalog */}
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/40 to-slate-900 p-6 flex flex-col justify-between border-r border-slate-800 relative">
                <div className="absolute inset-x-0 bottom-0 top-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold tracking-wider uppercase">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographic Shield Active</span>
                  </div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white font-mono uppercase leading-tight">
                    ENTERPRISE CONTROL GATE
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Welcome to the secure orchestration interface of INDUS BRAIN. Enter verified credentials or provision a role-specific technician token.
                  </p>

                  <div className="border border-slate-800 bg-slate-950/80 p-3.5 rounded-sm font-mono space-y-2.5">
                    <h3 className="text-[10px] font-bold text-amber-500 tracking-wider uppercase mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Seeded Sandbox Accounts</span>
                    </h3>
                    <div className="divide-y divide-slate-900 space-y-1.5 text-[10px] text-slate-350">
                      <div className="pt-1.5 flex items-center justify-between">
                        <span>Admin Profile (Full Control)</span>
                        <button 
                          onClick={() => loginWithPreset("admin", "admin123")}
                          className="bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-800 px-2 py-0.5 rounded-sm transition cursor-pointer text-[9px]"
                        >
                          Use admin
                        </button>
                      </div>
                      <div className="pt-1.5 flex items-center justify-between">
                        <span>Chief Engineer dave</span>
                        <button 
                          onClick={() => loginWithPreset("engineer", "engineer123")}
                          className="bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-800 px-2 py-0.5 rounded-sm transition cursor-pointer text-[9px]"
                        >
                          Use engineer
                        </button>
                      </div>
                      <div className="pt-1.5 flex items-center justify-between">
                        <span>Supervisor Sarah (Maint)</span>
                        <button 
                          onClick={() => loginWithPreset("maintenance", "maint123")}
                          className="bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-800 px-2 py-0.5 rounded-sm transition cursor-pointer text-[9px]"
                        >
                          Use maint
                        </button>
                      </div>
                      <div className="pt-1.5 flex items-center justify-between">
                        <span>Senior Compliancier Paul</span>
                        <button 
                          onClick={() => loginWithPreset("auditor", "audit123")}
                          className="bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-800 px-2 py-0.5 rounded-sm transition cursor-pointer text-[9px]"
                        >
                          Use auditor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[9.5px] font-mono text-slate-500 pt-6 relative z-10 border-t border-slate-850">
                  <p>MAPPED SYSTEM ENCRYPTIONS: </p>
                  <p className="text-indigo-400 font-semibold uppercase font-mono tracking-wider">BCRYPT-S256 // JWT-HMAC512</p>
                </div>
              </div>

              {/* Right Column: Interaction form */}
              <div className="lg:col-span-7 p-6 md:p-8 flex flex-col justify-center bg-slate-950">
                <div className="flex border-b border-slate-800 pb-3 mb-6 gap-6">
                  <button
                    onClick={() => { setIsRegistering(false); setAuthError(null); }}
                    className={`pb-1 text-xs font-semibold font-mono tracking-wider uppercase cursor-pointer border-b-2 transition ${!isRegistering ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-350"}`}
                  >
                    Operator Sign-In
                  </button>
                  <button
                    onClick={() => { setIsRegistering(true); setAuthError(null); }}
                    className={`pb-1 text-xs font-semibold font-mono tracking-wider uppercase cursor-pointer border-b-2 transition ${isRegistering ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-350"}`}
                  >
                    Technician Registration
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 p-3 bg-rose-950/20 border border-rose-900/40 text-rose-400 rounded-sm text-xs font-mono flex items-start gap-2 animate-bounce">
                    <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="mb-4 p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-440 rounded-sm text-xs font-mono flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                {!isRegistering ? (
                  /* SIGN IN FORM */
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold tracking-wider">Username</label>
                      <input
                        type="text"
                        placeholder="Type demo username e.g. admin"
                        required
                        value={loginUsername}
                        onChange={e => setLoginUsername(e.target.value)}
                        className="w-full text-xs font-mono border border-slate-800 rounded-sm p-3 bg-slate-900 text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold tracking-wider">Access PIN / Password</label>
                      <input
                        type="password"
                        placeholder="Type sandboxed pass e.g. admin123"
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        className="w-full text-xs font-mono border border-slate-800 rounded-sm p-3 bg-slate-900 text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 placeholder-slate-600"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-sm text-xs font-mono transition tracking-wider uppercase cursor-pointer"
                    >
                      Authenticate Credentials & Ingress
                    </button>
                  </form>
                ) : (
                  /* REGISTRATION FORM */
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold">Technician ID (Username)</label>
                        <input
                          type="text"
                          placeholder="e.g. jmiller"
                          required
                          value={regUsername}
                          onChange={e => setRegUsername(e.target.value)}
                          className="w-full text-xs font-mono border border-slate-800 rounded-sm p-2.5 bg-slate-900 text-white focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold">Security Password</label>
                        <input
                          type="password"
                          placeholder="e.g. security_PIN"
                          required
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          className="w-full text-xs font-mono border border-slate-800 rounded-sm p-2.5 bg-slate-900 text-white focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 block mb-1 uppercase font-bold">Full Staff Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Engineer John Miller"
                        required
                        value={regFullName}
                        onChange={e => setRegFullName(e.target.value)}
                        className="w-full text-xs border border-slate-800 rounded-sm p-3 bg-slate-900 text-white focus:outline-hidden placeholder-slate-650"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-500 block mb-1.5 uppercase font-bold tracking-wider">Enterprise Security Role Assignment</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.values(UserRole).map(role => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setRegRole(role)}
                            className={`py-2 px-1 text-[10px] font-mono font-semibold rounded-sm border transition text-center cursor-pointer uppercase ${regRole === role ? "border-indigo-500 bg-indigo-950/20 text-indigo-400" : "border-slate-850 bg-slate-900 text-slate-450 hover:bg-slate-800/40"}`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono mt-1.5 leading-tight">
                        Assigning roles injects custom JWT claim structures mapping automatically into our secure RBAC policy checkers.
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-sm text-xs font-mono transition tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Provision Staff Credentials</span>
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          ) : (
            /* ACTIVE USER INTERFACE */
            <motion.div
              key="platform-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 flex-1 flex flex-col"
            >
              {/* WARNING BOX REPRESENTING SEAMLESS ACTIVE PROCESSES AND INCIDENTS */}
              <div className="bg-indigo-950/10 border border-indigo-900/40 py-3 px-4 rounded-sm flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5 text-xs text-indigo-300 font-sans">
                  <AlertCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                  <p>
                    <strong className="font-semibold text-indigo-200">Real-time Gemini AI Processes Active:</strong> Run compliance-mapping ontology extractions, semantic standards vector queries, and multi-agent incident audits dynamically.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono bg-slate-950 border border-slate-850 px-3 py-1 rounded-sm text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  CLUSTER_ONLINE
                </div>
              </div>

              {/* JWT SECURITY TOKEN ROTATION WATCHDOG PANEL */}
              <div className="grid grid-cols-1 md:grid-cols-12 border border-slate-800/80 bg-slate-900/20 rounded-i-sm p-4 gap-4" id="jwt-watchdog-ledger">
                <div className="md:col-span-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-850 pb-4 md:pb-0 md:pr-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span>Session Security Watchdog</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold font-mono tracking-tight text-white">
                        {timeToExpiry !== null ? (
                          `${Math.floor(timeToExpiry / 60)}m ${timeToExpiry % 60}s`
                        ) : (
                          "00m 00s"
                        )}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">Access Key Expiry Clock</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                      JWT Access tokens carry a hard 15 minute TTL limitation. The local daemon runs background rotation handshakes using active Refresh Tokens.
                    </p>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={handleManualTokenRefresh}
                      disabled={isRotating}
                      className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-mono text-indigo-400 rounded-sm transition flex items-center gap-2 cursor-pointer disabled:bg-slate-950"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRotating ? "animate-spin" : ""}`} />
                      <span>Manual Rotation Handshake</span>
                    </button>
                  </div>
                </div>

                <div className="md:col-span-7 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold text-slate-500 block uppercase tracking-wider">watchdog rotation feed logs (active session)</span>
                    <div className="bg-slate-950/80 border border-slate-850 rounded-sm p-2.5 h-20 overflow-y-auto text-[9px] font-mono text-slate-400 divide-y divide-slate-900 space-y-1">
                      {rotateLog.map((log, idx) => (
                        <div key={idx} className="pt-1.5 truncate text-emerald-450/90">
                          {log}
                        </div>
                      ))}
                      {rotateLog.length === 0 && (
                        <span className="text-slate-600 block italic pt-1">Logs cleared. Trigger access rotation to output handshakes.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* NAVIGATION BAR & TAB DIRECTORIES */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-850 pb-3 gap-4" id="navigation-root">
                <div className="flex border border-slate-800 rounded-sm bg-slate-900/60 p-1 overflow-x-auto gap-0.5 shadow-lg max-w-full">
                  {[
                    { id: "health", name: "Asset Health Dashboard", icon: <Activity className="w-3.5 h-3.5" /> },
                    { id: "graph", name: "Ontology Graph", icon: <Network className="w-3.5 h-3.5" /> },
                    { id: "rag", name: "Industrial RAG", icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: "agents", name: "Multi-Agent Loop", icon: <Cpu className="w-3.5 h-3.5" /> },
                    { id: "copilot", name: "AI Copilot", icon: <Bot className="w-3.5 h-3.5" /> },
                    { id: "rca", name: "RCA Agent", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
                    { id: "compliance", name: "Compliance Agent", icon: <Scale className="w-3.5 h-3.5" /> },
                    { id: "lessons", name: "Lessons Learned", icon: <Library className="w-3.5 h-3.5" /> },
                    { id: "maintenance", name: "Maintenance Tasker", icon: <ClipboardList className="w-3.5 h-3.5" /> },
                    { id: "audit", name: "Auditor trail", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
                    { id: "blueprint", name: "Blueprints", icon: <Settings className="w-3.5 h-3.5" /> }
                  ].map((tab) => {
                    // Check conditional tabs permissions
                    if (tab.id === "audit" && userProfile.role !== UserRole.Admin && userProfile.role !== UserRole.Auditor) {
                      return null; // hide completely
                    }
                    if (tab.id === "maintenance" && userProfile.role === UserRole.Auditor) {
                      return null; // hide completely
                    }

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-2 px-3 text-xs font-semibold rounded-sm flex items-center gap-1.5 transition-all outline-hidden cursor-pointer shrink-0 ${activeTab === tab.id ? "bg-indigo-600 text-white font-mono shadow-md" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"}`}
                      >
                        {tab.icon}
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] font-mono text-slate-550 text-left sm:text-right">
                  <span>PORTAL STATUS:</span>{" "}
                  <span className="font-extrabold text-emerald-450 tracking-wider">CLUSTER_SECURE_JWT_CLAIM_ACTIVE</span>
                </div>
              </div>

              {/* ACTIVE DIRECTORY SECTION */}
              <div className="flex-1 min-h-[500px]" id="active-panel-container">
                {activeTab === "health" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <AssetHealthTracker 
                      token={userProfile.token} 
                      userRole={userProfile.role}
                      onNavigateTab={(tab) => setActiveTab(tab)}
                      auditLogs={auditLogs}
                      setAuditLogs={setAuditLogs}
                      maintenanceTasks={maintenanceTasks}
                      setMaintenanceTasks={setMaintenanceTasks}
                    />
                  </motion.div>
                )}

                {activeTab === "graph" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <GraphExplorer userRole={userProfile.role} token={userProfile.token} />
                  </motion.div>
                )}

                {activeTab === "rag" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <RAGEngine token={userProfile.token} userRole={userProfile.role} />
                  </motion.div>
                )}

                {activeTab === "agents" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <AgentWorkflow token={userProfile.token} userRole={userProfile.role} />
                  </motion.div>
                )}

                {activeTab === "copilot" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <IndustrialCopilot token={userProfile.token} userRole={userProfile.role} />
                  </motion.div>
                )}

                {activeTab === "rca" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <RcaAgent token={userProfile.token} userRole={userProfile.role} />
                  </motion.div>
                )}

                {activeTab === "compliance" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ComplianceAgent token={userProfile.token} userRole={userProfile.role} />
                  </motion.div>
                )}

                {activeTab === "lessons" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <LessonsLearnedAgent token={userProfile.token} userRole={userProfile.role} />
                  </motion.div>
                )}


                {activeTab === "maintenance" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-850 pb-4 mb-5 gap-3">
                        <div>
                          <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-indigo-400" />
                            <span>Enterprise Maintenance Ledger</span>
                          </h2>
                          <p className="text-[11px] text-slate-400 font-sans mt-1">
                            Technicians can execute field repairs, inspect ASME-UG pressure thresholds, and complete safety-valve spring validations directly. Actions compile logs to the central Auditor Trail.
                          </p>
                        </div>
                        <button 
                          onClick={fetchMaintenanceTasks}
                          className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono rounded-sm transition cursor-pointer"
                        >
                          Refresh Ledger
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {maintenanceTasks.map((task: any) => {
                          const isPending = task.status === "Pending";
                          return (
                            <div key={task.id} className="border border-slate-800 bg-slate-950 p-4 rounded-sm flex flex-col justify-between gap-4 relative">
                              <div className="absolute top-4 right-4 text-[9px] font-mono">
                                <span className={`px-2 py-0.5 rounded-sm border ${task.severity === "Critical" ? "bg-rose-950/20 text-rose-400 border-rose-900/30" : task.severity === "High" ? "bg-amber-950/20 text-amber-400 border-amber-900/30" : "bg-blue-950/20 text-blue-400 border-blue-900/30"}`}>
                                  {task.severity} SEVERITY
                                </span>
                              </div>

                              <div className="space-y-2">
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{task.id}</span>
                                <h3 className="text-sm font-bold text-white leading-snug">{task.title}</h3>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{task.details}</p>
                              </div>

                              <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[11px]">
                                <div className="font-mono">
                                  <span className="text-slate-500 block text-[9px]">ASSIGNED TO</span>
                                  <span className="text-slate-300 font-bold block">{task.assignedTo || "Unassigned"}</span>
                                </div>

                                <div className="font-mono text-right">
                                  <span className="text-slate-500 block text-[9px]">SYSTEM STATE</span>
                                  <span className={`font-extrabold block uppercase tracking-wider text-[11px] ${task.status === "Completed" ? "text-emerald-450" : task.status === "In Progress" ? "text-amber-450" : "text-rose-450"}`}>
                                    {task.status}
                                  </span>
                                </div>
                              </div>

                              {isPending ? (
                                <button
                                  onClick={() => handleTransitionTask(task.id, "Completed")}
                                  disabled={isTransitioningTask === task.id || userProfile.role === UserRole.Auditor}
                                  className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-900 disabled:text-slate-600 text-white font-mono rounded-sm text-xs transition uppercase font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  {isTransitioningTask === task.id ? (
                                    <>
                                      <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                      <span>Dispatching Repair...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckSquare className="w-4 h-4" />
                                      <span>Dispatch & Complete Maintenance</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="mt-2 text-center p-2 bg-emerald-950/10 border border-emerald-900/20 text-emerald-450 text-[10.5px] font-mono rounded-sm flex items-center justify-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Task Resolved Perfectly</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {maintenanceTasks.length === 0 && (
                          <div className="col-span-2 text-center p-8 bg-slate-950 border border-slate-850 rounded-sm">
                            <span className="text-xs text-slate-500 font-mono italic">Polling live task schedules... configure supervisor roles.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "audit" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 shadow-xl">
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-4 mb-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">Enterprise Security Audit Logs</h2>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans mt-1">
                            Official, high-fidelity log output. Records all login handshakes, Access Token rotations, RAG uploads, and maintenance transitions. Suitable for regulatory compliance inspections.
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 max-w-sm w-full">
                          <input
                            type="text"
                            placeholder="Type keyword e.g. B-201, User, Successful..."
                            value={auditSearch}
                            onChange={e => setAuditSearch(e.target.value)}
                            className="w-full text-xs border border-slate-800 rounded-sm p-2 bg-slate-950 text-slate-200 placeholder-slate-600 focus:outline-hidden font-mono"
                          />
                        </div>
                      </div>

                      {/* Log table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-slate-300 font-mono border-collapse divide-y divide-slate-850">
                          <thead>
                            <tr className="text-slate-500 uppercase text-left tracking-wider">
                              <th className="py-2.5 px-3">Timestamp</th>
                              <th className="py-2.5 px-3">Actor</th>
                              <th className="py-2.5 px-3">Role Claim</th>
                              <th className="py-2.5 px-3">Operational Action</th>
                              <th className="py-2.5 px-3 text-center">Status</th>
                              <th className="py-1/2 px-3">Audit Log Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 leading-normal">
                            {filteredAuditLogs.map((log) => {
                              const isSuccess = log.status === "Success";
                              return (
                                <tr key={log.id} className="hover:bg-slate-950/40 transition">
                                  <td className="py-2 px-3 text-slate-500 select-none">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                  <td className="py-2 px-3 text-indigo-400 font-semibold">{log.actor}</td>
                                  <td className="py-2 px-3">
                                    <span className="bg-slate-950 border border-slate-850 text-slate-400 text-[8.5px] px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                      {log.role}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-slate-200">{log.action}</td>
                                  <td className="py-2 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${isSuccess ? "bg-emerald-950/20 text-emerald-450 border border-emerald-900/30" : "bg-rose-950/20 text-rose-450 border border-rose-900/30"}`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-400 font-sans break-words max-w-xs">{log.details}</td>
                                </tr>
                              );
                            })}

                            {filteredAuditLogs.length === 0 && (
                              <tr>
                                <td colSpan={6} className="text-center py-6 text-slate-500 italic">No logs matched search filters or waiting for server dispatch.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  </motion.div>
                )}

                {activeTab === "blueprint" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <DevOpsControl 
                      currentRole={userProfile.role} 
                      onChangeRole={(r) => {}} // Disabled legacy role changer
                      permissions={userProfile.permissions} 
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
