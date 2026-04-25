import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';

const app = express();

app.use(cookieParser());

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
	res.json({
		message: 'CampusTrace API is running',
	});
});

export default app;
