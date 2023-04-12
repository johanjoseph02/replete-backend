import { Router } from 'express';
import restaurantRoute from './restaurant/routes';

export default (): Router => {
    const app = Router(); 
    app.use('/restaurant', restaurantRoute);

    return app;
};