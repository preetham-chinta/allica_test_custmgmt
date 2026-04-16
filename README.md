# Allica Bank POC - Quick Start Guide

This repository contains a full-stack proof-of-concept for a modern Customer Management system, featuring both **Spring Boot (MVC & WebFlux)** backends and a **React (Rspack)** frontend.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Java 21+** (for Spring Boot 3.2+)
- **Node.js 18+** (for the React frontend)
- **Bash-compatible shell** (macOS/Linux)

## 🚀 Quick Setup (3 Minutes)

Run the automated setup script to configure the environment, install dependencies, and prepare the database:

```bash
chmod +x setup.sh start.sh
./setup.sh
```

The script will:

- Verify Java and Node versions.
- Install frontend dependencies (`npm install`).
- Pre-download backend Gradle dependencies.

## 🏁 Starting the Application

Launch both backends and the frontend concurrently with a single command:

```bash
./start.sh
```

Once started, the application is available at:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Spring MVC Backend**: [http://localhost:8080](http://localhost:8080/actuator/health)
- **Spring WebFlux Backend**: [http://localhost:8081](http://localhost:8081/actuator/health)

> [!TIP]
> Use the **"Sign in (dev mode)"** button on the frontend to automatically bypass authentication.

## 🧪 Testing

To ensure everything is working correctly, you can run the following test suites:

### Backend Tests (Java/JUnit)

Runs all unit and integration tests for both MVC and WebFlux modules:

```bash
./gradlew test
```

### Frontend Tests (Jest/React)

Runs the React test suite with MSW 2.0 mocks:

```bash
cd frontend
npm test
```

## 🏗️ Architecture Overview

- **`backend-mvc`**: Traditional Spring Boot MVC with Hibernate Search 7 (Lucene) for full-text search.
- **`backend-webflux`**: Reactive Spring Boot using R2DBC for high-throughput streaming events.
- **`frontend`**: High-performance React application using **Rspack** (Rust-based webpack drop-in) for ultra-fast builds.
- **Security**: OIDC-ready with a `DevAuthFilter` enabled in the `dev` profile for easy local development.
