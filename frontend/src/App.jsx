import React, { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CursorTrail from './CursorTrail';
import { ToastContainer } from 'react-toastify';
import Notfound from './pages/Notfound'
import Jobs from './pages/Jobs'
import ChatWithDoctor from './pages/ChatWithDoctor';
import PatientAIChat from './components/PatientAIChat'; 

const App = () => {
  const location = useLocation();

  useEffect(() => {
    const handleDragStart = (e) => {
      const tag = e.target.tagName && e.target.tagName.toLowerCase();
      if (tag === 'img' || tag === 'svg') {
        e.preventDefault();
      }
    };

    document.addEventListener('dragstart', handleDragStart);
    return () => {
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  const aiPages = ['/', '/doctors', '/about', '/contact'];

  const showAIChat = aiPages.includes(location.pathname) || location.pathname.startsWith('/doctors/');

  return (
    <div className='mx-4 sm:mx-[10%]'>
      <ToastContainer/>
      <CursorTrail />
      <Navbar/>

      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/doctors' element={<Doctors/>} />
        <Route path='/doctors/:speciality' element={<Doctors/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/about' element={<About/>} />
        <Route path='/contact' element={<Contact/>} />
        <Route path='/my-profile' element={<MyProfile/>} />
        <Route path='/my-appointments' element={<MyAppointments/>} />
        <Route path='/appointment/:docId' element={<Appointment/>} />
        <Route path='/jobs' element={<Jobs/>} />
        <Route path='/chat/:appointmentId' element={<ChatWithDoctor/>} />
        <Route path='*' element={<Notfound/>}/>
      </Routes>

      {/* Conditional AI Chat */}
      {showAIChat && <PatientAIChat />}

      <Footer/>
    </div>
  )
}

export default App
