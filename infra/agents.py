import os
from typing import TypedDict, List, Dict, Any
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from google import genai
from google.genai import types

# Simulated State Graph dictionary representing LangGraph Workflow State
class AgentState(TypedDict):
    telemetry_id: str
    alert_message: str
    active_reading: Dict[str, Any]
    steps_log: List[Dict[str, str]]
    final_diagnosis: str
    current_agent: str

class IndusMultiAgentWorkflow:
    def __init__(self):
        # Initialize Google GenAI SDK Client
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            self.ai = genai.Client(api_key=api_key)
        else:
            self.ai = None

    def _call_gemini_agent(self, agent_role: str, system_instruction: str, context: str, user_prompt: str):
        if not self.ai:
            return f"[{agent_role} Offline Mode]: Simulated assessment generated pending active GEMINI_API_KEY."
            
        try:
            response = self.ai.models.generate_content(
                model="gemini-3.5-flash",
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=f"You are the {agent_role} inside the INDUS BRAIN multi-agent collective. {system_instruction}",
                    temperature=0.3
                )
            )
            return response.text
        except Exception as e:
            return f"[{agent_role} Error]: Processing failed owing to: {str(e)}"

    def operations_analyst_node(self, state: AgentState) -> AgentState:
        """Agent Node 1: Review operational data telemetry parameters."""
        prompt = f"Analyze the active incident alerts: '{state['alert_message']}' for Telemetry ID {state['telemetry_id']}."
        instruction = "Examine raw boiler pressures, thermocouple temperatures, flow parameters, and categorize structural alarms."
        
        verdict = self._call_gemini_agent(
            "Operations Analyst",
            instruction,
            "",
            prompt
        )
        
        state["steps_log"].append({
            "agent": "Operations Analyst",
            "verdict": verdict
        })
        state["current_agent"] = "Safety & Risk Assessor"
        return state

    def safety_assessor_node(self, state: AgentState) -> AgentState:
        """Agent Node 2: Check safety and hazard metrics."""
        prev_verdict = state["steps_log"][-1]["verdict"] if state["steps_log"] else ""
        prompt = f"Given incident '{state['alert_message']}' and Analyst verdict: '{prev_verdict}', check threat severity."
        instruction = "Pinpoint physical dangers. For instance, risk of structural overpressure explosions, fluid leaks, or valve blockades."
        
        verdict = self._call_gemini_agent(
            "Safety & Risk Assessor",
            instruction,
            "",
            prompt
        )
        
        state["steps_log"].append({
            "agent": "Safety & Risk Assessor",
            "verdict": verdict
        })
        state["current_agent"] = "Compliance Officer"
        return state

    def compliance_officer_node(self, state: AgentState) -> AgentState:
        """Agent Node 3: Audit regulatory framework compliances (ASME/OSHA)."""
        prev_safety = state["steps_log"][-1]["verdict"] if state["steps_log"] else ""
        prompt = f"Incident details: '{state['alert_message']}'. Safety analysis predicts: '{prev_safety}'. Check Compliance standard overlaps."
        instruction = "Apply ASME Section VIII pressure relief device rules, compliance metrics, and OSHA protocol checklists."
        
        verdict = self._call_gemini_agent(
            "Compliance Officer",
            instruction,
            "",
            prompt
        )
        
        state["steps_log"].append({
            "agent": "Compliance Officer",
            "verdict": verdict
        })
        state["current_agent"] = "Lead Coordinator"
        return state

    def lead_coordinator_node(self, state: AgentState) -> AgentState:
        """Agent Node 4: Resolve consensus and establish action instructions."""
        history = "\n".join([f"- {s['agent']}: {s['verdict']}" for s in state["steps_log"]])
        prompt = f"Audit History of Agent Findings:\n{history}\n\nEstablish the definitive mitigation mandate."
        instruction = "Aggregate operational telemetry, hazard bounds, and ASME regulations into an actionable operational check team task list."
        
        verdict = self._call_gemini_agent(
            "Lead Coordinator",
            instruction,
            "",
            prompt
        )
        
        state["steps_log"].append({
            "agent": "Lead Coordinator",
            "verdict": verdict
        })
        state["final_diagnosis"] = verdict
        state["current_agent"] = "Completed"
        return state

    def execute_workflow_loop(self, telemetry_id: str, alert_message: str) -> Dict[str, Any]:
        """
        Orchestrate step-by-step state machine routing (LangGraph simulation).
        """
        state: AgentState = {
            "telemetry_id": telemetry_id,
            "alert_message": alert_message,
            "active_reading": {"pressure": "14.2 Bar", "temperature": "415C"},
            "steps_log": [],
            "final_diagnosis": "",
            "current_agent": "Operations Analyst"
        }
        
        # Step 1
        state = self.operations_analyst_node(state)
        # Step 2
        state = self.safety_assessor_node(state)
        # Step 3
        state = self.compliance_officer_node(state)
        # Step 4
        state = self.lead_coordinator_node(state)
        
        return {
            "telemetryId": state["telemetry_id"],
            "workflowStatus": "Completed",
            "steps": [
                {
                    "agentName": s["agent"],
                    "thought": f"Processing ruleset for {s['agent']}...",
                    "verdict": s["verdict"],
                    "severity": "Critical" if "explosion" in s["verdict"].lower() or "safety" in s["agent"].lower() else "High"
                } for s in state["steps_log"]
            ],
            "finalAssessment": state["final_diagnosis"]
        }
