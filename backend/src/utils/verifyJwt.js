import jwt from "jsonwebtoken";


const verifyJwt = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export default verifyJwt;