import { axiosDt } from './axios'
import config from 'config'
import os from 'os'

export const selfRouteToSyncJuridiction = async (juridictionId) => {
  const instancesFounded = []

  while (instancesFounded.length < config.nbInstances) {
    const newInstanceName = await axiosDt.post(`${config.serverUrl.replace('/api', '')}/docker/sync/update`, {
      type: 'juridiction-agents',
      id: juridictionId,
      from: os.hostname(),
    })
    if (newInstanceName.data && instancesFounded.indexOf(newInstanceName.data) === -1) {
      instancesFounded.push(newInstanceName.data)
    }

    console.log(instancesFounded)
  }
}

export const selfRouteToSyncAgent = async (agentId) => {
  const instancesFounded = []

  while (instancesFounded.length < config.nbInstances) {
    const newInstanceName = await axiosDt.post(`${config.serverUrl.replace('/api', '')}/docker/sync/update-agent`, {
      agentId,
      from: os.hostname(),
    })
    if (newInstanceName.data && instancesFounded.indexOf(newInstanceName.data) === -1) {
      instancesFounded.push(newInstanceName.data)
    }

    console.log(instancesFounded)
  }
}
