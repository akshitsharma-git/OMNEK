import jwt from "jsonwebtoken"


const JWT_SECRET=process.env.SECRET_KEY || "omnek"


const authenticateJWT=(req,res,next)=>{
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        console.log("No Token")
        return next();
    }

    jwt.verify(token,JWT_SECRET,(err,user)=>{
        if(err){
            console.error("JWT verification failed:", err.message)
            if(err.name==="TokenExpiredError"){
                return res.status(401).json({message:"Session Expired. Please Log In Again."})
            }
            return res.status(403).json({message:"Invalid Token."})
        }
        
        req.user=user
        
        next()
    })
}



export default authenticateJWT