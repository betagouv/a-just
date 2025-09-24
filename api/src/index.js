import App from './App'

const app = new App()

try {
  app.start()
  console.log('✅ APP BOOT OK')
} catch (err) {
  console.error('❌ APP CRASHED during start():', err)
  process.exit(1)
}

export default app
