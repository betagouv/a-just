import { instanceAxios } from '../utils/axios'
import config from 'config'

export const onTestRoute = async () => {
  return await instanceAxios.get(config.serverUrl).then((res) => {
    return res
  })
}
