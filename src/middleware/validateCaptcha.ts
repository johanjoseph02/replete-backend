import axios from 'axios';
import config from '../config';
import Logger from '../loaders/logger';

const verifyRecaptchaUrl = async (token) => {
    const verificationUrl =
      'https://www.google.com/recaptcha/api/siteverify?secret=' +
      config.recaptchaSecretKey +
      '&response=' +
      token;
    return await axios.post(verificationUrl);
  };

const validateRecaptcha = async (req, res, next) => {
    try 
    {
        if (!req.body.token) 
            throw { status: 404, message: "❗️ Captcha token not found" }
        Logger.info(req.body.token);
        const token = req.body.token;

        const response = await verifyRecaptchaUrl(token);

        Logger.info(response.data.success);
        Logger.info(response.data.score);
        Logger.info(response.data);

        if (response.data.success && response.data.score >= 0.5) 
        {
            next();
        } 
        else 
            throw { status: 401, message: "🚫 Captcha validation failed" }
    } 
    catch (err) 
    { 
        res.status(err.status || 500).json({ success:false, message:err.message });
    }
};

export default validateRecaptcha;
