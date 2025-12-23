const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Mongoose 6+ no longer needs these options
            // useNewUrlParser, useUnifiedTopology are default
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);

        // Retry connection after 5 seconds in production
        if (process.env.NODE_ENV === 'production') {
            console.log('🔄 Retrying connection in 5 seconds...');
            setTimeout(connectDB, 5000);
        } else {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
