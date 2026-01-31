# MAFAI Dashboard & Engine

**MAFAI (Model Application Firewall AI)** is an advanced, AI-powered security middleware designed to protect applications from modern web threats. This repository contains the **Dashboard UI** and the **Analysis Engine**.

The system leverages local LLMs (via Ollama) to analyze request payloads for malicious intent (SQLi, XSS, Command Injection, etc.) with context-aware precision, reducing false positives compared to traditional regex-based WAFs.

## 🚀 Features

- **AI-Powered Analysis**: Uses the **Mistral** model (via Ollama) to intelligently detect security threats in request bodies.
- **Modern Dashboard**: A real-time, responsive UI built with **Next.js 15**, **Tailwind CSS**, and **Framer Motion** to visualize threats and manage policies.
- **3D Visualizations**: Interactive data visualization using **Three.js** and **React Three Fiber**.
- **Real-time Analytics**: Charts and graphs powered by **Recharts** to track traffic and blocked requests.
- **Microservices Architecture**: Fully containerized setup with Docker Compose, including:
    - **maf-ui**: The Next.js Dashboard (Port 3000).
    - **maf-engine**: The Express.js Analysis Engine (Port 3001).
    - **maf-ai**: Ollama service running the AI model (Port 11434).
    - **MongoDB**: For storing logs, policies, and application configurations.
    - **Redis**: For high-performance caching (future use).

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend**: Node.js, Express.js (Engine).
- **Database**: MongoDB (Mongoose ODM).
- **AI/ML**: Ollama (Mistral Model).
- **Infrastructure**: Docker, Docker Compose.

## 📦 Prerequisites

- **Docker** and **Docker Compose** installed on your machine.
- **Node.js** (Optional, for local development tasks).

## ⚡ Quick Start

The easiest way to run the entire stack is using Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd mafai-middleware/mafai-app
    ```

2.  **Start the services:**
    ```bash
    docker compose up --build
    ```
    *This command will build the images, start the containers, and automatically pull the required AI model (Mistral) into Ollama.*

3.  **Access the Application:**
    - **Dashboard**: [http://localhost:3000](http://localhost:3000)
    - **Engine API**: [http://localhost:3001/health](http://localhost:3001/health)

## 🔧 Development

### Directory Structure

- `src/`: Next.js source code (Pages, Components, Styles).
- `maf-engine/`: Source code for the Node.js Analysis Engine.
- `public/`: Static assets.

### Environment Variables

The project comes with pre-configured defaults in `docker-compose.yml`. Key variables include:

- `MONGODB_URI`: Connection string for MongoDB.
- `OLLAMA_HOST`: URL for the Ollama AI service.
- `NODE_ENV`: Set to `production` in Docker, use `development` locally.

## 🛡️ Architecture

1.  **Incoming Request** -> **Middleware** (e.g., Express Middleware in your app).
2.  **Middleware** -> **MAFAI Engine** (`/evaluate` endpoint).
3.  **Engine** -> **Ollama (AI)** analyzes the payload.
4.  **Engine** stores result in **MongoDB**.
5.  **Dashboard** queries **MongoDB** to display insights.
