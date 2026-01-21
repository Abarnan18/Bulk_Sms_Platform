import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = "https://bulk-sms-platform-backend.onrender.com";
    const [isLoggedin, setIsLoggedin] = useState(false);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // CRITICAL: Enable cookies in all requests (backend sends token in httpOnly cookie)
    axios.defaults.withCredentials = true;

    const getUserData = async () => {
        try {
            // Cookies are automatically sent with credentials: true
            const { data } = await axios.get(backendUrl + "/api/user/data");
            
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
            const { data } = await axios.post(backendUrl + "/api/auth/login", { email, password });
            if (data.success) {
                // Backend automatically sets httpOnly cookie - no need to store token in localStorage
                localStorage.setItem('token', data.token); // Keep for reference
                
                // Small delay to ensure cookie is set
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
            console.error("Login error:", error);
            toast.error(error.response?.data?.message || error.message);
            return null;
        }
    };

    const register = async (email, password) => {
        try {
            const { data } = await axios.post(backendUrl + "/api/auth/register", { email, password });
            if (data.success) {
                // Backend automatically sets httpOnly cookie - no need to store token in localStorage
                localStorage.setItem('token', data.token); // Keep for reference
                
                // Small delay to ensure cookie is set
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
            console.error("Register error:", error);
            toast.error(error.response?.data?.message || error.message);
            return null;
        }
    };

    const logout = async () => {
        try {
            const { data } = await axios.post(backendUrl + "/api/auth/logout");
            if (data.success) {
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['Authorization'];
                setIsLoggedin(false);
                setUserData(null);
                toast.success(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
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
