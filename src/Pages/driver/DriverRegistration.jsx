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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Driver Registration</h1>
          <p className="text-gray-600">Complete your registration to start driving</p>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            {["Vehicle", "Images", "Documents", "Review"].map((label, i) => (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 font-bold text-lg transition-all ${step === i + 1
                      ? "bg-blue-600 text-white shadow-lg scale-110"
                      : step > i + 1
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {step > i + 1 ? <CheckCircle size={24} /> : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium text-center ${step === i + 1 ? "text-blue-600" : step > i + 1 ? "text-green-600" : "text-gray-500"
                      }`}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div className={`h-1 mx-2 flex-1 transition-all ${step > i + 1 ? "bg-green-500" : "bg-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 min-h-96">
          {/* -------- STEP 1: VEHICLE -------- */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Car className="text-blue-600" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Vehicle Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["brand", "model", "color", "licensePlate"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field === "licensePlate" ? "License Plate" : field.charAt(0).toUpperCase() + field.slice(1)}
                      {["brand", "model", "licensePlate"].includes(field) && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      placeholder={field === "licensePlate" ? "e.g., DL-01-AB-1234" : `Enter ${field}`}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors[field] ? "border-red-500" : "border-gray-300"
                        }`}
                      value={vehicle[field]}
                      onChange={(e) => setVehicle({ ...vehicle, [field]: e.target.value })}
                    />
                    {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 2023"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${errors.year ? "border-red-500" : "border-gray-300"
                      }`}
                    value={vehicle.year}
                    onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                  />
                  {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
                </div>
              </div>

              <hr className="my-8" />

              {/* Verification Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Phone className="text-blue-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Verification</h3>
                </div>

                {/* Phone Verification */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      placeholder="+91 Enter Phone Number"
                      className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100 ${errors.phoneNumber ? "border-red-500" : "border-gray-300"
                        }`}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={phoneVerified || otpSent}
                    />
                    {!phoneVerified && !otpSent && (
                      <button
                        onClick={sendOTP}
                        disabled={loading || !phoneNumber}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                  {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}

                  {otpSent && !phoneVerified && (
                    <div className="flex gap-2">
                      <input
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <button
                        onClick={verifyOTP}
                        disabled={loading || !otp}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        Verify
                      </button>
                    </div>
                  )}

                  {phoneVerified && (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle size={20} />
                      Phone number verified
                    </div>
                  )}
                  {errors.phoneVerified && <p className="text-red-500 text-sm">{errors.phoneVerified}</p>}
                </div>

                {/* Email Verification Status */}
                <div className={`p-4 rounded-lg border-2 flex items-center justify-between ${emailVerified ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}>
                  <div className="flex items-center gap-3">
                    <Mail size={20} className={emailVerified ? "text-green-600" : "text-red-600"} />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{user?.primaryEmailAddress?.emailAddress}</p>
                      <p className="text-xs text-gray-600">Email address verification</p>
                    </div>
                  </div>
                  {emailVerified ? (
                    <span className="text-green-600 font-bold text-sm">✓ Verified</span>
                  ) : (
                    <span className="text-red-600 font-bold text-sm">! Verify in Account</span>
                  )}
                </div>
                {errors.emailVerified && <p className="text-red-500 text-sm">{errors.emailVerified}</p>}
              </div>
            </div>
          )}
          {/* -------- STEP 2: VEHICLE IMAGES + PROFILE -------- */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Vehicle Images Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <CloudUpload className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Vehicle Images</h2>
                    <p className="text-sm text-gray-600">Upload 1-4 photos of your vehicle</p>
                  </div>
                </div>

                {/* Drag & Drop Area */}
                <div
                  className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    uploadVehicleImages(e.dataTransfer.files);
                  }}
                >
                  <input
                    type="file"
                    id="vehicleImageInput"
                    multiple
                    accept="image/*"
                    onChange={(e) => uploadVehicleImages(e.target.files)}
                    className="hidden"
                  />
                  <label htmlFor="vehicleImageInput" className="cursor-pointer">
                    <CloudUpload className="mx-auto w-16 h-16 text-blue-400 mb-4" />
                    <p className="text-lg font-semibold text-gray-800 mb-1">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-600">PNG, JPG, GIF - Up to 10MB each</p>
                  </label>
                </div>

                {/* Image Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                    <p className="text-3xl font-bold text-blue-600">{vehicle.images.length}/4</p>
                    <p className="text-sm text-gray-600 mt-1">Images Uploaded</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                    <p className="text-3xl font-bold text-green-600">{Math.round((vehicle.images.length / 4) * 100)}%</p>
                    <p className="text-sm text-gray-600 mt-1">Progress</p>
                  </div>
                </div>

                {/* Uploaded Images */}
                {vehicle.images.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-4">Uploaded Images</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {vehicle.images.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img} className="h-32 w-full object-cover rounded-lg shadow-md" alt={`Vehicle ${i + 1}`} />
                          <button
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-lg"
                            onClick={() => removeVehicleImage(i)}
                            title="Remove image"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {errors.vehicleImages && <p className="text-red-500 text-sm mt-4 font-medium">{errors.vehicleImages}</p>}
              </div>

              <hr className="my-8" />

              {/* Profile Picture Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <User className="text-purple-600" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Profile Picture</h2>
                </div>

                {/* Checkbox for Clerk Image */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useClerkImage}
                      onChange={() => {
                        setUseClerkImage(!useClerkImage);
                        if (useClerkImage) {
                          setProfileImage("");
                        } else {
                          setProfileImage(user?.imageUrl || "");
                        }
                      }}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-800">Use Clerk Profile Image</p>
                      <p className="text-sm text-gray-600">Use your account profile picture</p>
                    </div>
                  </label>
                </div>

                {/* Custom Upload or Preview */}
                {!useClerkImage && (
                  <div className="mb-6">
                    <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center bg-purple-50 hover:bg-purple-100 transition">
                      <input
                        type="file"
                        id="profileImageInput"
                        accept="image/*"
                        onChange={(e) => uploadProfileImage(e.target.files[0])}
                        className="hidden"
                      />
                      <label htmlFor="profileImageInput" className="cursor-pointer">
                        <CloudUpload className="mx-auto w-12 h-12 text-purple-400 mb-3" />
                        <p className="text-base font-semibold text-gray-800">Click to upload profile photo</p>
                        <p className="text-sm text-gray-600">PNG, JPG - Up to 10MB</p>
                      </label>
                    </div>
                  </div>
                )}

                {/* Profile Preview */}
                {profileImage && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-4">Profile Preview</p>
                    <div className="relative inline-block">
                      <img
                        src={profileImage}
                        className="h-32 w-32 rounded-full object-cover shadow-lg border-4 border-purple-200"
                        alt="Profile"
                      />
                      {!useClerkImage && (
                        <button
                          className="absolute top-0 right-0 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition"
                          onClick={removeProfileImage}
                          title="Remove profile image"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {errors.profileImage && <p className="text-red-500 text-sm mt-4 font-medium text-center">{errors.profileImage}</p>}
              </div>
            </div>
          )}
          {/* -------- STEP 3: DOCUMENTS -------- */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-lg">
                  <FileCheck className="text-green-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Upload Documents</h2>
                  <p className="text-sm text-gray-600">Upload your official documents</p>
                </div>
              </div>

              {[
                ["drivingLicense", "Driving License", "Your valid driving license"],
                ["vehicleRegistration", "Vehicle Registration", "Your vehicle registration document"],
                ["insurance", "Insurance", "Your vehicle insurance certificate"],
              ].map(([key, label, description]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-1">{label} <span className="text-red-500">*</span></label>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                    {documents[key] && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-green-500" size={24} />
                      </div>
                    )}
                  </div>

                  {!documents[key] ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id={`doc-${key}`}
                        accept="image/*,application/pdf"
                        onChange={(e) => uploadDocument(e.target.files[0], key)}
                        className="hidden"
                      />
                      <label htmlFor={`doc-${key}`} className="cursor-pointer">
                        <CloudUpload className="mx-auto w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-700">Click to upload</p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
                      <div>
                        <p className="text-sm font-medium text-green-800">✓ Document uploaded successfully</p>
                      </div>
                      <button
                        className="text-red-500 hover:text-red-700 transition font-medium text-sm"
                        onClick={() => removeDocument(key)}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {errors[key] && <p className="text-red-500 text-sm mt-3 font-medium">{errors[key]}</p>}
                </div>
              ))}
            </div>
          )}
          {/* -------- STEP 4: REVIEW -------- */}
          {step === 4 && (
            <div className="space-y-8">
              <div className="flex items-center justify-center mb-8">
                <div className="bg-green-100 p-4 rounded-full">
                  <FileCheck className="text-green-600" size={32} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Vehicle Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Brand</p>
                    <p className="font-semibold text-gray-800">{vehicle.brand}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Model</p>
                    <p className="font-semibold text-gray-800">{vehicle.model}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Year</p>
                    <p className="font-semibold text-gray-800">{vehicle.year}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Color</p>
                    <p className="font-semibold text-gray-800">{vehicle.color}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">License Plate</p>
                    <p className="font-semibold text-gray-800">{vehicle.licensePlate}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Phone</p>
                    <p className="font-semibold text-gray-800">{phoneNumber}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Images */}
              {vehicle.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Vehicle Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {vehicle.images.map((img, i) => (
                      <div key={i} className="rounded-lg overflow-hidden shadow-md">
                        <img src={img} className="h-32 w-full object-cover" alt={`Vehicle ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Status */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Documents</h3>
                <div className="space-y-3">
                  {[
                    ["drivingLicense", "Driving License"],
                    ["vehicleRegistration", "Vehicle Registration"],
                    ["insurance", "Insurance"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="font-medium text-gray-800">{label}</span>
                      {documents[key] ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={20} />
                          <span className="text-sm font-medium">Uploaded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <span className="text-sm font-medium">Not uploaded</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Picture */}
              {profileImage && (
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Profile Picture</h3>
                  <img
                    src={profileImage}
                    className="h-32 w-32 rounded-full object-cover shadow-lg border-4 border-blue-200"
                    alt="Profile"
                  />
                </div>
              )}

              {/* Submission Info */}
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <span className="font-bold">Note:</span> Your submission will be reviewed by an admin within 24-48 hours. You'll receive a notification once it's approved.
                </p>
              </div>

              {/* Submit Button */}
              <button
                disabled={loading}
                onClick={submitRegistration}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit Registration"
                )}
              </button>
            </div>
          )}

          {/* -------- NAVIGATION -------- */}
          <div className="flex items-center justify-between gap-4 mt-10">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition"
              >
                <ChevronLeft size={20} />
                Back
              </button>
            )}
            {step < 4 && (
              <button
                onClick={handleNext}
                className="ml-auto flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
              >
                Next
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}