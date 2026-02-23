import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { CreateCourse } from './pages/CreateCourse';
import { CourseDetail } from './pages/CourseDetail';
import { Templates } from './pages/Templates';
import { Onboard } from './pages/Onboard';
import { OnboardVerify } from './pages/OnboardVerify';
import { OnboardRules } from './pages/OnboardRules';
import { OnboardDone } from './pages/OnboardDone';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<CreateCourse />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/onboard/:token" element={<Onboard />} />
        <Route path="/onboard/:token/verify" element={<OnboardVerify />} />
        <Route path="/onboard/:token/rules" element={<OnboardRules />} />
        <Route path="/onboard/:token/done" element={<OnboardDone />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
