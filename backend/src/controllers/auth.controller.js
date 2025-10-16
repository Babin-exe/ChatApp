import jwt from "jsonwebtoken";
import bycrypt from "bcrypt";

export const signup = async (req, res) => {
  res.send("SignUp");
};
export const login = async (req, res) => {
  res.send("Login");
};
export const logout = async (req, res) => {
  res.send("Logout");
};
