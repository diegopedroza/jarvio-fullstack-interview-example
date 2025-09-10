import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 3000,
        watch: {
            usePolling: true
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
})