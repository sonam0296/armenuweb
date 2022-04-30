const http = require('http');
const app = require('./app.js');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();

const PORT = process.env.PORT;
const server = http.createServer(app);

// running server.
server.listen(PORT, () => {
	connectDB();
	console.log(`server started on the port ${PORT}`);
});
