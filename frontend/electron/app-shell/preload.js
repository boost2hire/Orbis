console.log("🔥 PRELOAD LOADED FROM:", __filename);

const { contextBridge } = require("electron");
const Store = require("electron-store").default;

console.log("🔥 electron-store loaded OK");

const store = new Store({
  projectName: "lumi-mirror",  // FIX ERROR
});

contextBridge.exposeInMainWorld("electronStore", {
  get: (key) => {
    console.log("📥 GET:", key);
    return store.get(key);
  },
  set: (key, value) => {
    console.log("📤 SET:", key, value);
    store.set(key, value);
  },
  delete: (key) => store.delete(key),
  clear: () => store.clear(),
});
// Set default city if not already set
if (!store.get("city")) {
  store.set("city", "Chandigarh");
}
