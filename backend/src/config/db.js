import mongoose from "mongoose";

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(` Database connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(` Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDb;
