import app from './src/app.js';
import connectDb from './src/config/database.js';

try {
	await connectDb();

	app.listen(3000, () => {
		console.log('Server is running on port 3000');
	});
} catch (error) {
	console.error('Unable to start server:', error.message);
	process.exit(1);
}
