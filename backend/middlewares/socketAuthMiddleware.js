import jwt from 'jsonwebtoken';

export const socketAuthMiddleware = (socket, next) => {
  try {
    const tokenHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization || "";
    // .handshake is a method that is present socket 
    const token = tokenHeader.replace(/^Bearer\s+/i, "").trim();
    // it also sends the Bearer so we need to remove the Bearer and the space after it

    if (!token) {
      return next(new Error("Authentication error: Token is missing"));
    }
    
    const decoded = jwt.verify(token, process.env.ACCESSTOKENSECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid or expired token"));
  }
};
