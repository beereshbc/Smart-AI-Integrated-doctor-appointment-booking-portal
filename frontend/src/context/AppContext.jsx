import { createContext } from "react"
import axios from "axios"
import { useState } from "react"
import { useEffect } from "react"
import { toast } from "react-toastify"

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currencySymbol = '₹'
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    
    const [doctors, setDoctors] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):false)
    const [userData, setUserData] = useState(false)

    // ── Dark Mode ──────────────────────────────────────────
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const next = !prev
            localStorage.setItem('darkMode', String(next))
            return next
        })
    }

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    // Apply saved preference immediately on first mount
    useEffect(() => {
        if (localStorage.getItem('darkMode') === 'true') {
            document.documentElement.classList.add('dark')
        }
    }, [])
    // ──────────────────────────────────────────────────────

    const getDoctorsData = async () => {

        try {

            const {data} = await axios.get(backendUrl + '/api/doctor/list')
            if(data.success){
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }
            
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
        
    }
    
    const loadUserProfileData = async () => {
        try {

            const {data} = await axios.get(backendUrl + '/api/user/get-profile', {headers:{token}})

            if (data.success) {
                setUserData(data.userData)
            } else {
                toast.error(data.message)
            }
            
        } catch (error) {
            console.log(error);
            toast.error(error.message)            
        }
    }

    const value = {
        doctors,getDoctorsData,
        currencySymbol,
        token, setToken,
        backendUrl,
        userData, setUserData,
        loadUserProfileData,
        darkMode, toggleDarkMode
    }

    useEffect(() => {
        getDoctorsData()
    },[])

    useEffect(() => {
        if(token){
            loadUserProfileData()
        } else{
            setUserData(false)
        }
    },[token])

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )

}

export default AppContextProvider