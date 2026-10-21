/**
 * cPanel / Phusion Passenger Entrypoint
 * This file boots the compiled NestJS application in dist/main.js.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Ensure the working directory is always the application root on cPanel / Phusion Passenger
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

// Explicitly preload environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

import('./dist/main.js').catch((err) => {
  console.error('FATAL ERROR DURING NESTJS APP BOOTSTRAP:', err);
  process.exit(1);
});
