/* global importScripts, loadPyodide */
// Python runs outside the page's UI thread. No Python threads are created.
importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js');

(async () => {
  try {
    const python = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'
    });
    self.postMessage({ type: 'ready' });
    self.onmessage = async ({ data }) => {
      const { id, code } = data;
      const globals = python.toPy({ __name__: '__main__' });
      let result;
      try {
        result = await python.runPythonAsync(code, { globals });
        const value = result?.toJs ? result.toJs({ dict_converter: Object.fromEntries }) : result;
        self.postMessage({ type: 'result', id, value });
      } catch (error) {
        self.postMessage({ type: 'error', id, message: String(error) });
      } finally {
        result?.destroy?.();
        globals.destroy();
      }
    };
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error) });
  }
})();
