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
      <div className="min-h-screen bg-[var(--color-bg)] py-20 px-4 md:px-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Header Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 relative">
            <div className="h-32 bg-[var(--color-primary)]"></div>
            <div className="px-8 pb-8">
              <div className="relative flex justify-between items-end -mt-12 mb-6">
                <div className="flex items-end gap-6">
                  <div className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                    <img
                      src={driverData.profileImage || "https://ui-avatars.com/api/?name=Driver&background=0D9488&color=fff"}
                      className="w-full h-full object-cover"
                      alt="Profile"
                    />
                  </div>
                  <div className="mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{user?.fullName || "Driver Profile"}</h1>
                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Verified Driver • ID: #{userId.slice(-6).toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <button className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition">
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">Vehicle</p>
                  <p className="text-lg font-bold text-gray-900">{driverData.vehicle.year} {driverData.vehicle.brand} {driverData.vehicle.model}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">License Plate</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-yellow-400 text-black font-mono font-bold text-xs rounded">IND</span>
                    <p className="text-lg font-bold text-gray-900">{driverData.vehicle.licensePlate}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium mb-1">Status</p>
                  <p className="text-lg font-bold text-[var(--color-primary)] flex items-center gap-2">
                    <CheckCircle size={20} /> Active
                  </p>
                </div>
              </div>

              {/* Details Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vehicle Images */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Car className="text-[var(--color-primary)]" />
                    Vehicle Gallery
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {driverData.vehicle.images.map((img, i) => (
                      <div key={i} className="aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 group">
                        <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Vehicle" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileCheck className="text-[var(--color-primary)]" />
                    Documents
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(driverData.documents).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-[var(--color-primary)]/30 transition">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${v ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                            {v ? <CheckCircle size={18} /> : <Upload size={18} />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <p className="text-xs text-gray-500">{v ? "Verified & Active" : "Action Required"}</p>
                          </div>
                        </div>
                        {v ? (
                          <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">Uploaded</span>
                        ) : (
                          <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">Missing</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- UI: FORM ---------------- */
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 font-sans relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[var(--color-primary)]/5 rounded-b-[3rem] -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/80" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center mb-10 fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">Driver Registration</h1>
          <p className="text-gray-500 text-lg">Join our community of verified drivers today</p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 fade-in-up delay-1">
          <div className="relative flex items-center justify-between max-w-3xl mx-auto">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10 rounded-full"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[var(--color-primary)] -z-10 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>

            {["Vehicle", "Images", "Documents", "Review"].map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-2 bg-white px-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 ${step > i + 1
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : step === i + 1
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/30 scale-110"
                        : "bg-white text-gray-400 border-gray-200"
                    }`}
                >
                  {step > i + 1 ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${step >= i + 1 ? "text-[var(--color-primary)]" : "text-gray-400"
                    }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 min-h-[500px] border border-gray-100 fade-in-up delay-2 relative">

          {/* Header Icon for Steps */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center text-[var(--color-primary)] animate-in zoom-in duration-300">
              {step === 1 && <Car size={32} />}
              {step === 2 && <CloudUpload size={32} />}
              {step === 3 && <FileCheck size={32} />}
              {step === 4 && <CheckCircle size={32} />}
            </div>
          </div>

          {/* -------- STEP 1: VEHICLE -------- */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Vehicle Details</h2>
                <p className="text-gray-500">Tell us about the car you'll be driving</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["brand", "model", "color", "licensePlate"].map((field) => (
                  <div key={field} className="relative group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                      {field === "licensePlate" ? "License Plate" : field.charAt(0).toUpperCase() + field.slice(1)}
                      {["brand", "model", "licensePlate"].includes(field) && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      placeholder={field === "licensePlate" ? "e.g., DL-01-AB-1234" : `Enter ${field}`}
                      className={`w-full h-14 px-4 bg-gray-50 border-2 rounded-xl focus:bg-white outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-semibold text-gray-900 ${errors[field] ? "border-red-500 focus:border-red-500" : "border-gray-100 focus:border-[var(--color-primary)]"
                        }`}
                      value={vehicle[field]}
                      onChange={(e) => setVehicle({ ...vehicle, [field]: e.target.value })}
                    />
                    {errors[field] && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors[field]}</p>}
                  </div>
                ))}

                <div className="relative md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                    Year <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2023"
                    className={`w-full h-14 px-4 bg-gray-50 border-2 rounded-xl focus:bg-white outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-semibold text-gray-900 ${errors.year ? "border-red-500 focus:border-red-500" : "border-gray-100 focus:border-[var(--color-primary)]"
                      }`}
                    value={vehicle.year}
                    onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                  />
                  {errors.year && <p className="text-red-500 text-xs mt-1 ml-1 font-bold">{errors.year}</p>}
                </div>
              </div>

              {/* Verification Section */}
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Phone size={20} className="text-[var(--color-primary)]" /> Contact Verification
                </h3>

                {/* Phone Verification */}
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        placeholder="+91 Enter Phone Number"
                        className={`w-full h-14 px-4 bg-white border-2 rounded-xl outline-none focus:ring-4 focus:ring-[var(--color-primary)]/10 transition-all font-medium disabled:bg-gray-50 disabled:text-gray-400 ${errors.phoneNumber ? "border-red-500" : "border-gray-200 focus:border-[var(--color-primary)]"
                          }`}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={phoneVerified || otpSent}
                      />
                      {phoneVerified && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 bg-green-50 p-1 rounded-full">
                          <CheckCircle size={20} className="fill-green-100" />
                        </div>
                      )}
                    </div>

                    {!phoneVerified && !otpSent && (
                      <button
                        onClick={sendOTP}
                        disabled={loading || !phoneNumber}
                        className="h-14 px-6 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition shadow-lg shadow-gray-200 whitespace-nowrap"
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                  {errors.phoneNumber && <p className="text-red-500 text-sm font-medium">{errors.phoneNumber}</p>}

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
                        className="h-14 px-8 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 transition shadow-lg shadow-green-200"
                      >
                        Verify
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------- STEP 2: VEHICLE IMAGES + PROFILE -------- */}
          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Vehicle Photos</h2>
                <p className="text-gray-500">Upload clear photos of your vehicle (Max 4)</p>
              </div>

              {/* Drag & Drop Area */}
              <div
                className={`border-3 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer group relative overflow-hidden bg-gray-50 ${vehicle.images.length >= 4 ? "opacity-50 cursor-not-allowed border-gray-200" : "border-gray-300 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
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
                  <div className="w-16 h-16 mx-auto bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-[var(--color-primary)]">
                    <CloudUpload size={28} />
                  </div>
                  <p className="text-lg font-bold text-gray-900 mb-1">Click to upload or drag & drop</p>
                  <p className="text-sm text-gray-500">PNG, JPG, up to 10MB</p>
                </label>
              </div>

              {/* Uploaded Images Grid */}
              {vehicle.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {vehicle.images.map((img, i) => (
                    <div key={i} className="relative group rounded-2xl overflow-hidden shadow-sm aspect-video bg-gray-100 border border-gray-100">
                      <img src={img} className="w-full h-full object-cover" alt={`Vehicle ${i + 1}`} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          className="bg-white p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-lg"
                          onClick={() => removeVehicleImage(i)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {errors.vehicleImages && <p className="text-red-500 text-sm font-bold flex items-center gap-1 justify-center"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.vehicleImages}</p>}

              {/* Profile Picture Section */}
              <div className="pt-8 border-t border-gray-100">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900">Driver Photo</h2>
                  <p className="text-gray-500 text-sm">A clear photo for passengers to recognize you</p>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full p-1 border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                      {profileImage ? (
                        <img src={profileImage} className="w-full h-full rounded-full object-cover" alt="Profile" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <User size={40} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <label className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${useClerkImage ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-gray-200 hover:border-gray-300"}`}>
                      <input
                        type="radio"
                        checked={useClerkImage}
                        onChange={() => { setUseClerkImage(true); setProfileImage(user?.imageUrl || ""); }}
                        className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="font-bold text-gray-700 text-sm">Use Account Photo</span>
                    </label>
                    <label className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${!useClerkImage ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-gray-200 hover:border-gray-300"}`}>
                      <input
                        type="radio"
                        checked={!useClerkImage}
                        onChange={() => { setUseClerkImage(false); setProfileImage(""); }}
                        className="w-4 h-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="font-bold text-gray-700 text-sm">Upload New</span>
                    </label>
                  </div>

                  {!useClerkImage && (
                    <div className="w-full max-w-xs">
                      <input
                        type="file"
                        id="profileImageInput"
                        accept="image/*"
                        onChange={(e) => uploadProfileImage(e.target.files[0])}
                        className="hidden"
                      />
                      <label
                        htmlFor="profileImageInput"
                        className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-semibold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer transition-colors"
                      >
                        <CloudUpload size={18} />
                        Choose Photo
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* -------- STEP 3: DOCUMENTS -------- */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Legal Documents</h2>
                <p className="text-gray-500">Required for verification and safety</p>
              </div>

              <div className="grid gap-4">
                {[
                  ["drivingLicense", "Driving License", "Valid government verification"],
                  ["vehicleRegistration", "Vehicle Registration", "Registration Certificate (RC)"],
                  ["insurance", "Insurance Policy", "Current vehicle insurance"],
                ].map(([key, label, description]) => (
                  <div key={key} className={`group relative p-6 rounded-2xl border-2 transition-all flex items-center justify-between ${documents[key] ? "border-green-500 bg-green-50/50" : "border-gray-100 hover:border-[var(--color-primary)]/40 hover:shadow-md bg-white"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${documents[key] ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                        {documents[key] ? <CheckCircle size={24} /> : <FileCheck size={24} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{label}</h3>
                        <p className="text-sm text-gray-500">{description}</p>
                      </div>
                    </div>

                    <div>
                      {documents[key] ? (
                        <button
                          onClick={() => removeDocument(key)}
                          className="px-4 py-2 bg-white text-red-500 text-xs font-bold rounded-lg border border-gray-200 shadow-sm hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
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
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 cursor-pointer transition shadow-lg shadow-gray-200"
                          >
                            <Upload size={16} />
                            Upload
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 text-blue-700 text-sm">
                <div className="mt-0.5"><CheckCircle size={16} /></div>
                <p>All documents are stored securely and encrypted. They are only used for verification purposes.</p>
              </div>
            </div>
          )}

          {/* -------- STEP 4: REVIEW (MATCHING SCREENSHOT) -------- */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
                <p className="text-gray-500">Please review your details before final submission</p>
              </div>

              {/* Card Container */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-lg">

                {/* Dark User Header - Matches Screenshot */}
                <div className="bg-[#0F172A] p-6 flex items-center gap-4 text-white">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-xl font-bold border-2 border-white/20">
                    {user?.fullName ? user.fullName.charAt(0) : "U"}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">DRIVER APPLICATION</p>
                    <h3 className="text-xl font-bold text-white">{user?.fullName || "Driver Applicant"}</h3>
                    <p className="text-sm text-gray-400">{phoneNumber || "No phone added"}</p>
                  </div>
                </div>

                <div className="p-8">
                  {/* Vehicle Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">VEHICLE</p>
                      <p className="font-bold text-gray-900 text-lg">{vehicle.year} {vehicle.brand} {vehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">LICENSE PLATE</p>
                      <span className="inline-block bg-yellow-400 px-3 py-1 rounded text-black font-bold font-mono text-sm shadow-sm">
                        {vehicle.licensePlate}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">COLOR</p>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shadow-sm border border-gray-200" style={{ backgroundColor: vehicle.color }}></span>
                        <span className="font-bold text-gray-900 uppercase">{vehicle.color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 my-6"></div>

                  {/* Photos & Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">VEHICLE PHOTOS</p>
                      <div className="flex gap-3">
                        {vehicle.images.map((img, i) => (
                          <div key={i} className="w-16 h-12 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                            <img src={img} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">DOCUMENTS STATUS</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(documents).map(([k, v]) => (
                          <span key={k} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1 uppercase tracking-wide ${v ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                            {k.replace(/([A-Z])/g, ' $1').trim()}: {v ? "Uploaded" : "Pending"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 pt-4">
                <button
                  disabled={loading}
                  onClick={submitRegistration}
                  className="w-full h-16 bg-[var(--color-primary)] text-white rounded-xl font-bold text-lg hover:bg-[var(--color-primary-light)] disabled:opacity-50 transition-all shadow-xl shadow-[var(--color-primary)]/20 hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Submit Application <CheckCircle className="fill-white text-[var(--color-primary)]" />
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest">By submitting, you agree to our Terms of Service and Privacy Policy.</p>
              </div>
            </div>
          )}

          {/* -------- NAVIGATION -------- */}
          {/* Only match specific screenshot requirements for Back button placement if needed, but standard logic applies */}
          <div className="flex items-center justify-between mt-12">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-400 font-bold hover:text-gray-600 transition flex items-center gap-2 text-sm"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : <div></div>}

            {step < 4 && (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg flex items-center gap-2 group"
              >
                Next Step
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

}