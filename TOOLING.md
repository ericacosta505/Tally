# Tooling maintenance

Updated October 29, 2026.

Vite 8 and Vitest 5 replace deprecated Create React App. React 19 and current chart/router/API packages are installed. The backend and Docker runtime use Python 3.15.2; Python dependencies are current.

## Setup and verification

Use Node.js 26.13.0 (`nvm use` from the repository root) and npm 12.2.1.

```sh
npm install --global npm@12.2.1
cd frontend
npm ci
npm test
npm run build
```

The frontend keeps port 3000 and build/ output. VITE_API_URL is the preferred API override; REACT_APP_API_URL remains supported for existing deployments. Run python -m unittest discover -s tests -v from backend to verify the API. Docker image building requires a running Docker daemon.

CI runs on pull requests and pushes. Dependabot checks the package manifests and GitHub Actions weekly, grouping compatible minor/patch updates. Major updates remain separate for review.
