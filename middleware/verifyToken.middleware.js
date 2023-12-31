// middleware/verifyToken.middleware.js

const jwt = require("jsonwebtoken");
const { User } = require("../sequelize/models/index.js");
const env = require("../config/env.config.js");

exports.isLoggedIn = async (req, res, next) => {
  const { Authorization } = req.cookies;
  const [authType, authToken] = (Authorization ?? "").split(" ");
  // const [authType, authToken] = Authorization ? Authorization.split(" ") : "";

  if (!authToken || authType !== "Bearer") {
    return res.status(401).send({
      success: false,
      message: "인증 헤더 형식이 올바르지 않습니다.",
    });
  }

  try {
    const { userId } = jwt.verify(authToken, env.JWT_SECRET);
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(401).send({
        success: false,
        message: "인증된 사용자를 찾을 수 없습니다.",
      });
    }
    res.locals.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      // JWT토큰이 만료될 경우 엑세스 토큰과 리프레시 토큰을 통해서 재발급 받아야되지만
      // 임시로 헤더에 있는 쿠키를 터트리는 것으로 유사구현
      res.clearCookie("Authorization");
      return res.status(401).send({
        success: false,
        message: "토큰이 만료되었습니다.",
      });
    } else {
      // console.error(err);
      return res.status(500).send({
        success: false,
        message: "서버 오류가 발생했습니다.",
      });
    }
  }
};

exports.isNotLoggedIn = async (req, res, next) => {
  const { Authorization } = req.cookies;

  const [authType, authToken] = (Authorization ?? "").split(" ");
  // const [authType, authToken] = Authorization ? Authorization.split(" ") : "";

  if (!authToken || authType !== "Bearer") {
    next();
    return;
  }
  try {
    jwt.verify(authToken, env.JWT_SECRET);

    res.status(401).send({
      success: false,
      message: "이미 로그인된 상태입니다",
    });
  } catch (error) {
    next();
  }
};
