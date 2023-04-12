import * as yup from 'yup';

export const listSchema = yup.object({
    restaurant_email: yup.string().email().required(),
    expirationdate: yup.date().required(),
    meals: yup.number().moreThan(10).required(),
    dairy: yup.boolean().required(),
    allergens: yup.string(),
    veg: yup.boolean().required(),
    pickup: yup.string(),
});