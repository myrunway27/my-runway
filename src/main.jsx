import React from "react";
import ReactDOM from "react-dom/client";
import MyRunway from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MyRunway />
  </React.StrictMode>
);

// PWA: offline shell + home-screen install. Production only, so dev HMR stays untouched.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
