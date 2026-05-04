import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import reportRoutes from './routes/report.route.js';
import claimRoutes from './routes/claim.route.js';
import notificationRoutes from './routes/notification.route.js';

const app = express();

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
]);

// CORS middleware - must be before routes
const corsMiddleware = (req, res, next) => {
  const requestOrigin = req.get('origin');

  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
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

// Catch-all for 404
app.use((req, res) => {
  res.status(404).json({
    message: `No route found for ${req.method} ${req.path}`
  });
});

app.use((error, req, res, next) => {
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

