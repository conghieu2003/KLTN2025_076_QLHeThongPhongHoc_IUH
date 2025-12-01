require('dotenv').config();

const config = {
    // Database Configuration
    database: {
        host: process.env.DB_HOST || '',
        port: process.env.DB_PORT || '',
        name: process.env.DB_NAME || '',
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || '',
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
        poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT) || 0,
        url: process.env.DATABASE_URL
    },

    // Application Configuration
    app: {
        port: process.env.PORT || 3001,
        nodeEnv: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    // Email Configuration
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER || 'your_email@gmail.com',
        pass: process.env.SMTP_PASS || 'your_app_password'
    },

    // Build database URL if not provided
    getDatabaseUrl() {
        if (this.database.url) {
            return this.database.url;
        }

        return `sqlserver://${this.database.host}:${this.database.port};database=${this.database.name};user=${this.database.user};password=${this.database.password};encrypt=${this.database.encrypt};trustServerCertificate=${this.database.trustServerCertificate};connection_limit=${this.database.connectionLimit};pool_timeout=${this.database.poolTimeout};charset=utf8`;
    }
};

module.exports = config;
