import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Loader from '../components/Loader'

const MyAppointments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const navigate = useNavigate()

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const slotDateFormat = (slot) => {
    const dateArray = slot.split('_')
    return dateArray[0] + "," + months[Number(dateArray[1])] + "," + dateArray[2]
  }

  const getUserAppointments = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
      if (data.success) {
        setAppointments(data.appointments.reverse())
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async (appointmentId) => {
    setCancelLoading(true);
    const startTime = Date.now();

    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/cancel-appointment',
        { appointmentId },
        { headers: { token } }
      );

      const elapsed = Date.now() - startTime;
      const minDuration = 100;
      const delay = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        if (data.success) {
          toast.success(data.message);
          getUserAppointments();
          getDoctorsData();
        } else {
          toast.error(data.message);
        }
        setCancelLoading(false);
      }, delay);
    } catch (error) {
      const elapsed = Date.now() - startTime;
      const minDuration = 200;
      const delay = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        console.log(error);
        toast.error(error.message);
        setCancelLoading(false);
      }, delay);
    }
  };

  const isAppointmentExpired = (item) => {
    try {
      const [day, month, year] = item.slotDate.split('_');
      const appointmentStart = new Date(`${month} ${day}, ${year} ${item.slotTime}`);

      const appointmentEnd = new Date(appointmentStart.getTime() + 30 * 60000);
      const now = new Date();
      return now > appointmentEnd;
    } catch (err) {
      console.error("Error parsing appointment date:", err);
      return false;
    }
  };

  const gotoDoctor = () => {
    navigate('/')
  }


  // ------------------------------------------------------------
  // ⭐⭐ SUGAMPAY INTEGRATION ⭐⭐
  // ------------------------------------------------------------

  // 1. AUTO VERIFY WHEN COMING BACK FROM SUGAMPAY
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const txnId = query.get('txnId');
    const status = query.get('status');
    const appointmentId = localStorage.getItem('currentAppointmentId');

    if (token && status === 'success' && txnId && appointmentId) {
      verifySugamPayment(appointmentId, txnId);
      window.history.replaceState(null, '', window.location.pathname);
      localStorage.removeItem('currentAppointmentId');
    }
  }, [token]);


  // 2. VERIFY PAYMENT WITH BACKEND
  const verifySugamPayment = async (appointmentId, txnId) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/verify-sugam',
        { appointmentId, txnId },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };


  // 3. START PAYMENT — OPENS SUGAMPAY PAGE
  const appointmentSugam = async (appointmentId) => {
    try {
      localStorage.setItem('currentAppointmentId', appointmentId);

      const { data } = await axios.post(
        backendUrl + '/api/user/payment-sugam',
        { appointmentId },
        { headers: { token } }
      );

      if (data.success) {
        const callbackUrl = window.location.href;
        window.location.href =
          `http://localhost:5176/pay?orderId=${data.orderId}&callback_url=${callbackUrl}`;
      } else {
        toast.error(data.message);
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // ------------------------------------------------------------


  useEffect(() => {
    if (token) getUserAppointments()
  }, [token])

  return (
    <motion.div
      className='bg-gray-50 min-h-screen p-4 sm:p-8 mt-10 mb-20 rounded-[20px]'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <h1 className='pb-4 mb-8 text-3xl font-bold text-gray-800 border-b-2 border-gray-200'>
        My Appointments
      </h1>

      {loading ? (
        <Loader message="Your Appointments are Loading" />
      ) : cancelLoading ? (
        <Loader message="Cancelling Your Appointment" />
      ) : (
        <div className='space-y-6'>
          {appointments.map((item, index) => (
            <motion.div
              className="flex flex-col md:flex-row items-center md:items-start p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Doctor Image */}
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <motion.img
                  className="w-32 h-32 md:w-36 md:h-36 object-cover rounded-xl bg-indigo-50 cursor-pointer"
                  src={item.docData.image}
                  alt={`Dr. ${item.name}`}
                  whileHover={{ scale: 1.1, rotate: 2 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 12 }}
                  onClick={() => navigate(`/appointment/${item.docId}`)}
                />
              </div>

              {/* Doctor Info */}
              <div className="flex-grow text-sm text-gray-600 space-y-2 text-center md:text-left">
                <p onClick={() => navigate(`/appointment/${item.docId}`)} className="text-xl font-bold text-gray-900 cursor-pointer">{item.docData.name}</p>
                <p onClick={() => navigate(`/doctors/${item.docData.speciality}`)} className="text-indigo-600 font-medium -mt-1 cursor-pointer">{item.docData.speciality}</p>

                <div className="!mt-4">
                  <p className="text-gray-700 font-semibold">Address:</p>
                  <p className="text-xs text-gray-500">{item.docData.address.line1}</p>
                  <p className="text-xs text-gray-500">{item.docData.address.line2}</p>
                </div>

                <div className="!mt-4 inline-block bg-gray-100 text-gray-800 font-semibold px-3 py-1 rounded-full text-xs">
                  <span className="mr-1.5">🗓️</span>
                  Date & Time: {slotDateFormat(item.slotDate)} | {item.slotTime}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col justify-center md:justify-center items-center md:items-start gap-3 mt-4 md:mt-0 md:ml-auto w-full md:w-auto">

                {item.payment && !item.cancelled && !item.isCompleted && (
                  <motion.button
                    className="text-sm font-semibold text-center w-full md:min-w-48 px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    Paid
                  </motion.button>
                )}

                {!item.payment && !item.cancelled && !item.isCompleted && !isAppointmentExpired(item) && (
                  <motion.button
                    onClick={() => appointmentSugam(item._id)}
                    className="text-sm font-semibold text-center w-full md:min-w-48 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    Pay Online
                  </motion.button>
                )}

                {!item.cancelled && !item.isCompleted && !isAppointmentExpired(item) && (
                  <motion.button
                    onClick={() => cancelAppointment(item._id)}
                    className="text-sm font-semibold text-center w-full md:min-w-48 px-4 py-2 bg-transparent text-red-600 border border-red-300 rounded-lg hover:bg-red-600 hover:text-white transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                  >
                    Cancel Appointment
                  </motion.button>
                )}

                {item.cancelled && (
                  <motion.div
                    className="text-sm font-semibold text-center w-full md:min-w-48 px-4 py-2 bg-gray-100 text-red-600 border border-red-200 rounded-lg"
                  >
                    Appointment Cancelled
                  </motion.div>
                )}

                {item.isCompleted && (
                  <motion.div
                    className="text-sm font-semibold text-center w-full md:min-w-48 px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm"
                  >
                    Appointment Completed
                  </motion.div>
                )}

                {!item.cancelled && !item.isCompleted && isAppointmentExpired(item) && (
                  <motion.div
                    className="text-sm font-semibold text-center w-full md:min-w-48 px-4 py-2 bg-gray-200 text-gray-600 border border-gray-300 rounded-lg"
                  >
                    No Status Available (Expired)
                  </motion.div>
                )}

                {!item.cancelled && !item.isCompleted && !isAppointmentExpired(item) && (
                  <motion.button
                    onClick={() => navigate(`/chat/${item._id}`)}
                    className="relative text-sm font-semibold text-center w-full md:min-w-48 px-5 py-2.5 bg-gradient-to-r from-fuchsia-500 via-purple-600 to-indigo-600 text-white rounded-lg shadow-lg transition-all duration-500"
                    whileHover={{ scale: 1.15 }}
                  >
                    💬 Chat with Doctor
                  </motion.button>
                )}

              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default MyAppointments
