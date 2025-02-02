// import { Router } from 'express';
// import { TokenController } from '../controllers/tokenController';
// import { auth } from '../middleware/auth';

// const router = Router();

// // Public routes
// router.get('/list', TokenController.getTokens);
// router.get('/search', TokenController.searchTokens);
// router.get('/details/:symbol', TokenController.getTokenDetails);

// // Authentication required
// router.get('/favorites', auth, TokenController.getFavorites);
// router.post('/favorite/:symbol', auth, TokenController.toggleFavorite);

// // Premium subscription required
// router.get('/signals', auth, TokenController.getSignals);

// export default router;