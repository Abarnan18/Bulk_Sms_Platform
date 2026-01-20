import { createContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = "https://bulk-sms-platform-backend.onrender.com";
    const [isLoggedin, setIsLoggedin] = useState(false);
    const [userData, setUserData] = useState(null);

    const token = localStorage.getItem('token');
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const getUserData = async () => {
        try {
            const { data } = await axios.get(backendUrl + "/api/user/data");
            if (data.success) {
                setUserData(data.user);
                setIsLoggedin(true);
            } else {
                setUserData(null);
                setIsLoggedin(false);
            }
        } catch (error) {
            setUserData(null);
            setIsLoggedin(false);
        }
    };

    const login = async (email, password) => {
        try {
            const { data } = await axios.post(backendUrl + "/api/auth/login", { email, password });
            if (data.success) {
                setIsLoggedin(true);
                await getUserData();
                toast.success(data.message);
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            return false;
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
        getUserData();
    }, []);

    const value = {
        backendUrl,
        isLoggedin, setIsLoggedin,
        userData, setUserData,
        getUserData,
        login,
        logout
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
