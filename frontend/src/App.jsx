import React from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { Droplets, Fish as FishIcon, History as HistoryIcon, Info } from "lucide-react";
import TestPage from "./pages/TestPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ModelInfo from "./pages/ModelInfo.jsx";

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <FishIcon size={22} /> AquaTox <span>AI</span>
        </div>
        <nav className="tabs">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            <Droplets size={15} /> Test tank
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            <HistoryIcon size={15} /> Dashboard
          </NavLink>
          <NavLink to="/model" className={({ isActive }) => (isActive ? "active" : "")}>
            <Info size={15} /> Model info
          </NavLink>
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<TestPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/model" element={<ModelInfo />} />
        </Routes>
      </main>
    </div>
  );
}
