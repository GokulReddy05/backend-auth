const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const registerUserService = async (name, email, password) => {
    // 1. Check whether email already exists
    const result = await pool.query(
        "SELECT email FROM users WHERE email = $1",
        [email]
    );

    if (result.rows.length > 0) {
        throw new Error("Email already registered");
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save user
    const insertUser = await pool.query(
        `INSERT INTO users(name, email, password)
         VALUES($1, $2, $3)
         RETURNING id, name, email, created_at`,
        [name, email, hashedPassword]
    );

    return insertUser.rows[0];
};


const loginUserService = async (email, password) => {

    // 1. Find the user by email
    const result = await pool.query(
        `SELECT id, name, email, password,role
         FROM users
         WHERE email = $1`,
        [email]
    );

    // 2. User doesn't exist
    if (result.rows.length === 0) {
        throw new Error("Invalid Credentials");
    }

    const user = result.rows[0];

    // 3. Compare entered password with stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );


    // 4. Wrong password
    if (!isPasswordValid) {
        throw new Error("Invalid Credentials");
    }

    const accessToken = jwt.sign({
        id: user.id,
        role: user.role
    },process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

    const refreshToken = jwt.sign({
        id : user.id,
        role: user.role
    },process.env.JWT_REFRESH_SECRET, { expiresIn: '7d'
    });

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const insertRefreshToken = await pool.query("INSERT INTO refresh_token(user_id, token_hash, expires_at) VALUES($1, $2, NOW() + INTERVAL '7 days')", [user.id, tokenHash]);

    // 5. Login successful
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        accessToken: accessToken,
        refreshToken: refreshToken
    };
};


const refreshTokenService = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error("Refresh token is required");
    }

    // 1. Verify the refresh token
    const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
    );

    // 2. Hash the refresh token
    const tokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

    // 3. Get a dedicated database connection
    const client = await pool.connect();

    try {
        // 4. Start transaction
        await client.query("BEGIN");

        // 5. Find and lock the existing refresh token
        const result = await client.query(
            `SELECT * FROM refresh_token
             WHERE user_id = $1
             AND revoked_at IS NULL
             AND expires_at > NOW()
             AND token_hash = $2
             FOR UPDATE`,
            [decoded.id, tokenHash]
        );

        // 6. Check whether the refresh token exists
        if (result.rows.length === 0) {
            throw new Error("Invalid or expired refresh token");
        }

        // 7. Revoke the old refresh token
        await client.query(
            `UPDATE refresh_token
             SET revoked_at = NOW()
             WHERE id = $1`,
            [result.rows[0].id]
        );

        const newrefreshToken = jwt.sign({
            id: decoded.id
        }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        const newTokenHash = crypto.createHash('sha256').update(newrefreshToken).digest('hex');
        await client.query(
            `INSERT INTO refresh_token(user_id, token_hash, expires_at)
             VALUES($1, $2, NOW() + INTERVAL '7 days')`,
            [decoded.id, newTokenHash]
        );

        await client.query("COMMIT");

        const newAccessToken = jwt.sign({
            id: decoded.id
        }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

        return {
            accessToken: newAccessToken,
            refreshToken: newrefreshToken
        }

    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};


const logOutUserService = async(refreshToken)=>{
    if (!refreshToken) {
        throw new Error("Refresh token is required");
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const result = await pool.query("UPDATE refresh_token SET revoked_at = NOW() WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > NOW()", [decoded.id, tokenHash]);

    if (result.rowCount === 0) {
        throw new Error("Refresh token not found or already revoked");
    }

    return { message: "User logged out successfully" };

}


module.exports = {
    registerUserService,
    loginUserService,
    refreshTokenService,
    logOutUserService
};