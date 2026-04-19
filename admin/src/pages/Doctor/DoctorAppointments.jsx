import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import Loader from '../../components/Loader'; // 👈 Import your Loader component

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, completeAppointment, cancelAppointment } =
    useContext(DoctorContext);

  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);

  const [loading, setLoading] = useState(false); // 👈 loader state

  useEffect(() => {
    const fetchAppointments = async () => {
      if (dToken) {
        setLoading(true);
        await getAppointments();
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [dToken]);

  // 👇 show loader while fetching
  if (loading) {
    return <Loader message="Loading your appointments" />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-50 via-white to-gray-100 min-h-screen">
      {/* ===== Page Header ===== */}
      <div className="flex items-center justify-between mb-10 bg-gradient-to-r from-blue-100 to-gray-100 border border-indigo-100 rounded-xl p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight">
            All Appointments
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            View and manage all your patient appointments in one place
          </p>
        </div>
      </div>

      {/* ===== Table Container ===== */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] py-4 px-6 bg-gradient-to-r from-blue-100 to-gray-100 border-b border-gray-300 text-gray-700 font-semibold text-xs uppercase tracking-wider">
          <p>#</p>
          <p>Patient</p>
          <p>Payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Actions</p>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {appointments?.length ? (
            appointments
              .slice()
              .reverse()
              .map((item, index) => (
                <div
                  key={index}
                  className="flex flex-wrap justify-between items-center max-sm:gap-5 sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] py-5 px-6 hover:bg-gray-100 hover:shadow-sm transition-all duration-200"
                >
                  {/* Index */}
                  <p className="hidden sm:block text-gray-400">{index + 1}</p>

                  {/* Patient Info */}
                  <div className="flex items-center gap-3">
                    <img
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200"
                      src={item.userData.image}
                      alt={item.userData.name}
                    />
                    <div>
                      <p className="font-medium text-gray-900 leading-tight">
                        {item.userData.name}
                      </p>
                      <p className="text-xs text-gray-500">{item.userData.email}</p>
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                        item.payment
                          ? 'border-green-400 text-green-600 bg-green-50'
                          : 'border-yellow-400 text-yellow-700 bg-yellow-50'
                      }`}
                    >
                      {item.payment ? 'Online' : 'Cash'}
                    </span>
                  </div>

                  {/* Age */}
                  <p className="hidden sm:block text-gray-700">
                    {calculateAge(item.userData.dob) ?? '-'}
                  </p>

                  {/* Date & Time */}
                  <div className="text-gray-700 text-sm leading-tight">
                    <p className="font-medium text-gray-800">
                      {slotDateFormat(item.slotDate)}
                    </p>
                    <p className="text-gray-500">{item.slotTime}</p>
                  </div>

                  {/* Fees */}
                  <p className="font-semibold text-gray-900">
                    {currency}
                    {item.amount}
                  </p>

                  {/* Actions / Status */}
                  {item.cancelled ? (
                    <span className="text-red-600 text-xs font-semibold bg-red-50 border border-red-100 px-3 py-1 rounded-full text-center">
                      Cancelled
                    </span>
                  ) : item.isCompleted ? (
                    <span className="text-green-600 text-xs font-semibold bg-green-50 border border-green-100 px-3 py-1 rounded-full text-center">
                      Completed
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <img
                        onClick={() => cancelAppointment(item._id)}
                        className="w-8 h-8 cursor-pointer hover:scale-110 active:scale-95 transition-transform drop-shadow-sm"
                        src={assets.cancel_icon}
                        alt="Cancel"
                        title="Cancel Appointment"
                      />
                      <img
                        onClick={() => completeAppointment(item._id)}
                        className="w-8 h-8 cursor-pointer hover:scale-110 active:scale-95 transition-transform drop-shadow-sm"
                        src={assets.tick_icon}
                        alt="Complete"
                        title="Mark as Complete"
                      />
                    </div>
                  )}
                </div>
              ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <img
                src={assets.empty_icon || assets.list_icon}
                alt="No Appointments"
                className="w-20 h-20 opacity-40 mb-4"
              />
              <p className="text-sm font-medium">No appointments found</p>
              <p className="text-xs text-gray-400 mt-1">New bookings will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointments;
