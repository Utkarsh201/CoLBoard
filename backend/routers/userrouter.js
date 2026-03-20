import  express  from "express";
import { Register,Login } from "../controller/authcontroler.js";


const userRoutes = express.Router()
userRoutes.post('/register',Register)
userRoutes.post('/login',Login)


export {userRoutes}