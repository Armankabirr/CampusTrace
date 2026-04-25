import app from './src/app.js';
import connectDb from './src/config/database.js';
import config from './src/config/config.js';

try {
	await connectDb();

	app.listen(config.port, () => {
		console.log(`Server is running on port ${config.port}`);
	});
} catch (error) {
	console.error('Unable to start server:', error.message);
	process.exit(1);
}
