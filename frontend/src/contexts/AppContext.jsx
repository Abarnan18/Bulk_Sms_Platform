import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = "https://bulk-sms-platform-backend.onrender.com";
    const [isLoggedin, setIsLoggedin] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // ✅ Enable credentials for ALL requests
    axios.defaults.withCredentials = true;

    // ✅ Add interceptors to include Authorization header with stored token
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    // Send token as Bearer token in Authorization header
                    config.headers.Authorization = `Bearer ${token}`;
                    console.log("📤 Request with Bearer token to:", config.url);
                } else {
                    console.log("📤 Request without token to:", config.url);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    console.error("🔴 401 Unauthorized - Token invalid or expired");
                    localStorage.removeItem('token');
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, []);

    const getUserData = async () => {
        try {
            // Token is automatically added by request interceptor
            const { data } = await axios.get(backendUrl + "/api/user/data");
            
            if (data.success) {
                setUserData(data.user);
                setIsLoggedin(true);
                console.log("✅ User data fetched successfully");
                return true;
            } else {
                setUserData(null);
                setIsLoggedin(false);
                return false;
            }
        } catch (error) {
            console.error("❌ Error fetching user data:", error.response?.status, error.message);
            setUserData(null);
            setIsLoggedin(false);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            // Token will be added to response and stored
            const { data } = await axios.post(
                backendUrl + "/api/auth/login",
                { email, password }
            );

            if (data.success) {
                // Store token for future requests
                localStorage.setItem('token', data.token);
                console.log("✅ Login successful, token stored");
                
                // Interceptor will now send Bearer token automatically
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const fetched = await getUserData();
                if (fetched) {
                    toast.success(data.message);
                    return data;
                }
                return null;
            } else {
                toast.error(data.message);
                return null;
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
            console.error("❌ Login error:", errorMsg, error);
            toast.error("Login failed: " + errorMsg);
            return null;
        }
    };

    const register = async (email, password) => {
        try {
            // Token will be added to response and stored
            const { data } = await axios.post(
                backendUrl + "/api/auth/register",
                { email, password }
            );

            if (data.success) {
                // Store token for future requests
                localStorage.setItem('token', data.token);
                console.log("✅ Register successful, token stored");
                
                // Interceptor will now send Bearer token automatically
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const fetched = await getUserData();
                if (fetched) {
                    toast.success(data.message);
                    return data;
                }
                return null;
            } else {
                toast.error(data.message);
                return null;
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
            console.error("❌ Register error:", errorMsg, error);
            toast.error("Registration failed: " + errorMsg);
            return null;
        }
    };

    const logout = async () => {
        try {
            // Token is automatically added by interceptor
            const { data } = await axios.post(backendUrl + "/api/auth/logout");
            if (data.success) {
                localStorage.removeItem('token');
                setIsLoggedin(false);
                setUserData(null);
                toast.success(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        // Try to restore session from stored token/cookie
        const token = localStorage.getItem('token');
        if (token) {
            console.log("🔄 Found stored token, fetching user data...");
            getUserData();
        } else {
            setLoading(false);
        }
    }, []);

    const value = {
        backendUrl,
        isLoggedin, setIsLoggedin,
        userData, setUserData,
        loading, setLoading,
        getUserData,
        login,
        register,
        logout
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
