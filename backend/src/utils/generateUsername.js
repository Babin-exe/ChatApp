import User from "../models/user.model.js";
const generateUserName = async (name = "user") => {
  const base = (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "") || "user"
  ).slice(0, 12);

  const letters = "abcdefghijklmnopqrstuvwxyz";
  const symbols = "._";

  while (true) {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const randomNumber = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");

    const username =
      Math.random() < 0.5
        ? `${base}${randomSymbol}${randomLetter}${randomNumber}`
        : `${base}${randomSymbol}${randomNumber}${randomLetter}`;

    const exists = await User.exists({ username });
    if (!exists) return username;
  }
};

export default generateUserName;
