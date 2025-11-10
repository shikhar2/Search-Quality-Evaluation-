import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import EvaluationApp from './EvaluationApp'
import BatchEvaluationPage from './BatchEvaluationPage'  // NEW

import "../index.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/evaluate" element={<EvaluationApp />} />
        <Route path="/batch" element={<BatchEvaluationPage />} />
      </Routes>
    </Router>
  )
}

export default App
