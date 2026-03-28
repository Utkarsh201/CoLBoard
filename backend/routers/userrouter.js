import  express  from "express";
import { Register, Login, Logout } from "../controller/authcontroler.js";
import { verify } from "../middlewares/authmiddleware.js";


const userRoutes = express.Router()
userRoutes.post('/register',Register)
userRoutes.post('/login',Login)
userRoutes.post('/logout', verify, Logout)


export {userRoutes}