import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  from: text('from').notNull(),
  text: text('text').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
}); 