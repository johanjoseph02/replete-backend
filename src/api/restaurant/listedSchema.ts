import * as yup from 'yup';

export const listedSchema = yup.object({
   email: yup.string().email().required(),
});