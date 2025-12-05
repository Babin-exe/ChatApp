import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const Login = () => {
  const [formData, setData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    /*
Here i am only using /api/auth/login because the front end and backend are running at the same place
if not i must mention the full backend link 
    */
    try {
      const response = await axios.post(
        //I have to change this link later 
        `http://localhost:4000/api/auth/login`,
        { email: formData.email, password: formData.password },
        { withCredentials: true }
      );

      console.log(response);

      if (response.data.success) {
        //I have to change this also , just get rid of the prefix
        const verifyRes = await axios.get("http://localhost:4000/api/auth/me", {
          withCredentials: true,
        });
        if (verifyRes.data.success) {
          toast.success(response.data.message);
          navigate("/messages");
        } else {
          toast.error("Session verification failed. Please login again");
        }
      } else {
        console.log("failure oh no");
        toast.error(response.data.message);
      }
    } catch (error) {
      const message =
        error.response?.data?.message || "Something went wrong. Try again !";
      toast.error(message);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen  flex items-center justify-center bg-gradient-to-br from-pink-400 to-purple-500 overflow-hidden">
      <div className="bg-white shadow-lg rounded-xl sm:p-12 p-8 w-11/12 max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Login
        </h1>
        <form className=" flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            id="email"
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400"
            type="email"
            required
            placeholder="email"
          />
          <input
            id="password"
            onChange={handleChange}
            className="px-4 py-2 border border-gray-300 rounded-md focus: outline-none focus:outline-none focus:ring-2 focus:ring-pink-400"
            type="password"
            required
            minLength={8}
            placeholder="password"
          />
          <button
            type="submit"
            disabled={loading}
            className="text-white mt-4 px-4 py-2 bg-pink-500 p-3 rounded-lg font-semibold hover:bg-pink-600 transition"
          >
            {loading ? "Logging in..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
