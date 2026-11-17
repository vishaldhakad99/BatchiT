# Contributing to BatchiT

Thank you for your interest in contributing to **BatchiT**! We welcome bug fixes, documentation improvements, and new feature suggestions.

---

## 🛠️ Development Setup

1. **Prerequisites**:
   - **Node.js**: v20 LTS recommended.
   - **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/batchit`) or MongoDB Atlas URI.
   - **Git**: Configured with your name and email.

2. **Installation**:
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Running the Application Locally**:
   - Backend development server:
     ```bash
     cd server
     npm run dev
     ```
   - Frontend development server:
     ```bash
     cd client
     npm run dev
     ```

---

## 🧪 Testing & Verification

Before submitting changes, ensure all tests and builds pass:

1. **Backend Integration Tests**:
   ```bash
   cd server
   npm test
   ```
   All 12 Vitest integration tests should pass.

2. **Frontend Production Build**:
   ```bash
   cd client
   npm run build
   ```
   Vite should compile all modules and generate the distribution bundle without errors.

---

## 🌿 Branching & Pull Requests

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with meaningful commit messages.
3. Push your branch to GitHub and open a Pull Request targeting `main`.
4. Ensure the GitHub Actions CI workflow passes on your PR.
