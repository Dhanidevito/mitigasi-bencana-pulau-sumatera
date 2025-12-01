// Configuration for Sentinel Hub API
// This file provides a unified way to handle Sentinel Hub credentials and fallbacks

interface SentinelHubConfig {
  baseUrl: string;
  instanceId: string;
  clientId: string;
  clientSecret: string;
  isValid: boolean;
}

// Check if all required environment variables are present
const checkCredentials = (): SentinelHubConfig => {
  const baseUrl = process.env.SH_BASE_URL || '';
  const instanceId = process.env.SH_INSTANCE_ID || '';
  const clientId = process.env.SH_CLIENT_ID || '';
  const clientSecret = process.env.SH_CLIENT_SECRET || '';

  const isValid = !!baseUrl && !!instanceId && !!clientId && !!clientSecret;

  if (!isValid) {
    console.warn('⚠️  Sentinel Hub credentials are not fully configured.');
    console.warn('   Please set SH_BASE_URL, SH_INSTANCE_ID, SH_CLIENT_ID, and SH_CLIENT_SECRET in your environment.');
  }

  return {
    baseUrl,
    instanceId,
    clientId,
    clientSecret,
    isValid
  };
};

export const sentinelHubConfig = checkCredentials();