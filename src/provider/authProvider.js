"use client";

import { API_URL } from "@/utils/constants";
import axios from "axios";
import { createContext, useContext, useState, useEffect } from "react";
const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    const login = async (email, password) => {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
    
      try {
          const res = await axios.post(`${API_URL}/token`, form, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        setToken(res.data);
        return res.data;
      } catch (err) {
        throw err.response?.data || err;
      }
    }

    const register = async (userData) => {
      try {
        const res = await axios.post(`${API_URL}/register`, userData);
        return res.data;
      } catch (err) {
        throw err.response?.data || err;
      }
    }

    async function getProfile() {
      const token = localStorage.getItem("token");
      if (!token) {
        return window.location.href = "/sign-in";
      }
      try {
        const res = await axios.get(`${API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("[USER]: ", res.data);
        setUser(res.data);
      } catch (err) {
        console.log("ERROR: ", err)
        localStorage.removeItem("token");
        setUser(null);
        setToken(null);
        window.location.href = "/sign-in";
        throw err.response?.data || err;
      }
    }    

    const logout = () => {
      localStorage.removeItem("token");
      setUser(null);
      setToken(null);
      window.location.href = "/sign-in";
    }

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (token) {
        getProfile();
      }
    }, []);

    return (
      <AuthContext.Provider value={{ user, login, register, logout, getProfile, setUser, setUser, setToken }}>
        {children}
      </AuthContext.Provider>
    )
}
