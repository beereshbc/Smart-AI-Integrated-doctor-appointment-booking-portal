import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { AdminContext } from '../context/AdminContext'
import { useNavigate } from 'react-router-dom'
import { DoctorContext } from '../context/DoctorContext'
import { SidebarContext } from '../context/SidebarContext'

const Navbar = () => {
  const { aToken, setAToken } = useContext(AdminContext)
  const { dToken, setDToken } = useContext(DoctorContext)
  const { toggleMobileMenu } = useContext(SidebarContext)

  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
  }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
      <div className='flex items-center gap-2 text-xs'>
        {/* Mobile Menu Toggle Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-lg bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <img
            src={assets.menu_icon}
            alt="Menu"
            className="w-6 h-6"
          />
        </button>

        {/* Logo */}
        <img className='w-36 sm:w-40 cursor-pointer' src={assets.admin_logo2} alt="" />
        
        <span className="ml-4 text-sm sm:text-base border cursor-pointer border-gray-300 text-gray-700 px-3 py-1 rounded-full bg-gray-50 font-medium hidden sm:block">
          {aToken ? 'Admin Panel' : 'Doctor Portal'}
        </span>
      </div>
      
      <button onClick={logout} className='bg-primary text-white text-sm px-6 sm:px-10 py-2 rounded-full'>
        Logout
      </button>
    </div>
  )
}

export default Navbar