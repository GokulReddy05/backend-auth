
const pool = require("../config/db");

const getAllUsers = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, created_at
             FROM users
             ORDER BY id`
        );

        return res.status(200).json({
            message: "Users fetched successfully",
            users: result.rows
        });

    } catch (error) {
        next(error);
    }
};

module.exports = { getAllUsers };