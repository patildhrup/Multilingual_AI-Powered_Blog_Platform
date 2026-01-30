import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import lingoCompiler from 'lingo.dev/compiler'

// https://vite.dev/config/
const viteConfig = {
  plugins: [react()],
}

export default defineConfig(() =>
  //   lingoCompiler.vite({
  //     models: "lingo.dev"
  //   })(viteConfig)
  viteConfig
)
