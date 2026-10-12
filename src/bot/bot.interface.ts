import { Context } from 'telegraf';

export interface BotContext extends Context {
  // Can be extended with scene / session data if needed
  session?: Record<string, any>;
}
