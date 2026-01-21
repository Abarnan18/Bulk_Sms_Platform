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

    // ✅ Add request/response interceptors for debugging
    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                console.log("📤 Request to:", config.url);
                return config;
            },
            (error) => Promise.reject(error)
        );

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    console.error("🔴 401 Unauthorized - Cookie not being sent");
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
            // ✅ Explicitly include withCredentials to ensure cookie is sent
            const { data } = await axios.get(backendUrl + "/api/user/data", { withCredentials: true });
            
            if (data.success) {
                setUserData(data.user);
                setIsLoggedin(true);
                return true;
            } else {
                setUserData(null);
                setIsLoggedin(false);
                return false;
            }
        } catch (error) {
            console.error("Error fetching user data:", error.response?.status, error.message);
            setUserData(null);
            setIsLoggedin(false);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            // ✅ Explicitly send cookies in login request
            const { data } = await axios.post(
                backendUrl + "/api/auth/login",
                { email, password },
                { withCredentials: true } // 🔹 added
            );

            if (data.success) {
                // Store token for reference/backup
                localStorage.setItem('token', data.token);
                console.log("✅ Login successful, token stored");
                
                // Wait for cookie to be set
                await new Promise(resolve => setTimeout(resolve, 200));
                
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
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || error.message);
            return null;
        }
    };

    const register = async (email, password) => {
        try {
            // ✅ Explicitly send cookies in register request
            const { data } = await axios.post(
                backendUrl + "/api/auth/register",
                { email, password },
                { withCredentials: true } // 🔹 added
            );

            if (data.success) {
                // Store token for reference/backup
                localStorage.setItem('token', data.token);
                console.log("✅ Register successful, token stored");
                
                // Wait for cookie to be set
                await new Promise(resolve => setTimeout(resolve, 200));
                
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
            console.error("Register error:", error);
            toast.error(error.response?.data?.message || error.message);
            return null;
        }
    };

    const logout = async () => {
        try {
            const { data } = await axios.post(backendUrl + "/api/auth/logout", {}, { withCredentials: true }); // 🔹 added
            if (data.success) {
                // Clear state
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
