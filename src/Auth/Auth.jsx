import React, { useState, useEffect } from 'react';
import {
    SignedIn,
    SignedOut,
    SignOutButton,
    UserButton,
    useAuth,
    useSignUp,
    useSignIn,
    SignInButton
} from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import Loader from '../components/Loading';

const Auth = () => {
    const url = import.meta.env.VITE_BACKEND_URL;
    const { isSignedIn, isLoaded, getToken } = useAuth();

    // Clerk hooks for headless flows
    const { signUp, setActive: setActiveSignUp } = useSignUp();
    const { signIn, setActive: setActiveSignIn } = useSignIn();

    const [email, setEmail] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [mode, setMode] = useState("signup"); // "signup" or "signin"
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchToken = async () => {
            if (!isSignedIn) return;
            const token = await getToken(); // Get Clerk JWT
            console.log('Token from Clerk:', token);

            const response = await fetch(`${url}/print-token`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();
            console.log('Response from backend:', data);
        };

        fetchToken();
    }, [isSignedIn]);

    if (!isLoaded) {
        return <Loader isDarkMode={true} />;
    }

    if (isSignedIn) {
        return <Navigate to='/home' replace />;
    }

    // ---- Handlers ----
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "signup") {
                // --- Sign Up Flow ---
                await signUp.create({ emailAddress: email });
                await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                setPendingVerification(true);
            } else {
                // --- Sign In Flow ---
                const attempt = await signIn.create({ identifier: email });

                // Find the email factor
                const emailFactor = attempt.supportedFirstFactors.find(
                    (f) => f.strategy === "email_code"
                );
                if (!emailFactor) throw new Error("Email code strategy not available");

                await signIn.prepareFirstFactor({
                    strategy: "email_code",
                    emailAddressId: emailFactor.emailAddressId,
                });

                setPendingVerification(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === "signup") {
                const complete = await signUp.attemptEmailAddressVerification({ code });
                if (complete.status === "complete") {
                    await setActiveSignUp({ session: complete.createdSessionId });
                }
            } else {
                const complete = await signIn.attemptFirstFactor({ strategy: "email_code", code });
                if (complete.status === "complete") {
                    await setActiveSignIn({ session: complete.createdSessionId });
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ---- OAuth Handlers ----
    const handleOAuth = async (provider) => {
        try {
            await signIn.authenticateWithRedirect({
                strategy: `oauth_${provider}`, // e.g. oauth_google
                redirectUrl: "/sso-callback",   // Clerk will redirect back here
                redirectUrlComplete: "/home",   // After successful login
            });
        } catch (err) {
            console.error("OAuth error:", err);
        }
    };

    // ---- UI ----
    return (
        <div className='min-h-screen relative overflow-hidden'>
            {/* Background Images - Responsive */}
            <div className="absolute inset-0 w-full h-full">
                {/* Large Screen Background */}
                <div
                    className="hidden lg:block w-full h-full bg-cover bg-center relative"
                    style={{ backgroundImage: "url('/largeDeviceLoginBg.jpg')" }}
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>

                {/* Mobile Screen Background */}
                <div
                    className="lg:hidden w-full h-full bg-cover bg-center relative"
                    style={{ backgroundImage: "url('/mobileLoginBg.jpg')" }}
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>
            </div>


            {loading && <Loader isDarkMode={true} />}

            {/* Large Screen Layout */}
            <div className='hidden lg:flex min-h-screen relative z-10'>
                {/* Left Half - Empty space for background showcase */}
                <div className='flex-1'></div>

                {/* Right Half - Login Form */}
                <div className='flex-1 flex flex-col justify-between p-8'>
                    {/* Translucent Background Overlay */}
                    <div className='absolute inset-y-0 right-0 w-1/2 bg-black/30 backdrop-blur-sm'></div>

                    {/* Content Container */}
                    <div className='relative z-20 flex flex-col justify-between h-full text-white'>
                        {/* Top Header */}
                        <div className='flex justify-between items-center mb-8'>
                            <div className='flex items-center gap-2 text-xl font-bold'>
                                <span>💡</span>
                                <span>Kuladeep Reddy</span>
                            </div>
                            <button
                                className='text-sm text-gray-300 hover:text-white transition-colors'
                                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                            >
                                {mode === "signup" ? "HAVE AN ACCOUNT? SIGN IN" : "NO ACCOUNT? SIGN UP"}
                            </button>
                        </div>

                        {/* Main Content */}
                        <SignedOut>
                            <div className='flex flex-col items-center gap-8 max-w-md mx-auto'>
                                <h2 className='text-6xl font-bold tracking-wide text-center'>
                                    SIGN IN
                                </h2>

                                {!pendingVerification ? (
                                    <>
                                        {/* Email Form */}
                                        <form onSubmit={handleSubmit} className='flex flex-col gap-6 w-full'>
                                            <p className='text-lg text-gray-300 text-center'>Sign in with email address</p>
                                            <div className='relative'>
                                                <span className='absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400'>✉️</span>
                                                <input
                                                    type='email'
                                                    placeholder='Yourname@gmail.com'
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className='w-full pl-12 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all'
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg font-semibold text-white border border-white/20 shadow-xl hover:from-purple-700 hover:to-blue-600 transition duration-200 transform hover:scale-105"
                                            >
                                                {mode === "signup" ? "Sign up" : "Sign in"}
                                            </button>


                                        </form>

                                        {/* OR divider */}
                                        <div className='flex items-center my-6 w-full'>
                                            <hr className='flex-grow border-white/30' />
                                            <span className='mx-4 text-gray-300 text-sm'>Or continue with</span>
                                            <hr className='flex-grow border-white/30' />
                                        </div>

                                        {/* Social Buttons */}
                                        <div className="flex gap-4 w-full">
                                            <button
                                                onClick={() => handleOAuth("google")}
                                                className="flex items-center justify-center gap-3 px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition duration-200 transform hover:scale-105"
                                            >
                                                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                                <span>Google</span>
                                            </button>
                                            <button
                                                onClick={() => handleOAuth("facebook")}
                                                className="flex items-center justify-center gap-3 px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition duration-200 transform hover:scale-105"
                                            >
                                                <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5" />
                                                <span>Facebook</span>
                                            </button>
                                            <button
                                                onClick={() => handleOAuth("github")}
                                                className="flex items-center justify-center gap-3 px-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg hover:bg-white/20 transition duration-200 transform hover:scale-105"
                                            >
                                                <img src="https://github.com/favicon.ico" alt="GitHub" className="w-5 h-5" />
                                                <span>GitHub</span>
                                            </button>
                                        </div>



                                        <p className='text-xs text-gray-400 mt-4 text-center'>
                                            By registering you agree with our Terms and Conditions
                                        </p>
                                    </>
                                ) : (
                                    /* Verification Form */
                                    <form onSubmit={handleVerify} className='flex flex-col gap-6 w-full'>
                                        <p className='text-lg text-gray-300 text-center'>Enter verification code sent to your email</p>
                                        <input
                                            type='text'
                                            placeholder='Verification code'
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            required
                                            className='w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all text-center'
                                        />
                                        <button
                                            type='submit'
                                            className='w-full py-4 bg-gradient-to-r from-green-600 to-green-500 rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition duration-200 transform hover:scale-105'
                                        >
                                            Verify
                                        </button>
                                    </form>
                                )}
                            </div>
                        </SignedOut>

                        <SignedIn>
                            <div className='flex flex-col items-center gap-6'>
                                <h2 className='text-3xl font-semibold'>You are signed in!</h2>
                                <UserButton />
                                <SignOutButton>
                                    <button className='px-8 py-3 bg-red-500 rounded-lg font-semibold hover:bg-red-600 transition duration-200 transform hover:scale-105'>
                                        Sign Out
                                    </button>
                                </SignOutButton>
                            </div>
                        </SignedIn>

                        {/* Bottom Section */}
                        <div className='text-center py-8'>
                            <h3 className='text-4xl font-bold'>
                                Sign in to your
                            </h3>
                            <h3 className='text-4xl font-bold text-purple-400'>
                                ADVENTURE!
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout - Original Design */}
            <div className='lg:hidden flex flex-col justify-between items-center min-h-screen text-white px-4 py-6 relative z-10'>
                {/* Top Header */}
                <div className='w-full flex justify-between items-center'>
                    <div className='flex items-center gap-2 text-xl font-bold'>
                        <span>💡</span>
                        <span>Kuladeep Reddy</span>
                    </div>
                    <button
                        className='text-sm text-gray-300 hover:text-white'
                        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
                    >
                        {mode === "signup" ? "HAVE AN ACCOUNT? SIGN IN" : "NO ACCOUNT? SIGN UP"}
                    </button>
                </div>

                {/* Main Content */}
                <SignedOut>
                    <div className='flex flex-col items-center gap-6 max-w-md text-center'>
                        <h2 className='text-6xl font-bold tracking-wide text-center'>
                            {mode === "signup" ? "SIGN UP" : "SIGN IN"}
                        </h2>


                        {!pendingVerification ? (
                            <>
                                {/* Email Form */}
                                <form onSubmit={handleSubmit} className='flex flex-col gap-4 w-full'>
                                    <p className='text-lg text-gray-300'>Sign in with email address</p>
                                    <div className='relative'>
                                        <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400'>✉️</span>
                                        <input
                                            type='email'
                                            placeholder='Yourname@gmail.com'
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className='w-full pl-10 py-3 bg-purple-900/30 border border-purple-500/50 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:border-purple-400'
                                        />
                                    </div>
                                    <button
                                        type='submit'
                                        className='w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-600 transition duration-200'
                                    >
                                        {mode === "signup" ? "Sign up" : "Sign in"}
                                    </button>
                                </form>

                                {/* OR divider */}
                                <div className='flex items-center my-4 w-full'>
                                    <hr className='flex-grow border-gray-500' />
                                    <span className='mx-2 text-gray-400 text-sm'>Or continue with</span>
                                    <hr className='flex-grow border-gray-500' />
                                </div>

                                {/* Social Buttons */}
                                <div className='flex gap-4 w-full'>
                                    <button
                                        onClick={() => handleOAuth("google")}
                                        className='flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 border border-gray-500 rounded-lg hover:bg-white/20 transition duration-200'
                                    >
                                        <img src='https://www.google.com/favicon.ico' alt='Google' className='w-5 h-5' />
                                        <span>Google</span>
                                    </button>
                                    <button
                                        onClick={() => handleOAuth("facebook")}
                                        className='flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 border border-gray-500 rounded-lg hover:bg-white/20 transition duration-200'
                                    >
                                        <img src='https://www.facebook.com/favicon.ico' alt='Facebook' className='w-5 h-5' />
                                        <span>Facebook</span>
                                    </button>
                                    <button
                                        onClick={() => handleOAuth("github")}
                                        className='flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 border border-gray-500 rounded-lg hover:bg-white/20 transition duration-200'
                                    >
                                        <img src='https://github.com/favicon.ico' alt='GitHub' className='w-5 h-5' />
                                        <span>GitHub</span>
                                    </button>
                                </div>

                                <p className='text-xs text-gray-400 mt-2'>
                                    By registering you agree with our Terms and Conditions
                                </p>
                            </>
                        ) : (
                            /* Verification Form */
                            <form onSubmit={handleVerify} className='flex flex-col gap-4 w-full'>
                                <p className='text-lg text-gray-300'>Enter verification code sent to your email</p>
                                <input
                                    type='text'
                                    placeholder='Verification code'
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    className='w-full py-3 bg-purple-900/30 border border-purple-500/50 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:border-purple-400'
                                />
                                <button
                                    type='submit'
                                    className='w-full py-3 bg-gradient-to-r from-green-600 to-green-500 rounded-lg font-semibold hover:from-green-700 hover:to-green-600 transition duration-200'
                                >
                                    Verify
                                </button>
                            </form>
                        )}
                    </div>
                </SignedOut>

                <SignedIn>
                    <div className='flex flex-col items-center gap-6'>
                        <h2 className='text-3xl font-semibold'>You are signed in!</h2>
                        <UserButton />
                        <SignOutButton>
                            <button className='px-6 py-2 bg-red-500 rounded-lg font-semibold hover:bg-red-600 transition duration-200'>
                                Sign Out
                            </button>
                        </SignOutButton>
                    </div>
                </SignedIn>

                {/* Bottom Section */}
                <div className='text-center pb-4'>
                    <h3 className='text-4xl font-bold'>
                        Sign in to your
                    </h3>
                    <h3 className='text-4xl font-bold text-purple-400'>
                        ADVENTURE!
                    </h3>
                </div>
            </div>
        </div>
    );
};

export default Auth;