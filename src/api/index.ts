import { Router } from 'express';
import restaurantRoute from './restaurant/routes';
import organizationRoute from './organization/routes';
import composterRoute from './composter/routes';

export default (): Router => {
    const app = Router(); 
    app.use('/restaurant', restaurantRoute);
    app.use('/organization', organizationRoute);
    app.use('/composter', composterRoute);

    return app;
};