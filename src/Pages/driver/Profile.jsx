import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Car, FileText, Phone, Mail, Edit, Trash2, Save, X, ShieldCheck, Star, Navigation, Link as LinkIcon, CheckCircle2, XCircle } from 'lucide-react';

export default function Profile() {
    const { user } = useUser();
    const navigate = useNavigate();
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const [role, setRole] = useState(null);
    const [driverData, setDriverData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState({});

    useEffect(() => {
        // Get role from unsafeMetadata
        const userRole = user?.unsafeMetadata?.role;
        setRole(userRole);

        // Fetch driver data if role is driver
        if (userRole === 'driver') {
            fetchDriverData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchDriverData = async () => {
        try {
            const response = await axios.get(`${BACKEND_URL}/api/driver-profile/${user.id}`);
            setDriverData(response.data);
            setEditedData(response.data);
        } catch (err) {
            console.error('Error fetching driver data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleCancel = () => {
        setEditMode(false);
        setEditedData(driverData);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await axios.put(`${BACKEND_URL}/api/driver-profile/${user.id}`, editedData);
            alert('Profile updated successfully! Modified fields will require re-verification.');
            setEditMode(false);
            fetchDriverData(); // Refresh data
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete your driver profile? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);
            await axios.delete(`${BACKEND_URL}/api/driver-profile/${user.id}`);
            alert('Driver profile deleted successfully');
            navigate('/home');
        } catch (err) {
            console.error('Error deleting profile:', err);
            alert('Failed to delete profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--color-primary)] mx-auto"></div>
                    <p className="mt-4 text-lg">Loading profile...</p>
                </div>
            </div>
        );
    }

    // Rider Profile (Coming Soon)
    if (role === 'rider') {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 font-[var(--font-family)] relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-[var(--color-primary)]/5 blur-3xl"></div>
                    <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-3xl"></div>
                </div>

                <div className="max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-12 text-center relative z-10">
                    <div className="w-24 h-24 bg-[var(--color-primary-muted)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <User className="w-12 h-12 text-[var(--color-primary)]" />
                    </div>
                    <h1 className="text-4xl font-extrabold mb-4 text-gray-900 tracking-tight">Rider Profile</h1>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 mb-8">
                        <p className="text-xl font-medium text-gray-800 mb-2">
                            Coming Soon
                        </p>
                        <p className="text-gray-600">
                            We're crafting a dedicated experience for riders. Stay tuned for updates!
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/home')}
                        className="px-8 py-4 bg-[var(--color-primary)] text-white text-lg font-bold rounded-xl shadow-lg shadow-[var(--color-primary)]/30 hover:bg-[var(--color-primary-light)] hover:-translate-y-1 transition-all"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Driver Profile
    if (role === 'driver' && driverData) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] pb-20 font-[var(--font-family)]">
                {/* Header / Hero Section */}
                <div className="relative bg-[var(--color-primary)] text-white pt-24 pb-32 rounded-b-[3rem] shadow-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] opacity-90"></div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

                    <div className="relative z-10 max-w-6xl mx-auto px-6">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-white/30 rounded-full blur transition duration-500 group-hover:bg-white/50"></div>
                                <img
                                    src={driverData.profileImage || "https://via.placeholder.com/150"}
                                    alt="Profile"
                                    className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-2xl"
                                />
                                <div className="absolute bottom-2 right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white" title="Online"></div>
                            </div>

                            <div className="text-center md:text-left flex-1">
                                <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{user?.fullName || "Driver Name"}</h1>
                                <div className="flex flex-col md:flex-row items-center gap-4 text-primary-50">
                                    <p className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                        <Mail className="w-4 h-4" />
                                        {user?.primaryEmailAddress?.emailAddress}
                                    </p>
                                    {driverData.phoneNumber && (
                                        <p className="flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                            <Phone className="w-4 h-4" />
                                            {driverData.phoneNumber}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {!editMode ? (
                                    <>
                                        <button
                                            onClick={handleEdit}
                                            className="flex items-center gap-2 px-6 py-3 bg-white text-[var(--color-primary)] rounded-xl font-bold shadow-lg hover:bg-gray-50 hover:-translate-y-1 transition-all"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit Profile
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex items-center gap-2 px-6 py-3 bg-red-500/20 backdrop-blur-md border border-red-500/30 text-white rounded-xl font-bold hover:bg-red-500/30 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:bg-green-600 hover:-translate-y-1 transition-all"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-xl font-bold hover:bg-white/30 transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            { label: "Completed Rides", value: driverData.rides?.completed || 0, icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
                            { label: "Average Rating", value: driverData.rating?.average?.toFixed(1) || 0, icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" }, // Needed to import Star if not present, changed safely below
                            { label: "Distance Driven", value: `${driverData.distanceDrivenKm || 0} km`, icon: Navigation, color: "text-purple-600", bg: "bg-purple-50" } // Needed Navigation
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 flex items-center gap-5 hover:transform hover:scale-105 transition-all duration-300">
                                <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-3xl font-extrabold text-gray-800">{stat.value}</p>
                                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Vehicle Information */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <h2 className="text-xl font-bold flex items-center gap-3 text-gray-800">
                                        <div className="p-2 bg-[var(--color-primary-muted)] rounded-lg text-[var(--color-primary)]">
                                            <Car className="w-5 h-5" />
                                        </div>
                                        Vehicle Details
                                    </h2>
                                </div>
                                <div className="p-8">
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        {['brand', 'model', 'year', 'color', 'licensePlate'].map((field) => (
                                            <div key={field} className="group">
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                    {field === 'licensePlate' ? 'License Plate' : field}
                                                </label>
                                                {editMode ? (
                                                    <input
                                                        type={field === 'year' ? 'number' : 'text'}
                                                        value={editedData.vehicle?.[field] || ''}
                                                        onChange={(e) =>
                                                            setEditedData({
                                                                ...editedData,
                                                                vehicle: { ...editedData.vehicle, [field]: e.target.value },
                                                            })
                                                        }
                                                        className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-[var(--color-primary)] text-gray-800 font-semibold transition-all outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 group-hover:border-[var(--color-primary)]/30 transition-colors">
                                                        {driverData.vehicle?.[field] || 'N/A'}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Detailed Vehicle Images */}
                                    {driverData.vehicle?.images && driverData.vehicle.images.length > 0 && (
                                        <div className="mt-10">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Vehicle Gallery</h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {driverData.vehicle.images.map((img, i) => (
                                                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-video shadow-md hover:shadow-xl transition-all">
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10"></div>
                                                        <img
                                                            src={img}
                                                            alt={`Vehicle ${i + 1}`}
                                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Status & Documents */}
                        <div className="space-y-8">

                            {/* Verification Status */}
                            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-green-600" />
                                        Verification Status
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {Object.entries(driverData.verification || {}).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between group">
                                            <span className="font-medium text-gray-600 capitalize group-hover:text-[var(--color-primary)] transition-colors">
                                                {key.replace(/([A-Z])/g, ' $1').replace('Verified', '').trim()}
                                            </span>
                                            {value ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Verified
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1">
                                                    <XCircle className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        Legal Documents
                                    </h2>
                                </div>
                                <div className="p-6 space-y-4">
                                    {Object.entries(driverData.documents || {}).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100 group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-lg shadow-sm text-gray-400 group-hover:text-blue-500 transition-colors">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <span className="font-semibold text-gray-700 capitalize text-sm">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                            </div>
                                            {value ? (
                                                <a
                                                    href={value}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="View Document"
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium italic">Pending</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No role set
    return (
        <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 font-[var(--font-family)]">
            <div className="text-center max-w-md w-full">
                <div className="mb-8 p-6 bg-white rounded-3xl shadow-xl border border-gray-100">
                    <p className="text-xl font-bold text-gray-800 mb-6">Please select a role to continue</p>
                    <button
                        onClick={() => navigate('/role-selection')}
                        className="w-full px-6 py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-primary)]/25 hover:bg-[var(--color-primary-light)] hover:-translate-y-1 transition-all"
                    >
                        Select Role
                    </button>
                </div>
            </div>
        </div>
    );
}
