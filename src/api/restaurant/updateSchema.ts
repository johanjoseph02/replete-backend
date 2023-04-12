import * as yup from 'yup';

export const updateSchema = yup.object({
    name: yup.string().nullable().test('notBlank', 'Name cannot be blank', value => value && value.trim().length > 0),
    existingemail: yup.string().email().required(),
    email: yup.string().email().nullable().test('notBlank', 'Email cannot be blank', value => value && value.trim().length > 0),
    mobile: yup.string().length(10).nullable().test('notBlank', 'Mobile cannot be blank', value => value && value.trim().length > 0),
    address: yup.string().nullable().test('notBlank', 'Address cannot be blank', value => value && value.trim().length > 0),
    fssai: yup.string().length(14).nullable().test('notBlank', 'FSSAI cannot be blank', value => value && value.trim().length > 0),
});