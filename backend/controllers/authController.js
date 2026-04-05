const User = require('../models/User');
const bcrypt = require('bcrypt');  // Fixed spelling
const jwt = require('jsonwebtoken');

const RegisterUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please fill all the fields' });
        }
        
       
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        
        const hashPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashPassword
        });
        
        
        user.password = undefined;
        
        res.status(201).json({ 
            message: 'User created successfully', 
            user 
        });
    } catch (error) {
        console.log("Error during Registration: ", error);
        res.status(500).json({ message: 'Internal Server error' });
    }
}

const LoginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Please fill all the fields' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' }); // 401 for auth errors
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        
        const token = jwt.sign(
            { id: user._id, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
       
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        
        user.password = undefined;
        
        res.status(200).json({ 
            message: 'User logged in successfully', 
            user 
        });
    } catch (error) {
        console.log("Error during login: ", error);
        res.status(500).json({ message: 'Internal Server error' });
    }
}

const logOut = async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        console.log("Error during logout: ", error);
        res.status(500).json({ message: 'Error during logout' });
    }
}

module.exports = { RegisterUser, LoginUser, logOut };