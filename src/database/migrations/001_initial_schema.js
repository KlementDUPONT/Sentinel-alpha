/**
 * Migration initiale - Création de toutes les tables
 */

export const up = (db) => {
  // Table: guilds
  db.exec(`
    CREATE TABLE IF NOT EXISTS guilds (
      guild_id TEXT PRIMARY KEY,
      prefix TEXT DEFAULT '+',
      language TEXT DEFAULT 'fr',
      
      -- Moderation
      mod_log_channel TEXT,
      mod_role TEXT,
      auto_mod_enabled INTEGER DEFAULT 0,
      auto_mod_spam INTEGER DEFAULT 0,
      auto_mod_links INTEGER DEFAULT 0,
      auto_mod_invites INTEGER DEFAULT 0,
      auto_mod_caps INTEGER DEFAULT 0,
      
      -- Welcome/Goodbye
      welcome_enabled INTEGER DEFAULT 0,
      welcome_channel TEXT,
      welcome_message TEXT DEFAULT 'Bienvenue {user} sur {server} !',
      goodbye_enabled INTEGER DEFAULT 0,
      goodbye_channel TEXT,
      goodbye_message TEXT DEFAULT 'Au revoir {user} 👋',
      
      -- Levels
      levels_enabled INTEGER DEFAULT 1,
      level_up_channel TEXT,
      level_up_message TEXT DEFAULT 'GG {user} ! Tu es maintenant niveau {level} !',
      xp_rate INTEGER DEFAULT 1,
      no_xp_roles TEXT,
      no_xp_channels TEXT,
      
      -- Economy
      economy_enabled INTEGER DEFAULT 1,
      currency_name TEXT DEFAULT 'credits',
      currency_symbol TEXT DEFAULT '💰',
      daily_amount INTEGER DEFAULT 100,
      work_min INTEGER DEFAULT 50,
      work_max INTEGER DEFAULT 150,
      
      -- Tickets
      ticket_category TEXT,
      ticket_log_channel TEXT,
      ticket_support_role TEXT,
      ticket_enabled INTEGER DEFAULT 1,
      
      -- Logs
      log_channel TEXT,
      log_joins INTEGER DEFAULT 0,
      log_leaves INTEGER DEFAULT 0,
      log_messages INTEGER DEFAULT 0,
      log_roles INTEGER DEFAULT 0,
      log_channels INTEGER DEFAULT 0,
      log_server INTEGER DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table: users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      
      -- Economy
      balance INTEGER DEFAULT 0,
      bank INTEGER DEFAULT 0,
      last_daily DATETIME,
      last_work DATETIME,
      total_earned INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      
      -- Levels
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 0,
      messages_count INTEGER DEFAULT 0,
      last_xp_gain DATETIME,
      
      -- Stats
      commands_used INTEGER DEFAULT 0,
      voice_time INTEGER DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(user_id, guild_id),
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
    )
  `);

  // Table: warns
  db.exec(`
    CREATE TABLE IF NOT EXISTS warns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warn_id TEXT UNIQUE NOT NULL,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
    )
  `);

  // Table: mod_logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS mod_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      case_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_tag TEXT,
      moderator_id TEXT NOT NULL,
      moderator_tag TEXT,
      reason TEXT,
      duration INTEGER,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE,
      UNIQUE(guild_id, case_id)
    )
  `);

  // Table: tickets
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT UNIQUE NOT NULL,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      category TEXT DEFAULT 'support',
      subject TEXT,
      status TEXT DEFAULT 'open',
      claimed_by TEXT,
      closed_by TEXT,
      closed_reason TEXT,
      closed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
    )
  `);

  // Table: ticket_messages
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
    )
  `);

  // Table: giveaways
  db.exec(`
    CREATE TABLE IF NOT EXISTS giveaways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE NOT NULL,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      host_id TEXT NOT NULL,
      prize TEXT NOT NULL,
      description TEXT,
      winners_count INTEGER DEFAULT 1,
      required_role TEXT,
      ends_at DATETIME NOT NULL,
      ended INTEGER DEFAULT 0,
      winners TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
    )
  `);

  // Table: shop_items
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      item_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      role_id TEXT,
      stock INTEGER DEFAULT -1,
      buyable INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
    )
  `);

  // Table: inventory
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES shop_items(item_id) ON DELETE CASCADE,
      UNIQUE(user_id, guild_id, item_id)
    )
  `);

  // Table: level_roles
  db.exec(`
    CREATE TABLE IF NOT EXISTS level_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      level INTEGER NOT NULL,
      role_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE,
      UNIQUE(guild_id, level)
    )
  `);

  // Table: afk_users
  db.exec(`
    CREATE TABLE IF NOT EXISTS afk_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      reason TEXT,
      set_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE,
      UNIQUE(user_id, guild_id)
    )
  `);

  // Index pour optimisation
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_guild ON users(guild_id);
    CREATE INDEX IF NOT EXISTS idx_users_user ON users(user_id);
    CREATE INDEX IF NOT EXISTS idx_warns_guild ON warns(guild_id);
    CREATE INDEX IF NOT EXISTS idx_warns_user ON warns(user_id);
    CREATE INDEX IF NOT EXISTS idx_mod_logs_guild ON mod_logs(guild_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_guild ON tickets(guild_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_giveaways_ended ON giveaways(ended);
  `);

  console.log('✅ Initial schema created successfully');
};

export const down = (db) => {
  // Suppression des tables (rollback)
  const tables = [
    'afk_users',
    'level_roles',
    'inventory',
    'shop_items',
    'giveaways',
    'ticket_messages',
    'tickets',
    'mod_logs',
    'warns',
    'users',
    'guilds'
  ];

  tables.forEach(table => {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  });

  console.log('✅ Initial schema rolled back');
};
