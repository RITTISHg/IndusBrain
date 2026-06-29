import React, { useState, useEffect, useRef } from "react";
import { Network, Plus, Cpu, ShieldAlert, FileCode, CheckCircle, Zap, Search, HelpCircle, Loader2, Factory, Settings, Layers, AlertOctagon, ClipboardList, User, MapPin, Flame } from "lucide-react";
import { KGNode, KGEdge, UserRole } from "../types";

interface GraphExplorerProps {
  userRole: UserRole;
  token: string | null;
}

export default function GraphExplorer({ userRole, token }: GraphExplorerProps) {
  const [nodes, setNodes] = useState<KGNode[]>([]);
  const [edges, setEdges] = useState<KGEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  // Ontology node creation form state
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState("Equipment");
  const [newNodePropKey, setNewNodePropKey] = useState("");
  const [newNodePropVal, setNewNodePropVal] = useState("");

  // Edge creation state
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [edgeLabel, setEdgeLabel] = useState("MONITORS");

  // Gemini AI Extraction Panel states
  const [rawText, setRawText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionFeedback, setExtractionFeedback] = useState("");

  // SVG Coordinates state
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const containerRef = useRef<HTMLDivElement>(null);

   // Fetch live graph dataset
  const fetchGraphData = async () => {
    try {
      const resp = await fetch("/api/graph/data", {
        headers: {
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        }
      });
      const data = await resp.json();
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (e) {
      console.error("Error reading graph data:", e);
    }
  };

  useEffect(() => {
    if (token || localStorage.getItem("indus_token")) {
      fetchGraphData();
    }
  }, [token]);

  // Compute layered concentric ring layout based on industrial ontology classes
  useEffect(() => {
    if (nodes.length === 0) return;
    const width = 640;
    const height = 480;
    const center = { x: width / 2, y: height / 2 };
    const positions: Record<string, { x: number; y: number }> = {};

    const assets = nodes.filter(n => n.type === "Asset");
    const machines = nodes.filter(n => n.type === "Machine" || n.type === "Equipment");
    const internals = nodes.filter(n => n.type === "Component" || n.type === "Operator" || n.type === "Location");
    const externals = nodes.filter(n => !assets.includes(n) && !machines.includes(n) && !internals.includes(n));

    // Place primary assets at the absolute center
    assets.forEach((node, idx) => {
      positions[node.id] = {
        x: center.x + (idx === 0 ? 0 : (idx % 2 === 0 ? 50 : -50)),
        y: center.y + (idx === 0 ? 0 : (idx % 2 === 0 ? -25 : 25))
      };
    });

    // Place machines in circle 1 (radius = 90)
    machines.forEach((node, idx) => {
      const angle = (idx / (machines.length || 1)) * 2 * Math.PI - Math.PI / 2;
      positions[node.id] = {
        x: center.x + 95 * Math.cos(angle),
        y: center.y + 95 * Math.sin(angle)
      };
    });

    // Place components/operators/locations in circle 2 (radius = 175)
    internals.forEach((node, idx) => {
      const angle = (idx / (internals.length || 1)) * 2 * Math.PI + Math.PI / 6;
      positions[node.id] = {
        x: center.x + 175 * Math.cos(angle),
        y: center.y + 175 * Math.sin(angle)
      };
    });

    // Place sensors/standards/failures/incidents in outer circle 3 (radius = 250)
    externals.forEach((node, idx) => {
      const angle = (idx / (externals.length || 1)) * 2 * Math.PI - Math.PI / 4;
      positions[node.id] = {
        x: center.x + 250 * Math.cos(angle),
        y: center.y + 250 * Math.sin(angle)
      };
    });

    setNodePositions(positions);
  }, [nodes]);

  // Handle direct node manual addition
  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel) return;

    const props: Record<string, string> = {
      created_by: "Engineering Console",
      creation_time: new Date().toLocaleTimeString()
    };
    if (newNodePropKey && newNodePropVal) {
      props[newNodePropKey] = newNodePropVal;
    }

    try {
      const resp = await fetch("/api/graph/nodes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({ label: newNodeLabel, type: newNodeType, properties: props })
      });
      if (resp.ok) {
        const data = await resp.json();
        setNodes(prev => [...prev, data.node]);
        setSelectedNode(data.node);
        setNewNodeLabel("");
        setNewNodePropKey("");
        setNewNodePropVal("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle manual edge creation
  const handleAddEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeSource || !edgeTarget) return;

    try {
      const resp = await fetch("/api/graph/edges", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || localStorage.getItem("indus_token")}`
        },
        body: JSON.stringify({ source: edgeSource, target: edgeTarget, label: edgeLabel, properties: {} })
      });
      if (resp.ok) {
        const data = await resp.json();
        setEdges(prev => [...prev, data.edge]);
        setEdgeSource("");
        setEdgeTarget("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Run Real-time Gemini Industrial text parsing API!
  const triggerAIExtraction = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    setExtractionFeedback("");

    try {
      const resp = await fetch("/api/graph/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ text: rawText })
      });

      const data = await resp.json();
      if (resp.ok) {
        setNodes(data.currentGraph.nodes);
        setEdges(data.currentGraph.edges);
        setRawText("");
        setExtractionFeedback(`AI Success: Mapped ${data.extracted.nodes?.length || 0} entities and ${data.extracted.edges?.length || 0} semantic relationships directly to your Neo4j pipeline!`);
      } else {
        setExtractionFeedback(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setExtractionFeedback(`API Exception: Ensure GEMINI_API_KEY is active in Settings.`);
    } finally {
      setIsExtracting(false);
    }
  };

  // Filters and Query selection
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          node.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterType === "All" || node.type === filterType;
    return matchesSearch && matchesCategory;
  });

  // Unique types helper
  const nodeTypes = ["Asset", "Machine", "Component", "Sensor", "Standard", "Failure", "Activity", "Operator", "Location", "Incident", "Equipment", "Hazard"];

  // Colors mapping for industrial nodes
  const typeColors: Record<string, { bg: string, text: string, border: string, dot: string }> = {
    Asset: { bg: "bg-blue-950/40 hover:bg-blue-900/40", text: "text-blue-400", border: "border-blue-900/60", dot: "#3b82f6" },
    Machine: { bg: "bg-cyan-950/40 hover:bg-cyan-900/40", text: "text-cyan-400", border: "border-cyan-900/60", dot: "#06b6d4" },
    Component: { bg: "bg-indigo-950/40 hover:bg-indigo-900/40", text: "text-indigo-400", border: "border-indigo-900/60", dot: "#6366f1" },
    Sensor: { bg: "bg-amber-950/40 hover:bg-amber-900/40", text: "text-amber-400", border: "border-amber-900/60", dot: "#f59e0b" },
    Standard: { bg: "bg-emerald-950/40 hover:bg-emerald-900/40", text: "text-emerald-400", border: "border-emerald-900/60", dot: "#10b981" },
    Failure: { bg: "bg-rose-950/40 hover:bg-rose-900/40", text: "text-rose-400", border: "border-rose-900/60", dot: "#ef4444" },
    Activity: { bg: "bg-sky-950/40 hover:bg-sky-900/40", text: "text-sky-450", border: "border-sky-900/60", dot: "#0ea5e9" },
    Operator: { bg: "bg-teal-950/40 hover:bg-teal-900/40", text: "text-teal-400", border: "border-teal-900/60", dot: "#14b8a6" },
    Location: { bg: "bg-purple-950/40 hover:bg-purple-900/40", text: "text-purple-400", border: "border-purple-900/60", dot: "#a855f7" },
    Incident: { bg: "bg-orange-950/40 hover:bg-orange-900/40", text: "text-orange-400", border: "border-orange-900/60", dot: "#f97316" },
    Equipment: { bg: "bg-slate-950/40 hover:bg-slate-900/40", text: "text-slate-400", border: "border-slate-800/60", dot: "#64748b" },
    Hazard: { bg: "bg-red-950/40 hover:bg-red-900/40", text: "text-red-400", border: "border-red-900/60", dot: "#dc2626" }
  };

  // Node symbol helper
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "Asset": return <Factory className="w-4 h-4 text-blue-400" id={`icon-${type}`} />;
      case "Machine": return <Settings className="w-4 h-4 text-cyan-400" id={`icon-${type}`} />;
      case "Component": return <Layers className="w-4 h-4 text-indigo-400" id={`icon-${type}`} />;
      case "Sensor": return <Cpu className="w-4 h-4 text-amber-550" id={`icon-${type}`} />;
      case "Standard": return <FileCode className="w-4 h-4 text-emerald-450" id={`icon-${type}`} />;
      case "Failure": return <AlertOctagon className="w-4 h-4 text-rose-450" id={`icon-${type}`} />;
      case "Activity": return <ClipboardList className="w-4 h-4 text-sky-400" id={`icon-${type}`} />;
      case "Operator": return <User className="w-4 h-4 text-teal-400" id={`icon-${type}`} />;
      case "Location": return <MapPin className="w-4 h-4 text-purple-400" id={`icon-${type}`} />;
      case "Incident": return <Flame className="w-4 h-4 text-orange-400" id={`icon-${type}`} />;
      case "Equipment": return <Settings className="w-4 h-4 text-slate-400" id={`icon-${type}`} />;
      case "Hazard": return <ShieldAlert className="w-4 h-4 text-rose-450" id={`icon-${type}`} />;
      default: return <Network className="w-4 h-4 text-indigo-400" id={`icon-${type}`} />;
    }
  };

  const hasWritePermission = userRole === UserRole.Admin || userRole === UserRole.Engineer;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="graph-explorer-root">
      
      {/* 2D Force-Directed Map Visualizer Container */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-sm shadow-xl overflow-hidden flex flex-col h-[650px] relative">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-950/40 text-indigo-400 border border-indigo-900/45 rounded-sm">
              <Network className="w-5 h-5" id="nav-network-icon" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-100 text-sm tracking-tight uppercase">Industrial Ontology & Graph Visualizer</h2>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider">NEO4J SCHEMA STATUS: ONLINE (BOLT://LOCALHOST:7687)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input 
                type="text" 
                placeholder="Search nodes..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-800 rounded-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-950 text-slate-200 placeholder-slate-555 w-36 sm:w-48"
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs border border-slate-800 rounded-sm p-1.5 bg-slate-950 font-mono text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Entities</option>
              {nodeTypes.map(type => (
                <option key={type} value={type} className="bg-slate-900 text-slate-200">{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live SVG Panel representing digital twin relationships */}
        <div className="flex-1 bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] relative overflow-hidden" ref={containerRef}>
          <svg className="w-full h-full absolute inset-0 select-none">
            {/* Draw Relationship Lines */}
            {edges.map((edge) => {
              const srcPos = nodePositions[edge.source];
              const tgtPos = nodePositions[edge.target];
              if (!srcPos || !tgtPos) return null;

              // Calculate arrow heads offset
              const dx = tgtPos.x - srcPos.x;
              const dy = tgtPos.y - srcPos.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len === 0) return null;

              const uX = dx / len;
              const uY = dy / len;

              // Anchor offsets to draw outside cell circle
              const nodeRad = 20;
              const startX = srcPos.x + nodeRad * uX;
              const startY = srcPos.y + nodeRad * uY;
              const endX = tgtPos.x - (nodeRad + 11) * uX;
              const endY = tgtPos.y - (nodeRad + 11) * uY;

              const isHighlighted = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

              return (
                <g key={edge.id} className="transition-all duration-300">
                  <defs>
                    <marker
                      id={`arrow-${edge.id}`}
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={isHighlighted ? "#818cf8" : "#475569"} />
                    </marker>
                  </defs>
                  
                  {/* Base connection line */}
                  <line 
                    x1={startX} 
                    y1={startY} 
                    x2={endX} 
                    y2={endY} 
                    stroke={isHighlighted ? "#6366f1" : "#1e293b"}
                    strokeWidth={isHighlighted ? 2.2 : 1.2}
                    markerEnd={`url(#arrow-${edge.id})`}
                    strokeDasharray={edge.label === "MONITORS" ? "4 2" : "none"}
                  />

                  {/* Relationship Text label in middle */}
                  <g transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2})`}>
                    <rect 
                      x="-42" 
                      y="-7" 
                      width="84" 
                      height="14" 
                      rx="1" 
                      fill="#020617" 
                      stroke={isHighlighted ? "#4f46e5" : "#1e293b"} 
                      strokeWidth="1"
                    />
                    <text 
                      textAnchor="middle" 
                      dominantBaseline="central" 
                      className="text-[8px] font-mono font-bold tracking-wider" 
                      fill={isHighlighted ? "#a5b4fc" : "#64748b"}
                    >
                      {edge.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Draw Dynamic Nodes */}
            {filteredNodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const styles = typeColors[node.type] || typeColors.Equipment;
              const isSelected = selectedNode?.id === node.id;

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  {/* Pulsing ring indicator if selected */}
                  {isSelected && (
                    <circle r="34" fill="none" stroke="#6366f1" strokeWidth="2" className="animate-ping opacity-25" />
                  )}

                  {/* Node fill background */}
                  <circle 
                    r="24" 
                    fill={styles.dot} 
                    fillOpacity={isSelected ? 0.95 : 0.8}
                    stroke={isSelected ? "#818cf8" : "#020617"} 
                    strokeWidth={isSelected ? 2 : 1}
                    className="shadow-2xl group-hover:fill-opacity-100 transition-all duration-200"
                  />

                  {/* Vector overlay representation */}
                  <g transform="translate(-8, -8)" className="pointer-events-none">
                    {React.cloneElement(getNodeIcon(node.type), { className: "w-4 h-4 text-white" })}
                  </g>

                  {/* Bottom title string */}
                  <g transform="translate(0, 36)" className="pointer-events-none">
                    <rect 
                      x="-60" 
                      y="-10" 
                      width="120" 
                      height="20" 
                      rx="1" 
                      fill="#020617" 
                      stroke={isSelected ? "#6366f1" : "#1e293b"}
                      strokeWidth="1"
                    />
                    <text 
                      textAnchor="middle" 
                      dominantBaseline="central" 
                      className="text-[9px] font-mono text-slate-300 fill-current"
                    >
                      {node.label.length > 18 ? `${node.label.substring(0, 16)}...` : node.label}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
          
          <div className="absolute bottom-4 left-4 bg-slate-950/95 text-slate-200 p-3 rounded-sm text-[10px] font-mono flex flex-col gap-1.5 shadow-2xl border border-slate-800 pointer-events-none max-w-xs">
            <span className="font-bold text-indigo-400 mb-1 border-b border-slate-800 pb-1">NEO4J SCHEMA LEGEND</span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#3b82f6]" /> <span>Asset</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#06b6d4]" /> <span>Machine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#6366f1]" /> <span>Component</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#f59e0b]" /> <span>Sensor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#10b981]" /> <span>Standard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#ef4444]" /> <span>Failure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#0ea5e9]" /> <span>Activity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#14b8a6]" /> <span>Operator</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#a855f7]" /> <span>Location</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-sm bg-[#f97316]" /> <span>Incident</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Console on the right */}
      <div className="lg:col-span-4 flex flex-col gap-6" id="ontology-controls-container">
        
        {/* Selected Node Details Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 shadow-xl">
          <h3 className="text-xs font-semibold text-slate-400 uppercase font-mono tracking-wider mb-3">Selected Conceptual Entity</h3>
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`p-2.5 rounded-sm border ${typeColors[selectedNode.type]?.bg} ${typeColors[selectedNode.type]?.border}`}>
                  {getNodeIcon(selectedNode.type)}
                </span>
                <div>
                  <h4 className="font-semibold text-slate-100 text-sm tracking-tight">{selectedNode.label}</h4>
                  <span className="inline-block text-[9px] bg-slate-950 font-mono text-indigo-400 border border-slate-800 px-2 py-0.5 rounded-sm uppercase mt-0.5">
                    {selectedNode.type}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2">
                <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Document & Graph Properties</h5>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(selectedNode.properties || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center text-[10px] font-mono py-1.5 bg-slate-950 border border-slate-850 px-2.5 rounded-sm">
                      <span className="text-slate-500">{key}:</span>
                      <span className="text-slate-350 font-semibold">{value}</span>
                    </div>
                  ))}
                  {Object.keys(selectedNode.properties || {}).length === 0 && (
                    <p className="text-xs text-slate-500 italic font-mono">No custom metadata parameters mapped.</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Active Semantic Paths</span>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map(e => {
                    const srcNode = nodes.find(n => n.id === e.source);
                    const tgtNode = nodes.find(n => n.id === e.target);
                    return (
                      <div key={e.id} className="text-[10px] bg-slate-950 p-2.5 rounded-sm border border-slate-850 font-mono flex items-center justify-between text-slate-400">
                        <span>{srcNode?.label || "Source"}</span>
                        <span className="text-indigo-400 font-bold">-{e.label}→</span>
                        <span>{tgtNode?.label || "Target"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center border border-dashed border-slate-800 rounded-sm">
              <HelpCircle className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
              <p className="text-xs text-slate-500 font-mono max-w-[200px] mx-auto">Select a node from the workspace grid to query attributes and dependencies.</p>
            </div>
          )}
        </div>

        {/* Gemini RAG Graph Ingest System */}
        <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 bg-indigo-950/40 text-indigo-400 rounded-sm border border-indigo-900/40">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-semibold uppercase text-slate-200 font-mono tracking-wider">AI Schema Builder</h3>
          </div>
          <p className="text-[11px] text-slate-450 mb-3 leading-relaxed">
            Paste raw technical manuals / system diagrams. Gemini reads definitions and integrates relationships onto Neo4j automatically.
          </p>

          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            disabled={!hasWritePermission || isExtracting}
            placeholder="e.g., Water Valve V-102 belongs to the main steam reservoir. Sensor S-1 monitors pressure values on steam vents."
            className="w-full h-24 p-2.5 text-xs border border-slate-800 rounded-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-950/50 bg-slate-950 text-slate-250 placeholder-slate-600"
          />

          <button
            onClick={triggerAIExtraction}
            disabled={!hasWritePermission || isExtracting || !rawText.trim()}
            className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 font-semibold rounded-sm text-xs font-mono transition duration-150 flex items-center justify-center gap-1.5"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Gemini Ontologist...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Execute AI Extraction</span>
              </>
            )}
          </button>

          {!hasWritePermission && (
            <p className="text-[9px] text-rose-500 font-mono mt-2">
              🔑 Permission failure. Elevate user role to Admin or Engineer to write.
            </p>
          )}

          {extractionFeedback && (
            <div className={`mt-3 p-2.5 rounded-sm text-[10px] font-mono leading-relaxed ${extractionFeedback.startsWith("AI Success") ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30" : "bg-slate-950 text-slate-400 border border-slate-850"}`}>
              {extractionFeedback}
            </div>
          )}
        </div>

        {/* Manual Graph Append Component */}
        <div className="bg-slate-900 border border-slate-800 rounded-sm p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1 bg-indigo-950/40 text-indigo-400 rounded-sm border border-indigo-900/40">
              <Plus className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-semibold uppercase text-slate-200 font-mono tracking-wider">Manual Node Append</h3>
          </div>

          <form onSubmit={handleAddNode} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-1">Entity Type</label>
                <select
                  value={newNodeType}
                  onChange={e => setNewNodeType(e.target.value)}
                  disabled={!hasWritePermission}
                  className="w-full text-xs border border-slate-800 rounded-sm p-1.5 bg-slate-950 text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  {nodeTypes.map(type => (
                    <option key={type} value={type} className="bg-slate-900 text-slate-200">{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-1">Concept Name</label>
                <input
                  type="text"
                  placeholder="e.g., Turbine-203"
                  value={newNodeLabel}
                  onChange={e => setNewNodeLabel(e.target.value)}
                  disabled={!hasWritePermission}
                  className="w-full text-xs border border-slate-800 rounded-sm p-1.5 bg-slate-950 text-slate-200 placeholder-slate-650 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-1">Prop Key (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., threshold"
                  value={newNodePropKey}
                  onChange={e => setNewNodePropKey(e.target.value)}
                  disabled={!hasWritePermission}
                  className="w-full text-xs border border-slate-800 rounded-sm p-1.5 bg-slate-950 text-slate-200 placeholder-slate-650 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-slate-500 block mb-1">Prop Value (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 420C"
                  value={newNodePropVal}
                  onChange={e => setNewNodePropVal(e.target.value)}
                  disabled={!hasWritePermission}
                  className="w-full text-xs border border-slate-800 rounded-sm p-1.5 bg-slate-950 text-slate-200 placeholder-slate-650 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!hasWritePermission || !newNodeLabel}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-800 disabled:text-slate-500 font-bold rounded-sm text-xs font-mono transition duration-150 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Node</span>
            </button>
          </form>

          {/* Connect node relationships manually */}
          <div className="border-t border-slate-800 mt-4 pt-4">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">Publish Edge Relationship</h4>
            <form onSubmit={handleAddEdge} className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <select
                    value={edgeSource}
                    onChange={e => setEdgeSource(e.target.value)}
                    disabled={!hasWritePermission || nodes.length === 0}
                    className="w-full text-xs border border-slate-800 rounded-sm p-1 px-1.5 bg-slate-950 text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="" className="bg-slate-900 text-slate-200">Source</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id} className="bg-slate-900 text-slate-200">{n.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={edgeLabel}
                    onChange={e => setEdgeLabel(e.target.value)}
                    disabled={!hasWritePermission}
                    className="w-full text-xs border border-slate-800 rounded-sm p-1 px-1.5 bg-slate-950 text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="MONITORS" className="bg-slate-900 text-slate-200">MONITORS</option>
                    <option value="CONTAINS" className="bg-slate-900 text-slate-200">CONTAINS</option>
                    <option value="COMPLIES_WITH" className="bg-slate-900 text-slate-200">COMPLIES_WITH</option>
                    <option value="CAUSES" className="bg-slate-900 text-slate-200">CAUSES</option>
                    <option value="RISK_OF" className="bg-slate-900 text-slate-200">RISK_OF</option>
                  </select>
                </div>
                <div>
                  <select
                    value={edgeTarget}
                    onChange={e => setEdgeTarget(e.target.value)}
                    disabled={!hasWritePermission || nodes.length === 0}
                    className="w-full text-xs border border-slate-800 rounded-sm p-1 px-1.5 bg-slate-950 text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="" className="bg-slate-900 text-slate-200">Target</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id} className="bg-slate-900 text-slate-200">{n.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!hasWritePermission || !edgeSource || !edgeTarget}
                className="w-full py-1.5 bg-slate-950 border border-slate-800 text-indigo-400 hover:bg-slate-850 hover:text-indigo-300 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-850 font-mono font-semibold rounded-sm text-xs transition duration-150"
              >
                Assemble Connection
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
