import { useState, useEffect } from "react";
import { uploadToStorage, deleteFromStorage } from "../../../utils/uploadToStorage";
import axios from "axios";
import { Car, Upload, FileCheck, User, Trash2, Phone, Mail } from "lucide-react";
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
    <div className="max-w-3xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Driver Registration</h1>
      {/* -------- STEP INDICATOR -------- */}
      <div className="flex justify-between mb-10 text-sm">
        {["Vehicle", "Images", "Documents", "Review"].map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center ${step === i + 1 ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-muted)]"
              }`}
          >
            {label}
          </div>
        ))}
      </div>
      {/* -------- STEP 1: VEHICLE -------- */}
      {step === 1 && (
        <div className="space-y-4">
          <Car className="mx-auto w-10 h-10 text-[var(--color-primary)]" />
          {["brand", "model", "color", "licensePlate"].map((field) => (
            <div key={field}>
              <input
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className="w-full px-4 py-3 border rounded-md"
                value={vehicle[field]}
                onChange={(e) => setVehicle({ ...vehicle, [field]: e.target.value })}
              />
              {errors[field] && <p className="text-red-500 text-sm">{errors[field]}</p>}
            </div>
          ))}
          <div>
            <input
              type="number"
              placeholder="Year"
              className="w-full px-4 py-3 border rounded-md"
              value={vehicle.year}
              onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
            />
            {errors.year && <p className="text-red-500 text-sm">{errors.year}</p>}
          </div>

          <hr className="my-6" />

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone size={18} /> Verification
            </h3>

            {/* Phone Verification */}
            <div className="flex gap-2">
              <input
                placeholder="Mobile Number (e.g. +91...)"
                className="flex-1 px-4 py-3 border rounded-md disabled:bg-gray-100"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={phoneVerified || otpSent}
              />
              {!phoneVerified && !otpSent && (
                <button
                  onClick={sendOTP}
                  disabled={loading || !phoneNumber}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md disabled:opacity-50"
                >
                  Send OTP
                </button>
              )}
            </div>
            {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}

            {otpSent && !phoneVerified && (
              <div className="flex gap-2">
                <input
                  placeholder="Enter OTP"
                  className="flex-1 px-4 py-3 border rounded-md"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button
                  onClick={verifyOTP}
                  disabled={loading || !otp}
                  className="px-4 py-2 bg-green-600 text-white rounded-md"
                >
                  Verify
                </button>
              </div>
            )}

            {phoneVerified && (
              <p className="text-green-600 flex items-center gap-1 text-sm font-medium">
                ✓ Phone number verified
              </p>
            )}
            {errors.phoneVerified && <p className="text-red-500 text-sm">{errors.phoneVerified}</p>}

            {/* Email Verification Status */}
            <div className="p-3 bg-gray-50 rounded-md border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-500" />
                <span className="text-sm font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
              </div>
              {emailVerified ? (
                <span className="text-green-600 text-sm font-bold">✓ Verified</span>
              ) : (
                <span className="text-red-500 text-sm font-bold">! Not Verified in Clerk</span>
              )}
            </div>
            {errors.emailVerified && <p className="text-red-500 text-sm">{errors.emailVerified}</p>}
          </div>
        </div>
      )}
      {/* -------- STEP 2: VEHICLE IMAGES + PROFILE -------- */}
      {step === 2 && (
        <div className="space-y-6 text-center">
          <Upload className="mx-auto w-10 h-10 text-[var(--color-primary)]" />
          <div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => uploadVehicleImages(e.target.files)}
            />
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              {vehicle.images.length}/4 vehicle images uploaded
            </p>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {vehicle.images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} className="h-20 w-full object-cover rounded" />
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                    onClick={() => removeVehicleImage(i)}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            {errors.vehicleImages && <p className="text-red-500 text-sm mt-2">{errors.vehicleImages}</p>}
          </div>
          <hr />
          <div className="space-y-3">
            <User className="mx-auto w-8 h-8 text-[var(--color-primary)]" />
            <label className="flex items-center justify-center gap-2">
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
              />
              Use Clerk profile image
            </label>
            {!useClerkImage && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => uploadProfileImage(e.target.files[0])}
              />
            )}
            {profileImage && (
              <div className="relative inline-block">
                <img src={profileImage} className="mx-auto h-24 w-24 rounded-full object-cover" />
                {!useClerkImage && (
                  <button
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                    onClick={removeProfileImage}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
            {errors.profileImage && <p className="text-red-500 text-sm mt-2">{errors.profileImage}</p>}
          </div>
        </div>
      )}
      {/* -------- STEP 3: DOCUMENTS -------- */}
      {step === 3 && (
        <div className="space-y-6">
          {[
            ["drivingLicense", "Driving License"],
            ["vehicleRegistration", "Vehicle Registration"],
            ["insurance", "Insurance"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block mb-2 font-medium">{label}</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => uploadDocument(e.target.files[0], key)}
              />
              {documents[key] && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-green-600">Uploaded</p>
                  <button
                    className="text-red-500"
                    onClick={() => removeDocument(key)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              {errors[key] && <p className="text-red-500 text-sm">{errors[key]}</p>}
            </div>
          ))}
        </div>
      )}
      {/* -------- STEP 4: REVIEW -------- */}
      {step === 4 && (
        <div className="space-y-6">
          <FileCheck className="mx-auto w-10 h-10 text-green-500" />
          <div className="bg-white rounded-lg p-6 shadow space-y-3">
            <h3 className="font-semibold">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Brand: {vehicle.brand}</div>
              <div>Model: {vehicle.model}</div>
              <div>Year: {vehicle.year}</div>
              <div>Color: {vehicle.color}</div>
              <div>License Plate: {vehicle.licensePlate}</div>
              <div>Phone: {phoneNumber}</div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Vehicle Images</h4>
              <div className="grid grid-cols-4 gap-2">
                {vehicle.images.map((img, i) => (
                  <img key={i} src={img} className="h-20 w-full object-cover rounded" />
                ))}
              </div>
            </div>
            <h3 className="font-semibold mt-4">Documents</h3>
            <ul className="text-sm">
              {Object.entries(documents).map(([k, v]) => (
                <li key={k}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}: {v ? "Uploaded" : "Not uploaded"}
                </li>
              ))}
            </ul>
            <h3 className="font-semibold mt-4">Profile Image</h3>
            {profileImage && (
              <img src={profileImage} className="h-24 w-24 rounded-full" />
            )}
          </div>
          <p className="text-center text-sm text-[var(--color-text-secondary)]">
            Your submission will be reviewed by an admin before approval.
          </p>
          <button
            disabled={loading}
            onClick={submitRegistration}
            className="w-full px-6 py-3 bg-[var(--color-primary)] text-white rounded-md"
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </button>
        </div>
      )}
      {/* -------- NAVIGATION -------- */}
      <div className="flex justify-between mt-10">
        {step > 1 && (
          <button onClick={handleBack}>Back</button>
        )}
        {step < 4 && (
          <button
            className="ml-auto text-[var(--color-primary)]"
            onClick={handleNext}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}