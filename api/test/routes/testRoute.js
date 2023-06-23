import { instanceAxios } from '../utils/axios'
import config from 'config'

export const onTestRoute = async () => await instanceAxios.get(config.serverUrl)
