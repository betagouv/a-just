import { axiosDt } from "./axios";
import config from "config";
import os from "os";

export const selfRouteToSyncJuridiction = (juridictionId) =>
  axiosDt.post(`${config.serverUrl.replace('/api', '')}/docker/sync/update`, {
    type: "juridiction-agents",
    id: juridictionId,
    from: os.hostname(),
  });
