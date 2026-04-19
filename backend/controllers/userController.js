import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import axios from 'axios' // Added for SugamPay

// CONSTANT: Where SugamPay backend is running
const SUGAMPAY_BACKEND_URL = "http://localhost:5000/api"; 


// ---------------- USER AUTH ----------------

// API to register user
const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body;

        // checking for missing details
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing details" });
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "enter a valid email" });
        }

        // validating password strength
        if (password.length < 8) {
            return res.json({ success: false, message: "Enter a strong password" });
        }

        // hashing the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


// API for user login 
const loginUser = async (req, res) => {

    try {

        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials(Password)" })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }

}


// ---------------- PROFILE ----------------

// API to get user profile data
const getProfile = async (req, res) => {

    try {

        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }

}


// API to update user profile data
const updateProfile = async (req, res) => {
    try {

        const { userId, name, phone, address, dob, gender } = req.body;
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Missing details" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {

            //upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
            const imageUrl = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageUrl })
        }

        res.json({ success: true, message: "Profile updated successfully" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


// ---------------- APPOINTMENTS ----------------

// API to build or get the appointment model
const bookAppointment = async (req, res) => {

    try {

        const { userId, docId, slotDate, slotTime } = req.body;

        const docData = await doctorModel.findById(docId).select('-password');

        if (!docData.available) {
            return res.json({ success: false, message: "Doctor is not available for appointment" });
        }

        let slots_booked = docData.slots_booked

        // Checking for slot availability
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: "Slot is not available" });
            } else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password');

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotDate,
            slotTime,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.json({ success: true, message: "Appointment booked successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}


// API to get user appointments
const listAppointment = async (req, res) => {

    try {

        const { userId } = req.body;
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }

}


// API to cancel appointment
const cancelAppointment = async (req, res) => {

    try {

        const { userId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appoitment user
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: "You are not authorized to cancel this appointment" })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctors slots

        const { docId, slotDate, slotTime } = appointmentData;

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: "Appointment cancelled successfully" })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }

}



// ---------------- SUGAMPAY PAYMENT INTEGRATION ----------------

// 1. INITIATE PAYMENT (Replaces paymentRazorpay)
const paymentSugam = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: "Appointment Cancelled or not found" });
        }

        // Call SugamPay Backend
        const response = await axios.post(`${SUGAMPAY_BACKEND_URL}/create-order`, {
            amount: appointmentData.amount,
            sourceApp: 'Vaidyam'
        });

        if (response.data.success) {
            res.json({ success: true, orderId: response.data.orderId });
        } else {
            res.json({ success: false, message: "SugamPay Error" });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


// 2. VERIFY PAYMENT (Replaces verifyRazorpay)
const verifySugam = async (req, res) => {
    try {
        const { appointmentId, txnId } = req.body;

        if (txnId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
            res.json({ success: true, message: "Payment Successful" });
        } else {
            res.json({ success: false, message: "Payment Failed" });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}



// ---------------- EXPORTS ----------------

export { 
    registerUser, 
    loginUser, 
    getProfile, 
    updateProfile, 
    bookAppointment, 
    listAppointment, 
    cancelAppointment, 
    paymentSugam, 
    verifySugam 
};
