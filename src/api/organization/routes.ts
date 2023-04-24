import { NextFunction, Request, Response, Router } from 'express';
import supabase from '../../loaders/database';
import { registerSchema } from './registerSchema';
import { loginSchema } from './loginSchema';
import { updateSchema } from './updateSchema';
import { claimSchema } from './claimSchema';
import { claimedSchema } from './claimedSchema';
import yupValidate from '../../middleware/yupValidate';
import bcrypt from 'bcryptjs';
import validateRecaptcha from '../../middleware/validateCaptcha';

const organizationRoute = Router();

// organizationRoute.use(validateRecaptcha);

organizationRoute.post(
    '/profile',
    yupValidate('body', claimedSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email } = req.body;

            const { data: checkOrg, error: checkOrgError } = await supabase()
                .from('organizations')
                .select('*')
                .eq('id', email);

            if (checkOrgError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkOrgError.message}` }
            if (!checkOrg.length)
                throw { status: 404, message: "📮 Email not found" }

            res.status(200).json({ success: true, data: checkOrg });
            next();
        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

organizationRoute.post(
    '/register',
    yupValidate('body', registerSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, email, password, mobile, address, confirmpassword } = req.body;

            const { data: checkReg, error: checkRegError } = await supabase()
                .from('organizations')
                .select('email')
                .eq('id', email);

            if (checkRegError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkRegError.message}` } 
            if (checkReg.length)
                throw { status: 208, message: "⛔️ Already registered" }

            const saltrounds = 10;
            const hashed_password = await bcrypt.hash(password, saltrounds);

            const { data: reg, error: regError } = await supabase()
                .from('organizations')
                .insert([
                    {
                        id: email,
                        name: name,
                        email: email,
                        pass: hashed_password,
                        contactno: mobile,
                        address: address,
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

organizationRoute.post(
    '/login',
    yupValidate('body', loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;

            const { data: checkOrg, error: checkOrgError } = await supabase()
                .from('organizations')
                .select('email')
                .eq('email', email);

            if (checkOrgError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkOrgError.message}` }

            if (checkOrg.length) {
                const { data: pass, error: passError } = await supabase()
                    .from('organizations')
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

organizationRoute.delete(
    '/deregister',
    yupValidate('body', loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email, password } = req.body;

            const { data: checkOrg, error: checkOrgError } = await supabase()
                .from('organizations')
                .select('email')
                .eq('email', email);

            if (checkOrgError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkOrgError.message}` }

            if (checkOrg.length) {
                const { data: pass, error: passError } = await supabase()
                    .from('organizations')
                    .select('pass')
                    .eq('email', email);

                if (passError)
                    throw { status: 500, message: `⛔️ SUPABASE : ${passError.message}` }

                const validPass = await bcrypt.compare(password, pass[0].pass);

                if (!validPass)
                    throw { status: 401, message: "⛔️ Invalid password" }

                const { data: delOrg, error: delOrgError } = await supabase()
                    .from('organizations')
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

organizationRoute.put(
    '/update',
    yupValidate('body', updateSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { name, existingemail, email, mobile, address } = req.body;

            const { data: checkOrg, error: checkOrgError } = await supabase()
                .from('organizations')
                .select('email')
                .eq('id', existingemail);

            if (checkOrgError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkOrgError.message}` }
            if (!checkOrg.length)
                throw { status: 404, message: "📮 Email not found" }

            const { data: updateOrg, error: updateOrgError } = await supabase()
                .from('organizations')
                .update({ 
                    id: email,
                    name: name,
                    email: email,
                    contactno: mobile,
                    address: address,
                })
                .match({ id: existingemail });

            if (updateOrgError)
                throw { status: 500, message: `⛔️ SUPABASE : ${updateOrgError.message}` }

            const { data: updateList, error: updateListError } = await supabase()
            .from('listings')
            .update({
                organization_email: email
            })
            .match({ organization_email: existingemail });

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

organizationRoute.get(
    '/getmeals',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {

            const { data: getMeals, error: getMealsError } = await supabase()
                .from('listings')
                .select('*')
                .eq('expired', false)
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

organizationRoute.put(
    '/claimmeal',
    yupValidate('body', claimSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { unique_id, email } = req.body;

            const { data: checkOrg, error: checkOrgError } = await supabase()
                .from('organizations')
                .select('email')
                .eq('id', email);

            if (checkOrgError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkOrgError.message}` }
            if (!checkOrg.length)
                throw { status: 404, message: "📮 Email not found" }

            const { data: claimMeal, error: claimMealError } = await supabase()
                .from('listings')
                .update({
                    updated_at: new Date(Date.now()),
                    organization_email: email,
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

organizationRoute.post(
    '/claimed',
    yupValidate('body', claimedSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { email } = req.body;

            const { data: checkOrg, error: checkOrgError } = await supabase()
                .from('organizations')
                .select('email')
                .eq('id', email);

            if (checkOrgError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkOrgError.message}` }
            if (!checkOrg.length)
                throw { status: 404, message: "📮 Email not found" }

            const { data: getClaims, error: getClaimsError } = await supabase()
                .from('listings')
                .select('*')
                .eq('organization_email', email);

            if (getClaimsError)
                throw { status: 500, message: `⛔️ SUPABASE : ${getClaimsError.message}` }

            res.status(200).json({ success: true, data: getClaims });
            next();
        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

export default organizationRoute;