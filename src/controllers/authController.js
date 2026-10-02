const {registerUserService,loginUserService,refreshTokenService,logOutUserService}  = require("../services/authService");

const registerUser = async(req,res,next)=>{
    const {name, email, password} = req.body
    try {
        const user = await registerUserService(name,email,password)

        res.status(200).json(user)
        
    } catch (error) {
        next(error)
    };
};

const loginUser = async(req,res,next)=>{
    const {email, password} = req.body;
    try {
        const user = await loginUserService(email,password)
            res.cookie("refreshToken", user.refreshToken,{
            httpOnly: true,
            secure: false,
            sameSite : "strict",
            maxAge : 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                accessToken: user.accessToken
            }
        });
        
    } catch (error) {
        next(error)
    };
};


const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({
                message: "Refresh token missing"
            });
        }

        const result = await refreshTokenService(token);

        // Replace old refresh-token cookie with new one
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Send only access token in JSON
        return res.status(200).json({
            accessToken: result.accessToken
        });

    } catch (error) {
        next(error);
    }
};


const getProfile = async (req, res) => {
    res.status(200).json({
        message: "Profile accessed successfully",
        user: req.user
    });
};



const logOutUser = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token missing"
            });
        }

        await logOutUserService(refreshToken);

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: false,
            sameSite: "strict"
        });

        return res.status(200).json({
            message: "Logged out successfully"
        });

    } catch (error) {
        next(error);
    }
};



module.exports = {registerUser, loginUser,getProfile, refreshToken,logOutUser};