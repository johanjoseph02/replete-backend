import * as yup from 'yup';
import { NextFunction, Response, Request } from 'express';

type RequestLocation = 'query' | 'body' | 'params';

const yupValidate = ( location: RequestLocation, schema: yup.ObjectSchema<any, yup.AnyObject> ) => {

    return async (req: Request, res: Response, next: NextFunction) => {
        let _location: any;
        switch (location) 
        {
            case 'query':
                _location = req.query;
                break;
            case 'body':
                _location = req.body;
                break;
            case 'params':
                _location = req.params;
                break;
            default:
                _location = req.body;
                break;
        }

        try 
        {
            const validatedData = await schema.validate( _location, { stripUnknown: true, } );
            switch (location) 
            {
                case 'query':
                    req.query = validatedData as any;
                    break;
                case 'body':
                    req.body = validatedData;
                    break;
                case 'params':
                    req.params = validatedData as any;
                    break;
                default:
                    break;
            }

            next();
        } 
        catch (err) 
        {
            res.status(400).json({ success:false, error: err.errors.join(', ') });
        }
    };
}

export default yupValidate;