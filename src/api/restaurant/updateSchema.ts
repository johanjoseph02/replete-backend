import * as yup from 'yup';

export const updateSchema = yup.object({
    name: yup.string(),
    email: yup.string().email(),
    mobile: yup.string().length(10),
    address: yup.string(),
    fssai: yup.string().length(14),
});