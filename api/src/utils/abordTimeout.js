
export async function withAbortTimeout(fn, timeoutMs = 5000) {
    const controller = new AbortController();
    const signal = controller.signal;
  
    const timeout = setTimeout(() => {
      console.warn("⏱️ Timeout atteint, appel de controller.abort()");
      controller.abort();
      console.warn("🚨 Signal d’abandon émis au traitement.");
    }, timeoutMs);
  
    try {
      const result = await new Promise((resolve, reject) => {
        if (signal.aborted) {
          return reject(new Error("⛔ Opération déjà annulée."));
        }
  
        const abortHandler = () => {
          reject(new Error("⏱️ Traitement annulé : timeout dépassé."));
        };
  
        signal.addEventListener("abort", abortHandler);
  
        Promise.resolve(fn(signal))
          .then(resolve)
          .catch(reject)
          .finally(() => {
            signal.removeEventListener("abort", abortHandler);
          });
      });
  
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }
  

  export const abortable = (fn, signal) => {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Error("Aborted before start"));
  
      const abortHandler = () => {
        reject(new Error("Aborted during execution"));
      };
  
      signal.addEventListener("abort", abortHandler);
  
      fn()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          signal.removeEventListener("abort", abortHandler);
        });
    });
  }

export function makeAbortableMethod(method, signal) {
    return (...args) => abortable(() => method(...args), signal);
  }

export function checkAbort(signal) {
  if (signal && signal.aborted) throw new Error("⛔ Traitement annulé");
}