const jwt = require("jsonwebtoken");
const axios = require("axios");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "No token provided",
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_ACCESS_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({
            status: "fail",
            message: "Token expired",
          });
        }
        return res.status(403).json({
          status: "fail",
          message: "Invalid token",
        });
      }

      // Validate token with user service
      try {
        const response = await axios.post(
          `${process.env.USER_SERVICE_URL}/api/v1/users/validate-token`,
          { token },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        req.user = response.data.user;
        next();
      } catch (error) {
        return res.status(401).json({
          status: "fail",
          message: "Invalid token",
        });
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
};
