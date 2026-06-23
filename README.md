# INDUS BRAIN

An enterprise-grade, high-performance Unified Asset & Operations Intelligence Platform. This system transforms scattered industrial documents into a centralized intelligent operational brain using Retrieval-Augmented Generation (RAG), dynamic industrial knowledge graphs, and multi-agent workflows.

Designed and developed by **Riti** (@riti2005g) as a unified system to predict equipment failures, optimize maintenance decision matrices, automate compliance auditing, and preserve expert engineering knowledge.

---

## 🚀 Key Features

- **Multi-Agent Operational Orchestration**: Utilizes tailored supervisor agent hierarchies and sub-agents (Ingress, Retrieval, Diagnostic, Compliance) to analyze issues, query regulations, and draft safe solutions.
- **Dynamic Industrial Knowledge Graphs**: Fully interactive 3D/2D node visualization mapping assets, processes, failures, and mitigation strategies with force-directed physics.
- **Hybrid Industrial RAG (Retrieval-Augmented Generation)**: Real-time vector-based and document-grounded processing to match ASME Section VIII codes and API standards.
- **Enterprise DevOps Automation Module**: Real-time code playground containing hardened Multi-Stage Dockerfiles, production-grade AWS ECS Fargate & Multi-AZ RDS Postgres Terraform scripts, and secure GitHub Actions CD pipelines.
- **Aesthetic Cyber-Industrial UI/UX**: Sleek, high-contrast dark visual design utilizing deep slate shades, precise cyber-industrial meters, responsive custom motion states, and clean data density.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion (Framer Motion), Lucide Icons
- **Backend / Services**: Express, Node.js (bundled with esbuild)
- **AI Integrations**: Gemini @google/genai SDK (server-side proxied)
- **Infrastructure Code**: Docker, Terraform (AWS VPC/ECS/RDS), GitHub Actions CI/CD pipelines
- **Styling**: Modern utility-first Tailwind classes

---

## 📦 Installation & Setup

Ensure you have Node.js 20+ installed on your system.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/riti2005g/indus-brain.git
   cd indus-brain
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and define the following variables:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   APP_URL="http://localhost:3000"
   ```

4. **Run in Development Mode**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

6. **Start Production Server**:
   ```bash
   npm run start
   ```

---

## 🐳 Containerization & DevOps

The platform includes production-hardened configurations for continuous deployment and scale automation:
- **`Dockerfile.backend`**: Multi-stage minimal footprint build for Python/FastAPI backends.
- **`Dockerfile.frontend`**: Dual-stage static server utilizing custom Nginx high-performance routing.
- **`terraform-aws.tf`**: VPC subnets, ECS Fargate cluster tasks, and Multi-AZ encrypted RDS PostgreSQL database provisioning.
- **`ci-cd-pipeline.yml`**: GitHub Actions runner testing, building, performing security vulnerability checks, and releasing directly to AWS.

---

## 🔒 Security & Compliance

The platform is engineered to align with ASME, API, and ISO safety standards. All credentials, API handshakes, and token processing run exclusively server-side via custom route proxies to ensure zero exposure of secure endpoints to the browser client.

---

*Hand-crafted with precision by Riti.*
