import { useState, createContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [dToken, setDToken] = useState(
    localStorage.getItem("dToken") ? localStorage.getItem("dToken") : ""
  );
  const [appointments, setappointments] = useState([]); // ✅ always an array
  const [dashData, setDashData] = useState(null); // ✅ null instead of false
  const [profileData, setProfileData] = useState(null);

  // ✅ Fetch all doctor appointments
  const getAppointments = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/appointments`, {
        headers: { dToken },
      });

      if (data.success) {
        setappointments(data.appointments || []);
        console.log("Appointments:", data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("getAppointments error:", error);
      toast.error(error.message);
    }
  };

  // ✅ Fetch dashboard data
  const getDashdata = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/dashboard`, {
        headers: { dToken },
      });

      if (data.success) {
        setDashData(data.dashData || {});
        console.log("Dashboard data:", data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("getDashdata error:", error);
      toast.error(error.message);
    }
  };

  // ✅ Mark appointment as completed (instant update + backend sync)
  const completeAppointment = async (appointmentId) => {
    try {
      // 🔹 Optimistic UI update (safe)
      setDashData((prev) => ({
        ...prev,
        latestAppointments: (prev?.latestAppointments ?? []).map((a) =>
          a._id === appointmentId
            ? { ...a, isCompleted: true, cancelled: false }
            : a
        ),
      }));

      // 🔹 Send to backend
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/complete-appointment`,
        { appointmentId },
        { headers: { dToken } }
      );

      if (data.success) {
        toast.success(data.message);
        await Promise.all([getAppointments(), getDashdata()]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("completeAppointment error:", error);
      toast.error(error.message);
    }
  };

  // ✅ Cancel appointment (instant update + backend sync)
  const cancelAppointment = async (appointmentId) => {
    try {
      // 🔹 Optimistic UI update (safe)
      setDashData((prev) => ({
        ...prev,
        latestAppointments: (prev?.latestAppointments ?? []).map((a) =>
          a._id === appointmentId
            ? { ...a, cancelled: true, isCompleted: false }
            : a
        ),
      }));

      // 🔹 Send to backend
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/cancel-appointment`,
        { appointmentId },
        { headers: { dToken } }
      );

      if (data.success) {
        toast.success(data.message);
        await Promise.all([getAppointments(), getDashdata()]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("cancelAppointment error:", error);
      toast.error(error.message);
    }
  };

  // ✅ Get doctor profile
  // In your DoctorContext.jsx, make sure you have:
  const getProfileData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/profile`, {
        headers: { dToken },
      });

      if (data.success) {
        setProfileData(data.profileData || {});
        return data.profileData;
      } else {
        toast.error(data.message);
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("getProfileData error:", error);
      toast.error(error.message);
      throw error;
    }
  };


  const value = {
    dToken,
    setDToken,
    backendUrl,
    appointments,
    setappointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
    dashData,
    setDashData,
    getDashdata,
    profileData,
    setProfileData,
    getProfileData,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
