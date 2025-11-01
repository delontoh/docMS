import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

async function start() {
    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    //API Routes
    const documentsRoutes = (await import('@routes/documents/documents.routes')).default;
    const foldersRoutes = (await import('@routes/folders/folders.routes')).default;

    app.use('/api/documents', documentsRoutes);
    app.use('/api/folders', foldersRoutes);

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    app.listen(port, () => {
        console.log('\nO===> Start Environment On: ' + app.get('env') + '\n');
        console.log(`Listening On Port: ${port} <===0\n`);
    });
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});
