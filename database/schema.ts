// database/schema.ts

// This schema is designed for storing sentiment data, disaster alerts, and historical predictions.

import { Schema, model } from 'mongoose';

// Sentiment Data Schema
const sentimentSchema = new Schema({
    sentiment: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Disaster Alerts Schema
const disasterAlertSchema = new Schema({
    alertType: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        required: true,
    },
    issuedAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});

// Historical Predictions Schema
const historicalPredictionSchema = new Schema({
    predictionDate: {
        type: Date,
        required: true,
    },
    predictedOutcome: {
        type: String,
        required: true,
    },
    confidenceLevel: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
});

// Export Models
export const Sentiment = model('Sentiment', sentimentSchema);
export const DisasterAlert = model('DisasterAlert', disasterAlertSchema);
export const HistoricalPrediction = model('HistoricalPrediction', historicalPredictionSchema);
