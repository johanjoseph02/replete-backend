import * as yup from 'yup';

export const claimSchema = yup.object({
   unique_id: yup.string().length(15).required(),
   email: yup.string().email().required(),
});