import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1500'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
  },
  google: {
    serviceAccountPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH || '',
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
    spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '1Oztd28N_ejKwNmrJ2d76SiGSuyjC2iTalgdeghvazIc'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/json']
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};