const cluster = require("cluster");
const os = require("os");

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork(); // relance un worker si un meurt
  });
} else {
  const workerId = cluster.worker.id;
  const pid = process.pid;

  // Redéfinir console.log pour ajouter l'ID du worker
  const oldLog = console.log;
  console.log = (...args) => {
    oldLog(`[Worker ${workerId} | PID ${pid}]`, ...args);
  };

  // Ici, tu lances ton application réelle
  require("./index.js");
}
