import React from 'react';
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <motion.div
      className="bg-gray-50 rounded-[50px] border-t border-gray-200 pt-16 px-6 md:px-12 lg:px-20 mb-10"
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      viewport={{ once: true }}
    >
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 mb-14 text-sm">

        {/* left */}
        <div>
          <motion.img
            onClick={() => handleNavigate('/')}
            className="mb-6 w-44 cursor-pointer hover:opacity-90 transition-opacity duration-300"
            src={assets.logo1}
            alt="Vaidyam Logo"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
            viewport={{ once: true }}
          />
          <motion.p
            className="w-full md:w-2/3 text-gray-600 leading-relaxed text-[15px]"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <span className='text-primary font-semibold'>Vaidyam</span> is a doctor appointment booking website that makes healthcare access simple. Users can find doctors, view profiles, and book visits with ease. It manages schedules, reminders, and patient records securely, ensuring a smooth and trusted experience for both patients and doctors.
          </motion.p>
        </div>

        {/* center */}
        <div>
          <motion.p
            className="text-lg font-semibold mb-5 text-gray-800 tracking-wide"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            Company
          </motion.p>
          <ul className="flex flex-col gap-2.5 text-gray-600">
            {['Home', 'About us', 'Contact us', 'Privacy policy'].map((item, i) => (
              <motion.li
                key={i}
                className="cursor-pointer hover:text-primary transition-colors duration-200"
                onClick={() => handleNavigate(item === 'Home' ? '/' : `/${item.toLowerCase().replace(/\s/g, '')}`)}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.07, ease: 'easeOut' }}
                viewport={{ once: true }}
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* right */}
        <div>
          <motion.p
            className="text-lg font-semibold mb-5 text-gray-800 tracking-wide"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.4, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            Get in Touch
          </motion.p>
          <ul className="flex flex-col gap-2.5 text-gray-600">
            <motion.li
              className="hover:text-primary transition-colors duration-200"
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.45, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              📞 +91-9876598765
            </motion.li>
            <motion.li
              className="hover:text-primary transition-colors duration-200"
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.5, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              ✉️ vaidyam@gmail.com
            </motion.li>
          </ul>
        </div>
      </div>

      {/* copyright */}
      <motion.hr
        className="border-gray-300"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.55, ease: 'easeOut' }}
        viewport={{ once: true }}
      />
      <motion.p
        className="py-6 text-sm text-gray-500 text-center tracking-wide"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.6, ease: 'easeOut' }}
        viewport={{ once: true }}
      >
        © 2025 <span
          onClick={() => { navigate('/'); scrollTo(0, 0); }}
          className="cursor-pointer font-semibold text-primary"
        >
          Vaidyam
        </span> — All Rights Reserved
      </motion.p>
    </motion.div>
  );
};

export default Footer;
