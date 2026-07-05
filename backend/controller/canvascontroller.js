import mongoose from "mongoose";
import { Canvas} from "../models/canvasmodel.js"
import { errorResponse, successResponse } from "../utils/responce.js";
import { sanitizeElements } from "../sockets/roomState.js";

const getallcanvas = async(req,res)=>{
      try {
         const userId = req.userId
         const allcanvas = await Canvas.find({owner:userId}).sort({createdAt:-1});
         return successResponse(res,200,"cancas loaded successfully",allcanvas)
      } catch (error) {
        return errorResponse(res,500,"something went wrong")
      }
}  // api call to access and list all the canvases

const getcanvas = async(req,res)=>{
       try {
        const userid = req.userId 
        const canvasId = req.params.id 
        if (!mongoose.Types.ObjectId.isValid(canvasId)) {
            return errorResponse(res, 400, "Invalid canvas ID");
        }
 
        const canvas = await Canvas.findById(canvasId);
        if(!canvas){
             return errorResponse(res,404,"canvas not find")   
        }
 
        if(canvas.owner.toString()!==userid){
            return errorResponse(res,403,"access denied")
        }
        return successResponse(res,200,"canvas fetched successfully",canvas)
       } catch (error) {
           return errorResponse(res,500,"something went wrong")
       }
}



const CreateCanvas = async(req,res)=>{
         try {
             const userid = req.userId
             const newcanvas = new Canvas({
                   owner:userid,
                   elements:[]
             });
             await newcanvas.save();
             return successResponse(res,200,"canvas created",{canvasId:newcanvas._id})
         } catch (error) {
            return errorResponse(res,500,"something went wrong!!")
         }
}
const UpdateCanvas = async(req,res)=>{
        try {
            const  {canvasId,elements} = req.body 
            const userId = req.userId 
            if (!mongoose.Types.ObjectId.isValid(canvasId)) {
                return errorResponse(res, 400, "Invalid canvas ID");
            }
            const safeElements = sanitizeElements(elements);
            const canvas = await Canvas.findById(canvasId)
            if(!canvas){
                return errorResponse(res,404,"canvas not found")
            }
    
            if(canvas.owner.toString()!==userId){
                return errorResponse(res,403,"not autherized person to get canvas")
            }
            canvas.elements = safeElements
            await canvas.save()
            return successResponse(res,200,"canvas updated successfully")
        } catch (error) {
             return errorResponse(res,500,"something went wrong") 
        }
}
const DeleteCanvas = async(req,res)=>{
         try {
            const  canvasId = req.params.id 
            const userId = req.userId 
            if (!mongoose.Types.ObjectId.isValid(canvasId)) {
                return errorResponse(res, 400, "Invalid canvas ID");
            }
            const canvas = await Canvas.findById(canvasId)
            if(!canvas){
                   return errorResponse(res,404,"canvas not found")
            }
    
            if(canvas.owner.toString()!==userId ){
                  return errorResponse(res,403,"not autherized person to delete canvas")
            }
            await Canvas.findByIdAndDelete(canvasId);
              return successResponse(res,200,"canvas delete successfully")
        } catch (error) {
             return errorResponse(res,500,"something went wrong") 
        }

}
export{  
    getallcanvas,
    getcanvas,
    CreateCanvas,
    UpdateCanvas,
    DeleteCanvas
}