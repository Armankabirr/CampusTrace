import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import reportRoutes from './routes/report.route.js';
import claimRoutes from './routes/claim.route.js';
import notificationRoutes from './routes/notification.route.js';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(cookieParser());

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/notifications', notificationRoutes);

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

