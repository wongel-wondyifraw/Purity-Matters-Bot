import { Context } from 'telegraf';
export interface BotContext extends Context {
    session?: Record<string, any>;
}
