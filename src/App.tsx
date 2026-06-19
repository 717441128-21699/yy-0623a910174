import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Profile from "@/pages/Profile";
import Events from "@/pages/Events";
import Feedback from "@/pages/Feedback";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
