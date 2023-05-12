import axios from 'axios'
import config from 'config'

// Axios instance
export const instanceAxios = axios.create({
  baseURL: config.serverUrl,
})
