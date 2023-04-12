import { NextFunction, Request, Response, Router } from 'express';
import supabase from '../../loaders/database';
import { registerSchema } from './registerSchema';
import { loginSchema } from './loginSchema';
import { updateSchema } from './updateSchema';
import yupValidate from '../../middleware/yupValidate';
import bcrypt from 'bcryptjs';
import validateRecaptcha from '../../middleware/validateCaptcha';
import Logger from '../../loaders/logger';

const restaurantRoute = Router();

restaurantRoute.use(validateRecaptcha);

restaurantRoute.post(
    '/register',
    yupValidate('body', registerSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, email, password, mobile, address, fssai, confirmpassword } = req.body;

            const { data: checkReg, error: checkRegError } = await supabase()
                .from('restaurants')
                .select('email')
                .eq('email', email);

            if (checkRegError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkRegError.message}` } 
            if (checkReg.length)
                throw { status: 208, message: "⛔️ Already registered" }

            const saltrounds = 10;
            const hashed_password = await bcrypt.hash(password, saltrounds);

            const { data: reg, error: regError } = await supabase()
                .from('restaurants')
                .upsert([
                    {
                        id: email,
                        name: name,
                        email: email,
                        pass: hashed_password,
                        contactno: mobile,
                        address: address,
                        fssai: fssai,
                        confirm_pass: hashed_password,
                    },
                ]);

            if (regError)
            {
                Logger.info(regError)
                throw { status: 500, message: `⛔️ SUPABASE : ${regError.message}` } }

            res.status(200).json({ success: true, message: "🥳 Registered Successfully" });
            next();
        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

restaurantRoute.get(
    '/login',
    yupValidate('body', loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;

            const { data: checkRest, error: checkRestError } = await supabase()
                .from('restaurants')
                .select('email')
                .eq('email', email);

            if (checkRestError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkRestError.message}` }

            if (checkRest.length) {
                const { data: pass, error: passError } = await supabase()
                    .from('restaurants')
                    .select('pass')
                    .eq('email', email);

                if (passError)
                    throw { status: 500, message: `⛔️ SUPABASE : ${passError.message}` }

                const validPass = await bcrypt.compare(password, pass[0].pass);

                if (!validPass)
                    throw { status: 401, message: "⛔️ Invalid password" }

                res.status(200).json({ success: true, message: "🥳 Logged in Successfully" });
                next();
            }
            else {
                res.status(404).json({ success: false, message: "📮 Email not found" });
                next();
            }

        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

restaurantRoute.put(
    '/update',
    yupValidate('body', updateSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, existingemail, email, mobile, address, fssai } = req.body;

            const { data: checkRest, error: checkRestError } = await supabase()
                .from('restaurants')
                .select('email')
                .eq('id', existingemail);

            if (checkRestError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkRestError.message}` }
            if (!checkRest.length)
                throw { status: 404, message: "📮 Email not found" }

            const { data: updateRest, error: updateRestError } = await supabase()
                .from('restaurants')
                .update({ 
                    id: email,
                    name: name,
                    email: email,
                    contactno: mobile,
                    address: address,
                    fssai: fssai,
                })
                .match({ id: existingemail });

            if (updateRestError)
                throw { status: 500, message: `⛔️ SUPABASE : ${updateRestError.message}` }

            res.status(200).json({ success: true, message: "🥳 Updated Successfully" });
            next();
        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

export default restaurantRoute;