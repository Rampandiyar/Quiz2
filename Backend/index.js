import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './Routes/authRoutes.js';
import userRoutes from './Routes/userRoutes.js';
import quizRoutes from './Routes/quizRoutes.js';
import resultRoutes from './Routes/resultRoutes.js';
import adminRoutes from './Routes/adminRoutes.js';
import categoryRoutes from './Routes/categoryRoutes.js';
import notificationRoutes from './Routes/notificationRoutes.js';
dotenv.config();
const router = express.Router();
const app = express();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/quizzes', quizRoutes);
router.use('/results', resultRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', categoryRoutes);
router.use('/notifications', notificationRoutes);

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
