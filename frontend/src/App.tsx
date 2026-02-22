import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { CreateCourse } from './pages/CreateCourse';
import { CourseDetail } from './pages/CourseDetail';
import { Templates } from './pages/Templates';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<CreateCourse />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
