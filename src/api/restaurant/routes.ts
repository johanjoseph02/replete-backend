import { NextFunction, Request, Response, Router } from 'express';
import supabase from '../../loaders/database';
import { registerSchema } from './registerSchema';
import { loginSchema } from './loginSchema';
import { updateSchema } from './updateSchema';
import { listSchema } from './listSchema';
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
                .eq('id', email);

            if (checkRegError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkRegError.message}` } 
            if (checkReg.length)
                throw { status: 208, message: "⛔️ Already registered" }

            const saltrounds = 10;
            const hashed_password = await bcrypt.hash(password, saltrounds);

            const { data: reg, error: regError } = await supabase()
                .from('restaurants')
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

restaurantRoute.get(
    '/deregister',
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

                const { data: delRest, error: delRestError } = await supabase()
                    .from('restaurants')
                    .delete()
                    .eq('email', email);
                
                if (delRestError)
                    throw { status: 500, message: `⛔️ SUPABASE : ${delRestError.message}` }

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

            const { data: updateList, error: updateListError } = await supabase()
            .from('listings')
            .update({
                restaurant_email: email
            })
            .match({ restaurant_email: existingemail });

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

restaurantRoute.post(
    '/listmeals',
    yupValidate('body', listSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { restaurant_email, meals, dairy, allergens, veg, pickup } = req.body;

            Logger.info(restaurant_email)

            const { data: checkRest, error: checkRestError } = await supabase()
                .from('restaurants')
                .select('email')
                .eq('id', restaurant_email);

            if (checkRestError)
                throw { status: 500, message: `⛔️ SUPABASE : ${checkRestError.message}` }
            if (!checkRest.length)
                throw { status: 404, message: "📮 Email not found" }

            let addr = pickup;


            if (!addr) {
                const { data: address, error: addressError } = await supabase()
                    .from('restaurants')
                    .select('address')
                    .eq('id', restaurant_email);

                if (addressError)
                    throw { status: 500, message: `⛔️ SUPABASE : ${addressError.message}` }

                addr = address[0].address;
            }

            Logger.info(restaurant_email, meals, dairy, allergens, veg, pickup)



            const { data: listMeal, error: listMealError } = await supabase()
                .from('listings')
                .upsert([
                    {
                        meals: meals,
                        dairy: dairy,
                        allergens: allergens,
                        veg: veg,
                        pickup: addr,
                        restaurant_email: restaurant_email
                    },
                ]);

            if (listMealError)
                throw { status: 500, message: `⛔️ SUPABASE : ${listMealError.message}` }

            res.status(200).json({ success: true, message: "🥳 Listed Successfully" });
            next();
        }
        catch (err) {
            res.status(err.status || 500).json({ success: false, message: err.message });
        }
    }
);

export default restaurantRoute;