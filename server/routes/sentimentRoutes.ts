import express from 'express';
import axios from 'axios';

const router = express.Router();

// Fetch real-time sentiment analysis data
router.get('/sentiment-analysis', async (req, res) => {
    try {
        const response = await axios.get('API_ENDPOINT_HERE'); // Replace with actual API endpoint
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch sentiment analysis data' });
    }
});

// Fetch disaster risk assessment data
router.get('/disaster-risk-assessment', async (req, res) => {
    try {
        const response = await axios.get('ANOTHER_API_ENDPOINT_HERE'); // Replace with actual API endpoint
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch disaster risk assessment data' });
    }
});

export default router;
