import User from "../models/usermodel.js";
import { errorResponse, successResponse } from "../utils/responce.js";


const Register = async(req,res)=>{
      try {
        const {username,email,password} = req.body
        if(!username || !email || !password){
              return errorResponse(res,401,"missing Credentials")
        }
        const isexist = await User.findOne({email})
        if(isexist){
              return errorResponse(res,400,"user already exist with email")
        }
  
        const user = new User({
             username,
             email,
             password
        })
        
        await user.save()
        return successResponse(res,200,"user registered successfully",{username,email})

      } catch (error) {
        console.log(error)
        return errorResponse(res,500,"something went wrong on server side!!!",error)
      }
}


const Login = async(req,res)=>{
      try {
      
         const {email,password} = req.body 
         if(!email || !password){
              return errorResponse(res,401,"missing Credentials")
        }
        const user = await User.findOne({email})
        if(!user){
              return errorResponse(res,400,"user is not exist with this email")
        }
        const checkpass = await user.comparepassword(password)
        if(!checkpass){
            return errorResponse(res,400,"Password not matched")
        }

        const access_token = await user.GenerateAccessToken()
        const refresh_token = await user.GenerateRefreshToken()
        user.refreshToken = refresh_token
        await user.save()

            const isProd = process.env.NODE_ENV === "production";
        res.cookie("refreshToken", refresh_token, {
            httpOnly: true,
                  secure: isProd,
                  sameSite: isProd ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        successResponse(res,200,"Logged in !!",{access_token:access_token})
      } catch (error) {
              return errorResponse(res,500,"something went wrong!!",error)
      }
}


const 
Logout = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken;
        if (incomingRefreshToken) {
             const user = await User.findOne({ refreshToken: incomingRefreshToken });
             if (user) {
                 user.refreshToken = undefined;
                 await user.save();
             }
        }
        
        const isProd = process.env.NODE_ENV === "production";
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
        });
        
        return successResponse(res, 200, "Logged out successfully");
    } catch (error) {
        return errorResponse(res, 500, "Something went wrong during logout", error);
    }
}


export {
    Register,
    Login,
    Logout
}