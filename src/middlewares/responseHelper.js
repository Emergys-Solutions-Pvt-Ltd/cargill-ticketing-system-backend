export const responseHelper = (req, res, next) => {
  res.sendResponse = (messageConfig, data = null) => {
    const responseBody = {
      success: messageConfig.statusFlag,
      message: messageConfig.messageText,
    };

    if (data !== null) {
      responseBody.data = data;
    }

    return res.status(messageConfig.statusCode).json(responseBody);
  };
  next();
};
