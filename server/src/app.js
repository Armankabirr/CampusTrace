import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cookieParser());

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.json({
		message: 'CampusTrace API is running',
	});
});

export default app;
