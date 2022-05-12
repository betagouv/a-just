import config from 'config'

if(!config.consoleLog) {
  // hide console log
  console.log('HIDE CONSOLE LOGS !!!')
  console.log = function () {}
}

import App from './App'

const app = new App()
app.start()

export default app

