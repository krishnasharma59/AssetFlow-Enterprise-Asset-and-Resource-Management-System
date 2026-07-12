require('dotenv').config();
const app = require('./app');
const connectDatabase = require('./config/database');

const port = Number(process.env.PORT) || 5000;
connectDatabase()
  .then(() => app.listen(port, () => console.log(`AssetFlow API listening on port ${port}`)))
  .catch((error) => { console.error(error.message); process.exit(1); });
