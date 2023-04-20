import { NextFunction, Request, Response, Router } from 'express';
import supabase from '../../loaders/database';
import { registerSchema } from './registerSchema';
import { loginSchema } from './loginSchema';
import { updateSchema } from './updateSchema';
import { claimSchema } from './claimSchema';
import yupValidate from '../../middleware/yupValidate';
import bcrypt from 'bcryptjs';
import validateRecaptcha from '../../middleware/validateCaptcha';

const composterRoute = Router();

// composterRoute.use(validateRecaptcha);

composterRoute.post(
    '/register',
    yupValidate('body', registerSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {

            const { name, email, password, mobile, address, fssai, confirmpassword } = req.body;

            const { data: checkReg, error: checkRegError } = await supabase()
                .from('composters')
                .select('email')
                .eq('id', email);

            if (checkRegError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkRegError.message}` } 
            if (checkReg.length)
                throw { status: 208, message: "⛔️ Already registered" }


            const { data: checkFssai, error: checkFssaiError } = await supabase()
                .from('valid_fssai')
                .select('licence_key')
                .eq('licence_key', fssai);

            if (checkFssaiError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkFssaiError.message}` }
            if (!checkFssai.length)
                throw { status: 404, message: "📮 INVALID FSSAI LICENCE KEY" }


            const saltrounds = 10;
            const hashed_password = await bcrypt.hash(password, saltrounds);

            const { data: reg, error: regError } = await supabase()
                .from('composters')
                .insert([
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
                throw { status: 500, message: `⛔️ SUPABASE : ${regError.message}` } 

            res.status(200).json({ success: true, message: "🥳 Registered Successfully" });
            next();
        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

composterRoute.get(
    '/login',
    yupValidate('body', loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;

            const { data: checkComp, error: checkCompError } = await supabase()
                .from('composters')
                .select('fssai')
                .eq('email', email);

            if (checkCompError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkCompError.message}` }

            if (checkComp.length) {
                const { data: pass, error: passError } = await supabase()
                    .from('composters')
                    .select('pass')
                    .eq('email', email);

                if (passError)
                    throw { status: 500, message: `⛔️ SUPABASE : ${passError.message}` }

                const validPass = await bcrypt.compare(password, pass[0].pass);

                if (!validPass)
                    throw { status: 401, message: "⛔️ Invalid password" }

                const { data: checkFssai, error: checkFssaiError } = await supabase()
                    .from('valid_fssai')
                    .select('licence_key')
                    .eq('licence_key', checkComp[0].fssai);

                if (checkFssaiError)
                    throw { status: 500, message: `⛔️ SUPABASE : ${checkFssaiError.message}` }
                if (!checkFssai.length)
                    throw { status: 404, message: "📮 INVALID FSSAI LICENCE KEY, CONTACT ADMIN" }

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

composterRoute.delete(
    '/deregister',
    yupValidate('body', loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;

            const { data: checkComp, error: checkCompError } = await supabase()
                .from('composters')
                .select('email')
                .eq('email', email);

            if (checkCompError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkCompError.message}` }

            if (checkComp.length) {
                const { data: pass, error: passError } = await supabase()
                    .from('composters')
                    .select('pass')
                    .eq('email', email);

                if (passError)
                    throw { status: 500, message: `⛔️ SUPABASE : ${passError.message}` }

                const validPass = await bcrypt.compare(password, pass[0].pass);

                if (!validPass)
                    throw { status: 401, message: "⛔️ Invalid password" }

                const { data: delOrg, error: delOrgError } = await supabase()
                    .from('composters')
                    .delete()
                    .eq('email', email);
                
                if (delOrgError)
                    throw { status: 500, message: `⛔️ SUPABASE : ${delOrgError.message}` }

                res.status(200).json({ success: true, message: "Deregistered Successfully" });
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

composterRoute.put(
    '/update',
    yupValidate('body', updateSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, existingemail, email, mobile, address, fssai } = req.body;

            const { data: checkComp, error: checkCompError } = await supabase()
                .from('composters')
                .select('email')
                .eq('id', existingemail);

            if (checkCompError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkCompError.message}` }
            if (!checkComp.length)
                throw { status: 404, message: "📮 Email not found" }

            const { data: updateOrg, error: updateOrgError } = await supabase()
                .from('composters')
                .update({ 
                    id: email,
                    name: name,
                    email: email,
                    contactno: mobile,
                    address: address,
                    fssai: fssai,
                })
                .match({ id: existingemail });

            if (updateOrgError)
                throw { status: 500, message: `⛔️ SUPABASE : ${updateOrgError.message}` }

            const { data: updateList, error: updateListError } = await supabase()
            .from('listings')
            .update({
                composter_email: email
            })
            .match({ composter_email: existingemail });

            if (updateListError)
                throw { status: 500, message: `⛔️ SUPABASE : ${updateListError.message}` }

            res.status(200).json({ success: true, message: "🥳 Updated Successfully" });
            next();
        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

composterRoute.get(
    '/getmeals',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {

            const { data: getMeals, error: getMealsError } = await supabase()
                .from('listings')
                .select('*')
                .eq('expired', true)
                .eq('claimed', false);

            if (getMealsError)
                throw { status: 500, message: `⛔️ SUPABASE : ${getMealsError.message}` }

            res.status(200).json({ success: true, data: getMeals });
            next();
        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

composterRoute.put(
    '/claimmeal',
    yupValidate('body', claimSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { unique_id, email } = req.body;

            const { data: checkComp, error: checkCompError } = await supabase()
                .from('composters')
                .select('email')
                .eq('id', email);

            if (checkCompError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkCompError.message}` }
            if (!checkComp.length)
                throw { status: 404, message: "📮 Email not found" }

            const { data: claimMeal, error: claimMealError } = await supabase()
                .from('listings')
                .update({
                    composter_email: email,
                    claimed: true,
                })
                .match({ id: unique_id });

            if (claimMealError)
                throw { status: 500, message: `⛔️ SUPABASE : ${claimMealError.message}` }

            res.status(200).json({ success: true, message: "🥳 Claimed Successfully" });
            next();
        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

export default composterRoute;