import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { SidebarContext } from '../context/SidebarContext'

const Sidebar = () => {
    const { aToken } = useContext(AdminContext)
    const { dToken } = useContext(DoctorContext)
    const { isMobileMenuOpen, closeMobileMenu } = useContext(SidebarContext)

    return (
        <>
            {/* Overlay/Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed lg:sticky top-0 min-h-screen bg-white border-r border-gray-200 
                    w-64 flex-shrink-0 z-40 transition-transform duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    overflow-y-auto
                `}
            >
                {aToken && (
                    <div className='py-6'>
                        {/* Sidebar Header */}
                        <div className='px-6 mb-10'>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-extrabold text-transparent cursor-pointer bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 drop-shadow-lg transform transition-transform duration-300 hover:scale-105">
                                        Admin Panel
                                    </h2>
                                    <p className='text-xs md:text-sm text-gray-500 mt-1'>Manage your clinic</p>
                                </div>
                            </div>
                        </div>

                        <ul className='space-y-1 px-3'>
                            <NavLink
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-3 py-3.5 px-3 md:px-4 rounded-lg cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                                    }
                                `}
                                to={'/admin-dashboard'}
                            >
                                <img src={assets.home_icon} alt="" className='w-5 h-5 flex-shrink-0' />
                                <p className='font-medium text-sm'>Dashboard</p>
                            </NavLink>

                            <NavLink
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-3 py-3.5 px-3 md:px-4 rounded-lg cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                                    }
                                `}
                                to={'/all-appointments'}
                            >
                                <img src={assets.appointment_icon} alt="" className='w-5 h-5 flex-shrink-0' />
                                <p className='font-medium text-sm'>Appointments</p>
                            </NavLink>

                            <NavLink
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-3 py-3.5 px-3 md:px-4 rounded-lg cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                                    }
                                `}
                                to={'/add-doctors'}
                            >
                                <img src={assets.add_icon} alt="" className='w-5 h-5 flex-shrink-0' />
                                <p className='font-medium text-sm'>Add Doctor</p>
                            </NavLink>

                            <NavLink
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-3 py-3.5 px-3 md:px-4 rounded-lg cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                                    }
                                `}
                                to={'/doctor-list'}
                            >
                                <img src={assets.people_icon} alt="" className='w-5 h-5 flex-shrink-0' />
                                <p className='font-medium text-sm'>Doctors List</p>
                            </NavLink>

                            <NavLink
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-3 py-3.5 px-3 md:px-4 rounded-lg cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                                    }
                                `}
                                to={'/change-doctor-password'}
                            >
                                <img src={assets.password_icon} alt="" className='w-5 h-5 flex-shrink-0' />
                                <p className='font-medium text-sm whitespace-normal md:whitespace-nowrap'>Change Doctor Password</p>
                            </NavLink>
                        </ul>
                    </div>
                )}

                {dToken && (
                    <div className='py-6'>
                        {/* Sidebar Header */}
                        <div className='px-6 mb-10'>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 drop-shadow-lg transform transition-transform duration-300 hover:scale-105">
                                        Doctor Panel
                                    </h2>
                                    <p className='text-xs md:text-sm text-gray-500 mt-1'>Manage your clinic</p>
                                </div>
                            </div>
                        </div>

                        <ul className='space-y-1 px-3'>

                            <NavLink
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-3 py-3.5 px-3 md:px-4 rounded-lg cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                                    }
                                `}
                                to={'/doctor-profile'}
                            >
                                <img src={assets.people_icon} alt="" className='w-5 h-5 flex-shrink-0' />
                                <p className='font-medium text-sm'>Profile</p>
                            </NavLink>

                            <NavLink
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-3 py-3.5 px-3 md:px-4 rounded-lg cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                                    }
                                `}
                                to={'/doctor-dashboard'}
                            >
                                <img src={assets.home_icon} alt="" className='w-5 h-5 flex-shrink-0' />
                                <p className='font-medium text-sm'>Dashboard</p>
                            </NavLink>

                            <NavLink
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-3 py-3.5 px-3 md:px-4 rounded-lg cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                                    }
                                `}
                                to={'/doctor-appointments'}
                            >
                                <img src={assets.appointment_icon} alt="" className='w-5 h-5 flex-shrink-0' />
                                <p className='font-medium text-sm'>Appointments</p>
                            </NavLink>

                            {/* Add this new Chat NavLink for Doctors */}
                            <NavLink
                                onClick={closeMobileMenu}
                                className={({ isActive }) => `
                                    flex items-center gap-3 py-3.5 px-3 md:px-4 rounded-lg cursor-pointer
                                    transition-all duration-200 ease-in-out
                                    ${isActive
                                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                                    }
                                `}
                                to={'/doctor-chat'}
                            >
                                <svg
                                    className="w-5 h-5 flex-shrink-0"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                <p className='font-medium text-sm'>Messages</p>
                            </NavLink>
                        </ul >
                    </div >
                )}
            </div >
        </>
    )
}

export default Sidebar