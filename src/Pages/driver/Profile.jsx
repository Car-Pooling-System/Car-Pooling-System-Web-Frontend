import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Car, FileText, Phone, Mail, Edit, Trash2, Save, X } from 'lucide-react';

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
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-12 text-center">
                    <User className="w-24 h-24 text-[var(--color-primary)] mx-auto mb-6" />
                    <h1 className="text-4xl font-bold mb-4">Rider Profile</h1>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <p className="text-xl text-gray-700">
                            🚀 This page will be updated soon to fit rider data!
                        </p>
                        <p className="text-gray-600 mt-2">
                            We're working on bringing you a comprehensive rider profile experience.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/home')}
                        className="mt-8 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-semibold hover:opacity-90"
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
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                {driverData.profileImage && (
                                    <img
                                        src={driverData.profileImage}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-primary)]"
                                    />
                                )}
                                <div>
                                    <h1 className="text-3xl font-bold">Driver Profile</h1>
                                    <p className="text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
                                    {driverData.phoneNumber && (
                                        <p className="text-gray-600 flex items-center gap-2 mt-1">
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
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                        >
                                            <Save className="w-4 h-4" />
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                        >
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <Car className="w-6 h-6 text-[var(--color-primary)]" />
                            Vehicle Information
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {['brand', 'model', 'year', 'color', 'licensePlate'].map((field) => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
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
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)]"
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-semibold">{driverData.vehicle?.[field] || 'N/A'}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Vehicle Images */}
                        {driverData.vehicle?.images && driverData.vehicle.images.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold mb-3">Vehicle Images</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {driverData.vehicle.images.map((img, i) => (
                                        <img
                                            key={i}
                                            src={img}
                                            alt={`Vehicle ${i + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Documents */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-[var(--color-primary)]" />
                            Documents
                        </h2>
                        <div className="space-y-4">
                            {Object.entries(driverData.documents || {}).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <span className="font-medium capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                    {value ? (
                                        <a
                                            href={value}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline"
                                        >
                                            View Document
                                        </a>
                                    ) : (
                                        <span className="text-gray-400">Not uploaded</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                        <h2 className="text-2xl font-bold mb-6">Statistics</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-3xl font-bold text-blue-600">{driverData.rides?.completed || 0}</p>
                                <p className="text-gray-600">Completed Rides</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-3xl font-bold text-green-600">{driverData.rating?.average?.toFixed(1) || 0}</p>
                                <p className="text-gray-600">Average Rating</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <p className="text-3xl font-bold text-purple-600">{driverData.distanceDrivenKm || 0} km</p>
                                <p className="text-gray-600">Distance Driven</p>
                            </div>
                        </div>
                    </div>

                    {/* Verification Status */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold mb-6">Verification Status</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {Object.entries(driverData.verification || {}).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <span className="font-medium capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').replace('Verified', '').trim()}
                                    </span>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-semibold ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        {value ? 'Verified' : 'Not Verified'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No role set
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <p className="text-xl">Please select a role to continue</p>
                <button
                    onClick={() => navigate('/role-selection')}
                    className="mt-4 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg"
                >
                    Select Role
                </button>
            </div>
        </div>
    );
}
