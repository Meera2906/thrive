import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ParallaxAtmosphere from "./components/showcase/ParallaxAtmosphere";

/**
 * Thin routing shell. All data-fetching and UI logic lives in the page components.
 * ParallaxAtmosphere provides the universal dark twilight background.
 */
export default function App() {
  return (
    <ParallaxAtmosphere className="min-h-screen text-white">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </ParallaxAtmosphere>
  );
}
