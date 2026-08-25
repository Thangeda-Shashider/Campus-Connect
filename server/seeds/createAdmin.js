import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: String,
    department: String,
    year: Number,
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const hashedPassword = await bcrypt.hash('Admin@1234', 10);

        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@campusconnect.app',
            password: hashedPassword,
            role: 'admin',
            department: 'Admin',
        });

        console.log('🎉 Admin user created successfully!');
        console.log('────────────────────────────────');
        console.log('📧 Email   : admin@campusconnect.app');
        console.log('🔑 Password: Admin@1234');
        console.log('────────────────────────────────');
        console.log('⚠️  Please change the password after first login!');
    } catch (err) {
        if (err.code === 11000) {
            console.log('⚠️  Admin user already exists!');
        } else {
            console.error('❌ Error:', err.message);
        }
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createAdmin();
