import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getMatchById, getMyMatches, updateMatchStatus } from '../controllers/match.controller.js';

const router = Router();

router.get('/', requireAuth, getMyMatches);
router.get('/:matchId', requireAuth, getMatchById);
router.patch('/:matchId/status', requireAuth, updateMatchStatus);

export default router;