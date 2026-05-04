import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import reportRoutes from './routes/report.route.js';
import claimRoutes from './routes/claim.route.js';
import notificationRoutes from './routes/notification.route.js';

const app = express();

console.log('[APP.JS] Initializing app with CORS middleware');

// CORS middleware - must be before routes
const corsMiddleware = (req, res, next) => {
  console.log(`[CORS REQUEST] ${req.method} ${req.path} from ${req.get('origin')}`);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  console.log(`[CORS HEADERS] Set CORS headers for ${req.method} ${req.path}`);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log(`[CORS] Sending 200 OK for OPTIONS request`);
    return res.send();
  }
  
  next();
};

app.use(corsMiddleware);

app.use(cookieParser());

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);

// Catch-all for debugging
app.use((req, res) => {
  console.log(`[CATCH-ALL] ${req.method} ${req.path} - No matching route`);
  res.status(404).json({
    message: `No route found for ${req.method} ${req.path}`,
    path: req.path,
    method: req.method
  });
});

app.use((error, req, res, next) => {
	console.log(`[ERROR HANDLER] Error:`, error.message);
	if (error?.code === 'LIMIT_FILE_SIZE') {
		return res.status(413).json({ message: 'Uploaded file is too large.' });
	}

	return res.status(error?.status || 500).json({
		message: error?.message || 'Internal server error',
	});
});

app.get('/', (req, res) => {
	res.json({
		message: 'CampusTrace API is running',
	});
});

export default app;

