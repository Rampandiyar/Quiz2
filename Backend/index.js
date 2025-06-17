import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ✅ Simple test route
app.get('/', (req, res) => {
    res.send('Backend is running ✅');
});

// Error handler
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || "Something went wrong";
    return res.status(statusCode).json({
        success: [200, 201, 204].includes(statusCode),
        status: statusCode,
        message: message,
        data: err.data || null,
    });
});

const connectMongoose = async () => {
    try {
        await mongoose.connect(process.env.MONGO_CONNECT);
        console.log('MongoDB Connected...');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    connectMongoose();
    console.log(`Server running on port ${PORT}`);
});
