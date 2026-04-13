import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AppContext } from '../context/AppContext'

const Navbar = () => {
    const navigate = useNavigate();

    const { token, setToken, userData, darkMode, toggleDarkMode } = useContext(AppContext)

    const [showMenu, setShowMenu] = useState(false);

    const logout = () => {
        setToken(false)
        localStorage.removeItem('token')
    }

    // Sun icon (light mode indicator)
    const SunIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
    )

    // Moon icon (dark mode indicator)
    const MoonIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
    )

    return (
        <motion.div
            className='w-[95%] mx-auto flex items-center justify-between text-sm py-5 mb-5 border-b border-b-gray-200 bg-white/80 backdrop-blur-md sticky top-2 z-50 px-4 md:px-8 shadow-[0_8px_32px_-8px_rgba(95,111,255,0.15),0_0_0_1px_rgba(95,111,255,0.08),0_4px_16px_-4px_rgba(0,0,0,0.06)] rounded-[50px]'
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
        >

            <motion.img
                onClick={() => { navigate('/'); scrollTo(0, 0) }}
                className='w-44 cursor-pointer hover:scale-105 transition-transform duration-300'
                src={assets.logo}
                alt=""
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: 'linear' }}
            />

            <ul className='custom-hide-desktop items-center gap-8 font-medium'>
                {[
                    { label: "HOME", path: "/" },
                    { label: "ALL DOCTORS", path: "/doctors" },
                    { label: "ABOUT", path: "/about" },
                    { label: "CONTACT", path: "/contact" },
                ].map((item, index) => (
                    <NavLink
                        key={index}
                        to={item.path}
                        onClick={() => window.scrollTo(0, 0)}
                        className="group"
                    >
                        {({ isActive }) => (
                            <motion.li
                                className={`py-2 px-1 relative transition-all duration-300 ease-out
                                    ${isActive
                                        ? "text-primary font-semibold text-lg"
                                        : "hover:text-primary1"
                                    }`}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 * index, ease: "easeOut" }}
                                style={{
                                    textShadow: isActive
                                        ? "0 0 4px rgba(59,130,246,0.4), 0 0 6px rgba(59,130,246,0.2)"
                                        : "0 0 3px rgba(59,130,246,0.2)"
                                }}
                            >
                                {item.label}
                                <hr
                                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full transition-transform duration-300 ${isActive ? "scale-x-100 h-1" : "scale-x-0 group-hover:scale-x-100"}`}
                                    style={{
                                        boxShadow: isActive
                                            ? "0 0 6px rgba(59,130,246,0.5), 0 0 10px rgba(59,130,246,0.3)"
                                            : "0 0 4px rgba(59,130,246,0.25)"
                                    }}
                                />
                            </motion.li>
                        )}
                    </NavLink>
                ))}
            </ul>

            <div className='flex items-center gap-4'>
                {
                    token
                        ? (
                            <motion.div
                                className='flex items-center gap-3 cursor-pointer group relative'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                            >
                                <img className='w-10 h-10 rounded-full border-2 border-gray-200 hover:border-primary1 transition-colors duration-300 object-cover' src={userData.image} alt="" />
                                <img className='w-2.5 group-hover:rotate-180 transition-transform duration-300' src={assets.dropdown_icon} alt="" />
                                <div className='absolute top-full right-0 mt-3 text-base font-medium text-gray-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2'>
                                    <div className='min-w-56 bg-white rounded-lg shadow-xl border border-gray-100 flex flex-col p-2'>
                                        <p onClick={() => {navigate('my-profile'); scrollTo(0,0)}} className='hover:bg-gray-50 hover:text-primary1 px-4 py-3 rounded-md cursor-pointer transition-all duration-200 flex items-center gap-3'>
                                            <span className='text-lg'>👤</span> My Profile
                                        </p>
                                        <p onClick={() => {navigate('my-appointments'); scrollTo(0,0)}} className='hover:bg-gray-50 hover:text-primary1 px-4 py-3 rounded-md cursor-pointer transition-all duration-200 flex items-center gap-3'>
                                            <span className='text-lg'>📅</span> My Appointments
                                        </p>
                                        <p onClick={() => logout()} className='hover:bg-red-50 hover:text-red-600 px-4 py-3 rounded-md cursor-pointer transition-all duration-200 flex items-center gap-3'>
                                            <span className='text-lg'>🚪</span> Logout
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button
                                onClick={() => navigate('/login')}
                                className='bg-primary1 text-white px-8 py-3 rounded-full hidden lg:block hover:shadow-lg hover:scale-105 transition-all duration-300 relative overflow-hidden group'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                            >
                                <span className='relative z-10'>Create account</span>
                                <div className='absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300'></div>
                            </motion.button>
                        )
                }

                {/* ── Dark / Light Mode Toggle ── */}
                <motion.button
                    onClick={toggleDarkMode}
                    className='relative w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all duration-300 hover:scale-110 hover:shadow-md dark-toggle-btn'
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <motion.span
                        key={darkMode ? 'moon' : 'sun'}
                        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                        animate={{ rotate: 0, opacity: 1, scale: 1 }}
                        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3 }}
                    >
                        {darkMode ? <SunIcon /> : <MoonIcon />}
                    </motion.span>
                </motion.button>

                {/* ✅ UPDATED: make menu icon visible up to 1000px */}
                <div className='flex items-center gap-3 lg:hidden'>
                    <img
                        onClick={() => setShowMenu(true)}
                        className='w-6 cursor-pointer'
                        src={assets.menu_icon}
                        alt="menu"
                    />
                </div>

                {/* ✅ UPDATED: mobile menu visible up to lg breakpoint (1000px) */}
                <motion.div
                    className={`fixed left-0 right-0 top-0 lg:hidden z-50 transition-all duration-500 ease-in-out ${showMenu ? 'visible' : 'invisible'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showMenu ? 1 : 0 }}
                >
                    {/* Backdrop */}
                    <div
                        className={`fixed inset-0 bg-black transition-opacity duration-500 ${showMenu ? 'opacity-50' : 'opacity-0'}`}
                        onClick={() => setShowMenu(false)}
                    ></div>

                    {/* Menu Panel */}
                    <motion.div
                        className={`relative bg-white shadow-2xl transform transition-transform duration-500 ease-out ${showMenu ? 'translate-y-0' : '-translate-y-full'}`}
                        initial={{ y: -50 }}
                        animate={{ y: showMenu ? 0 : -50 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className='flex items-center justify-between px-6 py-6 border-b border-gray-100'>
                            <img className='w-32' src={assets.logo} alt="" />
                            <button
                                className='w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors duration-200'
                                onClick={() => setShowMenu(false)}
                            >
                                <img className='w-5' src={assets.cross_icon} alt="" />
                            </button>
                        </div>

                        <ul className='flex flex-col py-6'>
                            {[
                                { label: "HOME", path: "/" },
                                { label: "ALL DOCTORS", path: "/doctors" },
                                { label: "ABOUT", path: "/about" },
                                { label: "CONTACT", path: "/contact" },
                            ].map((item, index) => (
                                <NavLink
                                    key={index}
                                    onClick={() => setShowMenu(false)}
                                    to={item.path}
                                    className={({ isActive }) => `px-6 py-4 text-base font-medium transition-all duration-200 border-l-4 ${isActive ? 'bg-primary1/10 text-primary1 border-primary1' : 'border-transparent hover:bg-gray-50 hover:border-gray-300'}`}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </ul>

                        {/* Mobile menu footer */}
                        <div className='px-6 pb-6 border-t border-gray-100 pt-6'>
                            {token ? (
                                <div className='space-y-3'>
                                    <button
                                        onClick={() => { navigate('/my-profile'); setShowMenu(false); }}
                                        className='w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3'
                                    >
                                        <span className='text-lg'>👤</span> My Profile
                                    </button>
                                    <button
                                        onClick={() => { navigate('/my-appointments'); setShowMenu(false); }}
                                        className='w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-3'
                                    >
                                        <span className='text-lg'>📅</span> My Appointments
                                    </button>
                                    <button
                                        onClick={() => { logout(); setShowMenu(false); }}
                                        className='w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors duration-200 flex items-center gap-3'
                                    >
                                        <span className='text-lg'>🚪</span> Logout
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { navigate('/login'); setShowMenu(false); }}
                                    className='w-full bg-primary1 text-white py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300'
                                >
                                    Create account
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    )
}

export default Navbar
