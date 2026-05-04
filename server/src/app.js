import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import reportRoutes from './routes/report.route.js';
import claimRoutes from './routes/claim.route.js';
import notificationRoutes from './routes/notification.route.js';

const app = express();

// CORS middleware - must be before routes
const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
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

