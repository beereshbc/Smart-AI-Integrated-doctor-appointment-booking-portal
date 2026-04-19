import React from 'react'
import { specialityData } from '../assets/assets'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const SpecialityMenu = () => {
  return (
    <div
      className="flex flex-col items-center gap-6 py-16 px-4 text-gray-800"
      id="speciality"
    >
      {/* Heading */}
      <motion.h1
        className="text-2xl sm:text-3xl font-semibold text-center"
        style={{
          filter: 'drop-shadow(0 4px 2px rgba(59,130,246,0.5))',
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Find by Speciality
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-center text-sm sm:text-base max-w-md"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Simply browse through our extensive list of trusted doctors,
        <br className="hidden sm:block" /> schedule your appointment hassle-free.
      </motion.p>

      {/* Speciality Cards */}
      <div
        className="
          flex sm:flex-wrap sm:justify-center
          gap-4 sm:gap-8 pt-5 w-full
          overflow-x-auto sm:overflow-visible
          scroll-smooth scrollbar-hide
        "
      >
        {specialityData.map((item, index) => (
          <motion.div
            key={index}
            className="
              flex flex-col items-center justify-center
              flex-shrink-0 cursor-pointer
              bg-white rounded-xl shadow-md hover:shadow-lg
              px-4 py-3 transition-all
              w-28 sm:w-36 md:w-40
              scroll-snap-align-center
            "
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.10, y: -5 ,transition: { duration: 0.3 }}}
          >
            <Link
              to={`/doctors/${item.speciality}`}
              onClick={() => window.scrollTo(0, 0)}
              className="flex flex-col items-center text-xs sm:text-sm text-center"
            >
              <img
className="w-16 sm:w-24 md:w-28 mb-2 object-contain transition-all duration-700 ease-in-out hover:scale-[1.05]"
                src={item.image}
                alt={item.speciality}
              />
              <p>{item.speciality}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default SpecialityMenu
