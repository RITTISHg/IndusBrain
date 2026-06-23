export enum UserRole {
  Admin = "Admin",
  Engineer = "Engineer",
  Maintenance = "Maintenance Staff",
  Auditor = "Auditor"
}

export interface UserProfile {
  username: string;
  fullName: string;
  role: UserRole;
  permissions: string[];
  token: string | null;
  refreshToken: string | null;
  tokenExpiry?: number; // JWT expiration epoch timestamp
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  status: "Success" | "Failed";
  details: string;
}

export interface KGNode {
  id: string;
  label: string;
  type: string; // Equipment, Standard, Hazard, Sensor, Location
  properties: Record<string, string>;
}

export interface KGEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  properties: Record<string, string>;
}

export interface DocumentChunk {
  id: string;
  docName: string;
  content: string;
  metadata: {
    section?: string;
    page?: number;
    category?: string;
    equipmentCode?: string;
    asmeCode?: string;
    safetySeverity?: string;
    wordCount?: number;
    processedBy?: string;
    embeddingModel?: string;
    tags?: string[];
  };
}

export interface AgentStep {
  agentName: string;
  thought: string;
  verdict: string;
  severity: "Low" | "Medium" | "High" | "Critical";
}

export interface AgentWorkflowResult {
  workflowStatus: string;
  steps: AgentStep[];
  finalAssessment: string;
}

export interface LessonLearned {
  id: string;
  title: string;
  category: "Mechanical" | "Electrical" | "Operational" | "Safety" | "Calibration" | string;
  equipment: string;
  incidentDate: string;
  description: string;
  rootCause: string;
  preventativeAction: string;
  contributor: string;
  tags: string[];
}
