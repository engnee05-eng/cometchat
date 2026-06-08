import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Check if running in GitHub Actions and resolve repo name
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
const repoName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: isGithubActions ? `/${repoName}/` : '/',
})

