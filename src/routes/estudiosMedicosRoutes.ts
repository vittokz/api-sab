import { Router} from 'express';
import { verifyToken } from "../middleware/validarToken";

import { estudiosMedicosController } from '../controllers/estudiosMedicosController'

class EstudiosMedicosRoutes {
    
    public router : Router = Router();
    
    constructor(){
        this.config();
    }

    config(): void{
        this.router.get('/', estudiosMedicosController.listEstudiosMedicos); 
    }
}

const estudiosMedicosRoutes = new EstudiosMedicosRoutes();
export default estudiosMedicosRoutes.router;
