/**
 * cPanel / Phusion Passenger Entrypoint
 * This file boots the compiled NestJS application in dist/main.js.
 */
import('./dist/main.js').catch((err) => {
  console.error('FATAL ERROR DURING NESTJS APP BOOTSTRAP:', err);
  process.exit(1);
});
