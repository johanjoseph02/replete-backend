import * as yup from 'yup';

export const registerSchema = yup.object({
    name: yup.string().required(),
    email: yup.string().email().required(),
    password: yup.string().min(8).required(),
    mobile: yup.string().length(10).required(),
    address: yup.string().required(),
    fssai: yup.string().length(14).required(),
    confirmpassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required(),
});