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

    const login = async (email, password) => {
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
    
      try {
          const res = await axios.post(`${API_URL}/token`, form, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
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
    
      try {
        const res = await axios.get(`${API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return res.data;
      } catch (err) {
        throw err.response?.data || err;
      }
    }    

    const logout = () => {
      localStorage.removeItem("token");
      setUser(null);
      window.location.href = "/sign-in";
    }

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (token) {
        getProfile();
      }
    }, []);

    return (
      <AuthContext.Provider value={{ user, login, register, logout, getProfile }}>
        {children}
      </AuthContext.Provider>
    )
}
