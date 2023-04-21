import * as yup from 'yup';

export const claimedSchema = yup.object({
   email: yup.string().email().required(),
});