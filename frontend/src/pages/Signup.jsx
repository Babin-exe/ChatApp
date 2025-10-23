import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useStore } from "../context/StoreContext.jsx";

const Signup = () => {
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { url } = useStore();

  const handleChange = (e) => {
    const item = e.target.id;
    const value = e.target.value;
    setData((prev) => ({ ...prev, [item]: value }));
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // const response = await axios.post(`${url}/api/auth/signup`, {
      //using relative path because the backend is serving the frontend also
      const response = await axios.post(`/api/auth/signup`, {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success("Verification email sent! Please check your inbox.");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-600 overflow-hidden">
      <div className="bg-white shadow-lg rounded-xl p-8 sm:p-12 w-11/12 max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Sign Up
        </h1>
        <form onSubmit={handleSignin} className="flex flex-col gap-4 ">
          <input
            id="name"
            onChange={handleChange}
            type="text"
            placeholder="Full Name"
            required
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <input
            id="email"
            onChange={handleChange}
            type="email"
            placeholder="Email"
            required
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <input
            id="password"
            onChange={handleChange}
            type="password"
            placeholder="Password"
            required
            minLength={8}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            disabled={loading}
            type="submit"
            className="mt-4 px-4 py-2 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition˝"
          >
            Sign Up
          </button>
        </form>
        <p className="text-sm text-gray-600 text-center mt-4">
          Already have an account?
          <span className="text-pink-500 font-semibold cursor-pointer hover:underline">
            <Link to="/login">Login</Link>
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
