import { useState, useEffect } from "react";
import { uploadToStorage, deleteFromStorage } from "../../../utils/uploadToStorage";
import axios from "axios";
import { Car, Upload, FileCheck, User, Trash2, Phone, Mail, ChevronLeft, ChevronRight, CloudUpload, CheckCircle } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export default function DriverRegister() {
  const { user } = useUser();
  const userId = user?.id;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [driverData, setDriverData] = useState(null);
  const [useClerkImage, setUseClerkImage] = useState(true);
  const [profileImage, setProfileImage] = useState(user?.imageUrl || "");
  const [vehicle, setVehicle] = useState({
    brand: "",
    model: "",
    year: "",
    color: "",
    licensePlate: "",
    images: [],
  });
  const [documents, setDocuments] = useState({
    drivingLicense: null,
    vehicleRegistration: null,
    insurance: null
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch existing driver data on mount
  useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/driver-register/${userId}`);
        if (response.data) {
          setIsRegistered(true);
          setDriverData(response.data);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error(err);
        }
        // If 404 or other, assume not registered
      }
    };
    if (userId) {
      fetchDriverData();
    }
  }, [userId, BACKEND_URL]);

  /* ---------------- VALIDATIONS ---------------- */
  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!vehicle.brand.trim()) newErrors.brand = "Brand is required";
      if (!vehicle.model.trim()) newErrors.model = "Model is required";
      if (!vehicle.year || isNaN(vehicle.year) || vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1) {
        newErrors.year = "Valid year is required (1900 - current year +1)";
      }
      if (!vehicle.color.trim()) newErrors.color = "Color is required";
      if (!vehicle.licensePlate.trim()) newErrors.licensePlate = "License Plate is required";
      if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
      if (!phoneVerified) newErrors.phoneVerified = "Please verify your phone number";
      if (!emailVerified) newErrors.emailVerified = "Please verify your email address";
    } else if (currentStep === 2) {
      if (vehicle.images.length === 0) newErrors.vehicleImages = "At least one vehicle image is required";
      if (!profileImage) newErrors.profileImage = "Profile image is required";
    } else if (currentStep === 3) {
      if (!documents.drivingLicense) newErrors.drivingLicense = "Driving License is required";
      if (!documents.vehicleRegistration) newErrors.vehicleRegistration = "Vehicle Registration is required";
      if (!documents.insurance) newErrors.insurance = "Insurance is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- FILE HANDLERS ---------------- */
  const uploadVehicleImages = async (files) => {
    const selected = Array.from(files);
    if (vehicle.images.length + selected.length > 4) {
      alert("You can upload a maximum of 4 vehicle images");
      return;
    }
    const urls = [...vehicle.images];
    for (const file of selected) {
      const url = await uploadToStorage(file, `drivers/${userId}/vehicle-images`);
      urls.push(url);
    }
    setVehicle((prev) => ({ ...prev, images: urls }));
  };

  const removeVehicleImage = async (index) => {
    const url = vehicle.images[index];
    await deleteFromStorage(url);
    const newImages = vehicle.images.filter((_, i) => i !== index);
    setVehicle((prev) => ({ ...prev, images: newImages }));
  };

  const uploadDocument = async (file, field) => {
    const url = await uploadToStorage(file, `drivers/${userId}/documents`);
    setDocuments((prev) => ({ ...prev, [field]: url }));
  };

  const removeDocument = async (field) => {
    const url = documents[field];
    if (url) {
      await deleteFromStorage(url);
      setDocuments((prev) => ({ ...prev, [field]: null }));
    }
  };

  const uploadProfileImage = async (file) => {
    const url = await uploadToStorage(file, `drivers/${userId}/profile`);
    setProfileImage(url);
    setUseClerkImage(false);
  };

  const removeProfileImage = async () => {
    if (!useClerkImage && profileImage) {
      await deleteFromStorage(profileImage);
    }
    setProfileImage(user?.imageUrl || "");
    setUseClerkImage(true);
  };

  /* ---------------- PHONE VERIFICATION ---------------- */
  const sendOTP = async () => {
    try {
      setLoading(true);
      await axios.post(`${BACKEND_URL}/api/phone-verification/send-otp`, { phoneNumber });
      setOtpSent(true);
      alert('OTP sent to your phone number');
    } catch (err) {
      console.error('Error sending OTP:', err);
      alert('Failed to send OTP. Please check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${BACKEND_URL}/api/phone-verification/verify-otp`, {
        phoneNumber,
        code: otp,
      });
      if (response.data.verified) {
        setPhoneVerified(true);
        alert('Phone number verified successfully!');
      }
    } catch (err) {
      console.error('Error verifying OTP:', err);
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EMAIL VERIFICATION ---------------- */
  useEffect(() => {
    // Check if email is verified from Clerk
    if (user?.primaryEmailAddress?.verification?.status === 'verified') {
      setEmailVerified(true);
    }
  }, [user]);

  /* ---------------- SUBMIT ---------------- */
  const submitRegistration = async () => {
    try {
      setLoading(true);

      // 1️⃣ Ensure driver exists
      await axios.post(`${BACKEND_URL}/api/driver-register/${userId}`);

      // 2️⃣ Save vehicle
      await axios.post(`${BACKEND_URL}/api/driver-vehicle/${userId}`, vehicle);

      // 3️⃣ Save documents
      await axios.put(`${BACKEND_URL}/api/driver-docs/${userId}`, documents);

      // 4️⃣ Save phone number
      await axios.put(`${BACKEND_URL}/api/driver-profile/${userId}/phone`, { phoneNumber });

      // 5️⃣ Determine profile image URL
      let finalProfileImage = null;

      if (useClerkImage) {
        // ✅ Clerk image selected
        finalProfileImage = user?.imageUrl;
      } else {
        // ✅ Custom uploaded image already in Firebase
        finalProfileImage = profileImage;
      }

      // 6️⃣ Send profile image to backend
      if (finalProfileImage) {
        await axios.put(
          `${BACKEND_URL}/api/driver-profile/${userId}/image`,
          { profileImage: finalProfileImage }
        );
      }

      alert("Registration submitted. Await admin verification.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };


  /* ---------------- NAVIGATION ---------------- */
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  /* ---------------- UI: REGISTERED VIEW ---------------- */
  if (isRegistered && driverData) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Driver Details</h1>
        <div className="bg-white rounded-lg p-6 shadow space-y-6">
          <h3 className="font-semibold">Vehicle Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Brand: {driverData.vehicle.brand}</div>
            <div>Model: {driverData.vehicle.model}</div>
            <div>Year: {driverData.vehicle.year}</div>
            <div>Color: {driverData.vehicle.color}</div>
            <div>License Plate: {driverData.vehicle.licensePlate}</div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Vehicle Images</h4>
            <div className="grid grid-cols-4 gap-2">
              {driverData.vehicle.images.map((img, i) => (
                <img key={i} src={img} className="h-20 w-full object-cover rounded" />
              ))}
            </div>
          </div>
          <h3 className="font-semibold mt-4">Documents</h3>
          <ul className="text-sm">
            {Object.entries(driverData.documents).map(([k, v]) => (
              <li key={k}>
                {k.charAt(0).toUpperCase() + k.slice(1)}: {v ? "Uploaded" : "Not uploaded"}
              </li>
            ))}
          </ul>
          <h3 className="font-semibold mt-4">Profile Image</h3>
          {console.log(driverData.profileImage)} {/* it is undefined here some times user may choose to upload the clerk image as the url as the profile send it to db as it is  */}
          {driverData.profileImage && (
            <img src={driverData.profileImage} className="h-24 w-24 rounded-full" />
          )}
        </div>
      </div>
    );
  }

  /* ---------------- UI: FORM ---------------- */
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[var(--color-primary)] rounded-b-[3rem] -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-32 -left-32 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-3 tracking-tight">Driver Registration</h1>
          <p className="text-gray-500 text-lg">Join our community of verified drivers today</p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 border border-white/20 fade-in-up delay-1">
          <div className="flex items-center justify-between relative">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--color-primary)] -z-10 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>

            {["Vehicle", "Images", "Documents", "Review"].map((label, i) => (
              <div key={label} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg transition-all duration-300 border-4 ${step === i + 1
                    ? "bg-[var(--color-primary)] text-white border-white shadow-lg scale-110 ring-4 ring-[var(--color-primary)]/20"
                    : step > i + 1
                      ? "bg-[var(--color-primary)] text-white border-white scale-100"
                      : "bg-white text-gray-400 border-gray-200"
                    }`}
                >
                  {step > i + 1 ? <CheckCircle size={20} /> : i + 1}
                </div>
                <span
                  className={`mt-2 text-xs md:text-sm font-semibold transition-colors duration-300 ${step === i + 1 ? "text-[var(--color-primary)]" : step > i + 1 ? "text-[var(--color-primary)]" : "text-gray-400"
                    }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 min-h-[500px] border border-gray-100 fade-in-up delay-2">

          {/* -------- STEP 1: VEHICLE -------- */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--color-primary)]">
                  <Car size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Vehicle Details</h2>
                  <p className="text-gray-500 text-sm">Tell us about the car you'll be driving</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["brand", "model", "color", "licensePlate"].map((field) => (
                  <div key={field} className="relative group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                      {field === "licensePlate" ? "License Plate" : field.charAt(0).toUpperCase() + field.slice(1)}
                      {["brand", "model", "licensePlate"].includes(field) && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        placeholder={field === "licensePlate" ? "e.g., DL-01-AB-1234" : `Enter ${field}`}
                        className={`w-full h-14 px-4 bg-gray-50 border-2 rounded-xl focus:bg-white outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium ${errors[field] ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[var(--color-primary)] hover:border-gray-200"
                          }`}
                        value={vehicle[field]}
                        onChange={(e) => setVehicle({ ...vehicle, [field]: e.target.value })}
                      />
                    </div>
                    {errors[field] && <p className="text-red-500 text-xs mt-1 ml-1 font-medium flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors[field]}</p>}
                  </div>
                ))}

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Year <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2023"
                    className={`w-full h-14 px-4 bg-gray-50 border-2 rounded-xl focus:bg-white outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium ${errors.year ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-[var(--color-primary)] hover:border-gray-200"
                      }`}
                    value={vehicle.year}
                    onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                  />
                  {errors.year && <p className="text-red-500 text-xs mt-1 ml-1 font-medium flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.year}</p>}
                </div>
              </div>

              {/* Verification Section */}
              <div className="mt-10 bg-gray-50/80 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[var(--color-primary)]">
                    <Phone size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Contact Verification</h3>
                </div>

                {/* Phone Verification */}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>

                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        placeholder="+91 Enter Phone Number"
                        className={`w-full h-14 px-4 bg-white border-2 rounded-xl outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium disabled:bg-gray-100 disabled:text-gray-400 ${errors.phoneNumber ? "border-red-500" : "border-gray-200 focus:border-[var(--color-primary)]"
                          }`}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={phoneVerified || otpSent}
                      />
                      {phoneVerified && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                          <CheckCircle size={20} className="fill-green-100" />
                        </div>
                      )}
                    </div>

                    {!phoneVerified && !otpSent && (
                      <button
                        onClick={sendOTP}
                        disabled={loading || !phoneNumber}
                        className="h-14 px-6 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition shadow-lg shadow-gray-200 whitespace-nowrap"
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                  {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}

                  {otpSent && !phoneVerified && (
                    <div className="flex gap-3 animate-in fade-in slide-in-from-top-2">
                      <input
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 h-14 px-4 bg-white border-2 border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium text-center tracking-widest text-lg"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <button
                        onClick={verifyOTP}
                        disabled={loading || !otp}
                        className="h-14 px-8 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition shadow-lg shadow-green-200"
                      >
                        Verify
                      </button>
                    </div>
                  )}

                  {phoneVerified && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-700 font-medium text-sm">
                      <CheckCircle size={16} />
                      Phone number verified successfully
                    </div>
                  )}
                  {errors.phoneVerified && <p className="text-red-500 text-sm">{errors.phoneVerified}</p>}
                </div>

                {/* Email Verification Status */}
                <div className={`mt-4 p-4 rounded-xl border flex items-center justify-between transition-colors ${emailVerified ? "bg-white border-green-100 shadow-sm" : "bg-red-50 border-red-100"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${emailVerified ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.primaryEmailAddress?.emailAddress}</p>
                      <p className="text-xs text-gray-500">Email verification status</p>
                    </div>
                  </div>
                  {emailVerified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Required
                    </span>
                  )}
                </div>
                {errors.emailVerified && <p className="text-red-500 text-sm mt-2">{errors.emailVerified}</p>}
              </div>
            </div>
          )}

          {/* -------- STEP 2: VEHICLE IMAGES + PROFILE -------- */}
          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">

              {/* Vehicle Images Section */}
              <div>
                <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--color-primary)]">
                    <CloudUpload size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Vehicle Photos</h2>
                    <p className="text-gray-500 text-sm">Upload clear photos of your vehicle (Max 4)</p>
                  </div>
                </div>

                {/* Drag & Drop Area */}
                <div
                  className={`border-3 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group relative overflow-hidden ${vehicle.images.length >= 4 ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50" : "border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 bg-gray-50"
                    }`}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (vehicle.images.length < 4) uploadVehicleImages(e.dataTransfer.files); }}
                >
                  <input
                    type="file"
                    id="vehicleImageInput"
                    multiple
                    accept="image/*"
                    onChange={(e) => uploadVehicleImages(e.target.files)}
                    className="hidden"
                    disabled={vehicle.images.length >= 4}
                  />
                  <label htmlFor="vehicleImageInput" className={`cursor-pointer ${vehicle.images.length >= 4 ? "pointer-events-none" : ""}`}>
                    <div className="w-20 h-20 mx-auto bg-white rounded-full shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <CloudUpload className="text-[var(--color-primary)]" size={32} />
                    </div>
                    <p className="text-lg font-bold text-gray-800 mb-1">Click to upload or drag & drop</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </label>
                </div>

                {/* Uploaded Images Grid */}
                {vehicle.images.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-bold text-gray-700">Uploaded Photos ({vehicle.images.length}/4)</p>
                      <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--color-primary)] transition-all duration-500" style={{ width: `${(vehicle.images.length / 4) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {vehicle.images.map((img, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden shadow-sm aspect-video bg-gray-100">
                          <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Vehicle ${i + 1}`} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-red-500 transition-colors"
                              onClick={() => removeVehicleImage(i)}
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {errors.vehicleImages && <p className="text-red-500 text-sm mt-3 font-medium flex items-center gap-1"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.vehicleImages}</p>}
              </div>

              {/* Profile Picture Section */}
              <div className="pt-8 border-t border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <User size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Driver Photo</h2>
                    <p className="text-gray-500 text-sm">A clear photo of yourself for passengers to recognize you</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Preview */}
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full p-1 border-4 border-purple-100 shadow-xl overflow-hidden bg-white">
                        {profileImage ? (
                          <img src={profileImage} className="w-full h-full rounded-full object-cover" alt="Profile" />
                        ) : (
                          <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                            <User size={40} />
                          </div>
                        )}
                      </div>
                      {!useClerkImage && profileImage && (
                        <button
                          onClick={removeProfileImage}
                          className="absolute bottom-0 right-0 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-transform hover:scale-110"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex-1 w-full space-y-4">
                    <label className="flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-gray-50 hover:bg-white hover:border-gray-200 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={useClerkImage}
                        onChange={() => {
                          setUseClerkImage(!useClerkImage);
                          if (!useClerkImage) setProfileImage(user?.imageUrl || ""); // Toggle logic
                          else setProfileImage("");
                        }}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                      />
                      <div>
                        <p className="font-bold text-gray-800">Use Account Photo</p>
                        <p className="text-xs text-gray-500">Sync with your logged in account</p>
                      </div>
                    </label>

                    {!useClerkImage && (
                      <div className="relative">
                        <input
                          type="file"
                          id="profileImageInput"
                          accept="image/*"
                          onChange={(e) => uploadProfileImage(e.target.files[0])}
                          className="hidden"
                        />
                        <label
                          htmlFor="profileImageInput"
                          className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 cursor-pointer transition-colors"
                        >
                          <CloudUpload size={20} />
                          Upload New Photo
                        </label>
                      </div>
                    )}
                    {errors.profileImage && <p className="text-red-500 text-sm font-medium">{errors.profileImage}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* -------- STEP 3: DOCUMENTS -------- */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                  <FileCheck size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Legal Documents</h2>
                  <p className="text-gray-500 text-sm">Required for verification and safety</p>
                </div>
              </div>

              <div className="grid gap-4">
                {[
                  ["drivingLicense", "Driving License", "Valid government verification"],
                  ["vehicleRegistration", "Vehicle Registration", "Registration Certificate (RC)"],
                  ["insurance", "Insurance Policy", "Current vehicle insurance"],
                ].map(([key, label, description]) => (
                  <div key={key} className={`group relative p-6 rounded-2xl border-2 transition-all ${documents[key] ? "border-green-400 bg-green-50/30" : "border-gray-100 hover:border-[var(--color-primary)]/30 hover:shadow-lg bg-white"
                    }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{label}</h3>
                          {documents[key] && <CheckCircle size={16} className="text-green-500" />}
                        </div>
                        <p className="text-sm text-gray-500">{description}</p>
                      </div>

                      {documents[key] ? (
                        <div className="flex gap-2">
                          {/* <button className="p-2 text-gray-500 hover:text-[var(--color-primary)] transition-colors"><Eye size={18} /></button> */}
                          <button
                            onClick={() => removeDocument(key)}
                            className="px-3 py-1.5 bg-white text-red-500 text-xs font-bold rounded-lg border border-red-100 shadow-sm hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            id={`doc-${key}`}
                            accept="image/*,application/pdf"
                            onChange={(e) => uploadDocument(e.target.files[0], key)}
                            className="hidden"
                          />
                          <label
                            htmlFor={`doc-${key}`}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 cursor-pointer transition shadow-lg shadow-gray-200"
                          >
                            <Upload size={16} />
                            Upload
                          </label>
                        </div>
                      )}
                    </div>
                    {errors[key] && <p className="text-red-500 text-xs mt-3 font-bold">{errors[key]}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* -------- STEP 4: REVIEW -------- */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Review & Submit</h2>
                <p className="text-gray-500">Please review your details before final submission</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                {/* ID Card Header */}
                <div className="bg-gray-900 p-6 flex items-center gap-4 text-white">
                  <div className="w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden bg-gray-800">
                    <img src={profileImage || user?.imageUrl} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Driver Application</p>
                    <h3 className="text-xl font-bold">{user?.fullName || "Driver Applicant"}</h3>
                    <p className="text-sm text-gray-400">{phoneNumber}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Vehicle</p>
                    <p className="font-semibold text-gray-900">{vehicle.year} {vehicle.brand} {vehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">License Plate</p>
                    <div className="inline-block px-2 py-1 bg-yellow-400 rounded text-black font-mono font-bold text-sm">
                      {vehicle.licensePlate}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Color</p>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: vehicle.color }}></span>
                      <p className="font-semibold text-gray-900">{vehicle.color}</p>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-3">Vehicle Photos</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {vehicle.images.map((img, i) => (
                        <img key={i} src={img} className="h-16 w-24 object-cover rounded-lg border border-gray-100" />
                      ))}
                    </div>
                  </div>

                  <div className="col-span-full">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-3">Documents Status</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(documents).map(([k, v]) => (
                        <span key={k} className={`px-3 py-1 rounded-full text-xs font-bold border ${v ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                          {k.replace(/([A-Z])/g, ' $1').trim()}: {v ? "Uploaded" : "Missing"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <button
                  disabled={loading}
                  onClick={submitRegistration}
                  className="w-full h-16 bg-[var(--color-primary)] text-white rounded-2xl font-bold text-xl hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-all shadow-xl shadow-[var(--color-primary)]/20 hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit Application <CheckCircle />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">By submitting, you agree to our Terms of Service and Privacy Policy.</p>
              </div>
            </div>
          )}

          {/* -------- NAVIGATION -------- */}
          <div className="flex items-center justify-between mt-10 pt-6">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition flex items-center gap-2"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            ) : <div></div>}

            {step < 4 && (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg flex items-center gap-2 group"
              >
                Next Step
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );

}