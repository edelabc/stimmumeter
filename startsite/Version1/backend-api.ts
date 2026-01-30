// backend/api/mood-api.ts
// Beispiel-Implementation für Node.js/Express mit TypeScript

import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import Redis from 'ioredis';
import rateLimit from 'express-rate-limit';
import { body, query, validationResult } from 'express-validator';

const app = express();
const port = process.env.PORT || 3001;

// Database connections
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate Limiting
const guessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Zu viele Versuche. Bitte warte etwas.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ==================== ENDPOINTS ====================

// 1. Live Mood Data Endpoint
app.get('/api/mood/live', 
  query('time_window').optional().isIn(['15m', '1h', '24h', '7d']),
  query('zoom').optional().isInt({ min: 1, max: 10 }),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const timeWindow = req.query.time_window || '15m';
      const zoom = parseInt(req.query.zoom as string) || 5;
      
      // Check cache first
      const cacheKey = `mood:live:${timeWindow}:${zoom}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Calculate grid size based on zoom level
      const gridSize = 0.5 / Math.pow(2, zoom - 5);

      // Aggregation query
      const query = `
        WITH time_filtered AS (
          SELECT 
            e.*,
            i.category,
            i.name as indicator_name,
            i.emoji,
            ROUND(CAST(e.latitude AS numeric) / $2) * $2 as grid_lat,
            ROUND(CAST(e.longitude AS numeric) / $2) * $2 as grid_lng
          FROM mood_entries e
          JOIN mood_indicators i ON e.indicator_id = i.id
          WHERE e.created_at > NOW() - CAST($1 AS INTERVAL)
        ),
        aggregated AS (
          SELECT 
            grid_lat as lat,
            grid_lng as lng,
            COUNT(*) as count,
            AVG(CASE 
              WHEN category = 'positiv' THEN value / 10.0
              WHEN category = 'negativ' THEN -value / 10.0
              ELSE 0
            END) as mood_score,
            MODE() WITHIN GROUP (ORDER BY indicator_name) as dominant_indicator,
            ARRAY_AGG(DISTINCT indicator_name) as indicators,
            ARRAY_AGG(DISTINCT emoji) as emojis
          FROM time_filtered
          GROUP BY grid_lat, grid_lng
          HAVING COUNT(*) > 2  -- Minimum entries for privacy
        ),
        with_location AS (
          SELECT 
            a.*,
            COALESCE(l.city, '') as city,
            COALESCE(l.country, '') as country,
            CASE 
              WHEN mood_score >= 0.2 THEN 'positive'
              WHEN mood_score <= -0.2 THEN 'negative'
              ELSE 'neutral'
            END as state
          FROM aggregated a
          LEFT JOIN location_cache l ON 
            ABS(l.lat - a.lat) < 0.01 AND 
            ABS(l.lng - a.lng) < 0.01
        )
        SELECT * FROM with_location
        ORDER BY count DESC
        LIMIT 500;
      `;

      const timeMapping: Record<string, string> = {
        '15m': '15 minutes',
        '1h': '1 hour',
        '24h': '24 hours',
        '7d': '7 days'
      };

      const result = await db.query(query, [timeMapping[timeWindow as string], gridSize]);

      // Process top indicators for each cell
      const cells = result.rows.map(row => ({
        ...row,
        mood_score: parseFloat(row.mood_score.toFixed(2)),
        top_indicators: row.indicators?.slice(0, 3).map((name: string, idx: number) => ({
          name,
          emoji: row.emojis[idx] || '😐',
          share: 0.33 // Simplified for demo
        })) || []
      }));

      const response = {
        time_window: timeWindow,
        generated_at: new Date().toISOString(),
        total_entries: cells.reduce((sum, cell) => sum + cell.count, 0),
        cells
      };

      // Cache for 30 seconds
      await redis.setex(cacheKey, 30, JSON.stringify(response));

      res.json(response);
    } catch (error) {
      console.error('Error fetching live mood data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 2. User Guess Verification
app.post('/api/mood/guess',
  guessLimiter,
  body('user_id').isUUID(),
  body('session_id').isUUID(),
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  body('guess').isIn(['positive', 'neutral', 'negative']),
  body('captcha_token').notEmpty(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user_id, session_id, lat, lng, guess, captcha_token } = req.body;

      // Verify reCAPTCHA
      const captchaValid = await verifyRecaptcha(captcha_token);
      if (!captchaValid) {
        return res.status(403).json({ error: 'Captcha validation failed' });
      }

      // Verify session
      const sessionValid = await verifySession(user_id, session_id);
      if (!sessionValid) {
        return res.status(403).json({ error: 'Invalid session' });
      }

      // Get actual mood state for location
      const actualStateQuery = `
        WITH recent_entries AS (
          SELECT 
            i.category,
            e.value
          FROM mood_entries e
          JOIN mood_indicators i ON e.indicator_id = i.id
          WHERE 
            e.created_at > NOW() - INTERVAL '15 minutes'
            AND ABS(e.latitude - $1) < 0.1
            AND ABS(e.longitude - $2) < 0.1
        ),
        mood_calc AS (
          SELECT 
            AVG(CASE 
              WHEN category = 'positiv' THEN value / 10.0
              WHEN category = 'negativ' THEN -value / 10.0
              ELSE 0
            END) as mood_score
          FROM recent_entries
        )
        SELECT 
          CASE 
            WHEN mood_score >= 0.2 THEN 'positive'
            WHEN mood_score <= -0.2 THEN 'negative'
            ELSE 'neutral'
          END as actual_state
        FROM mood_calc;
      `;

      const stateResult = await db.query(actualStateQuery, [lat, lng]);
      const actualState = stateResult.rows[0]?.actual_state || 'neutral';
      const correct = guess === actualState;

      // Calculate YRA reward
      let yraEarned = 0;
      if (correct) {
        yraEarned = 10; // Base reward

        // Check for streak bonus
        const streakQuery = `
          SELECT COUNT(*) as streak
          FROM (
            SELECT correct
            FROM guess_history
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 10
          ) recent
          WHERE correct = true;
        `;
        
        const streakResult = await db.query(streakQuery, [user_id]);
        const streak = parseInt(streakResult.rows[0]?.streak || '0');

        if (streak === 4) yraEarned += 15; // 5-streak bonus
        if (streak === 9) yraEarned += 90; // 10-streak bonus
      }

      // Record guess
      await db.query(`
        INSERT INTO guess_history (user_id, lat, lng, guessed_state, actual_state, correct, yra_earned)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [user_id, lat, lng, guess, actualState, correct, yraEarned]);

      // Update YRA balance
      if (yraEarned > 0) {
        await db.query(`
          INSERT INTO yra_transactions (user_id, amount, type, reason)
          VALUES ($1, $2, 'earned', 'correct_guess')
        `, [user_id, yraEarned]);
      }

      // Get updated balance
      const balanceResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as balance
        FROM yra_transactions
        WHERE user_id = $1
      `, [user_id]);

      // Get next random location
      const nextLocation = await getRandomLocation();

      res.json({
        correct,
        actual_state: actualState,
        yra_earned: yraEarned,
        streak: correct ? (streak + 1) : 0,
        total_yra_balance: parseInt(balanceResult.rows[0].balance),
        next_location: nextLocation
      });

    } catch (error) {
      console.error('Error processing guess:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 3. Submit Mood Entry
app.post('/api/mood/entry',
  body('user_id').isUUID(),
  body('indicator_id').isInt(),
  body('value').isFloat({ min: 0, max: 10 }),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user_id, pseudonym_id, indicator_id, value, latitude, longitude, weather_data } = req.body;

      // Insert mood entry
      const result = await db.query(`
        INSERT INTO mood_entries (
          user_id, pseudonym_id, indicator_id, value, 
          latitude, longitude, weather_data, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id
      `, [user_id, pseudonym_id, indicator_id, value, latitude, longitude, weather_data]);

      // Award YRA for entry (max 10 per day)
      const todayEntriesCount = await db.query(`
        SELECT COUNT(*) as count
        FROM mood_entries
        WHERE user_id = $1
        AND created_at::date = CURRENT_DATE
      `, [user_id]);

      if (parseInt(todayEntriesCount.rows[0].count) <= 10) {
        await db.query(`
          INSERT INTO yra_transactions (user_id, amount, type, reason)
          VALUES ($1, 2, 'earned', 'mood_entry')
        `, [user_id]);
      }

      // Invalidate relevant caches
      const cacheKeys = ['mood:live:15m:*', 'mood:live:1h:*'];
      for (const pattern of cacheKeys) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      res.json({
        success: true,
        entry_id: result.rows[0].id,
        yra_earned: todayEntriesCount.rows[0].count < 10 ? 2 : 0
      });

    } catch (error) {
      console.error('Error submitting mood entry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 4. Get User YRA Balance
app.get('/api/user/yra-balance/:user_id',
  async (req: Request, res: Response) => {
    try {
      const { user_id } = req.params;

      const balanceQuery = `
        WITH transactions AS (
          SELECT 
            COALESCE(SUM(amount), 0) as balance,
            COALESCE(SUM(CASE WHEN type = 'earned' THEN amount ELSE 0 END), 0) as lifetime_earned
          FROM yra_transactions
          WHERE user_id = $1
        ),
        current_streak AS (
          SELECT COUNT(*) as streak
          FROM (
            SELECT correct
            FROM guess_history
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 100
          ) recent
          WHERE correct = true
          AND NOT EXISTS (
            SELECT 1 FROM guess_history
            WHERE user_id = $1 AND correct = false
            AND created_at > (
              SELECT MAX(created_at) FROM guess_history
              WHERE user_id = $1 AND correct = true
            )
          )
        ),
        ranking AS (
          SELECT COUNT(*) + 1 as rank
          FROM (
            SELECT user_id, SUM(amount) as total
            FROM yra_transactions
            WHERE type = 'earned'
            GROUP BY user_id
          ) user_totals
          WHERE total > (
            SELECT COALESCE(SUM(amount), 0)
            FROM yra_transactions
            WHERE user_id = $1 AND type = 'earned'
          )
        )
        SELECT 
          t.balance,
          t.lifetime_earned,
          cs.streak,
          r.rank
        FROM transactions t, current_streak cs, ranking r;
      `;

      const result = await db.query(balanceQuery, [user_id]);
      
      // Get recent transactions
      const recentTxQuery = `
        SELECT type, amount, reason, created_at as timestamp
        FROM yra_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      const recentTx = await db.query(recentTxQuery, [user_id]);

      res.json({
        user_id,
        balance: parseInt(result.rows[0]?.balance || '0'),
        lifetime_earned: parseInt(result.rows[0]?.lifetime_earned || '0'),
        current_streak: parseInt(result.rows[0]?.streak || '0'),
        global_rank: parseInt(result.rows[0]?.rank || '0'),
        recent_transactions: recentTx.rows
      });

    } catch (error) {
      console.error('Error fetching YRA balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 5. Manage User Pseudonyms
app.post('/api/user/pseudonyms',
  body('user_id').isUUID(),
  body('pseudonyms').isArray(),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { user_id, pseudonyms } = req.body;

      // Delete existing pseudonyms
      await db.query('DELETE FROM user_pseudonyms WHERE user_id = $1', [user_id]);

      // Insert new pseudonyms
      for (const pseudonym of pseudonyms) {
        await db.query(`
          INSERT INTO user_pseudonyms (user_id, name, type, color, avatar_emoji)
          VALUES ($1, $2, $3, $4, $5)
        `, [user_id, pseudonym.name, pseudonym.type, pseudonym.color, pseudonym.avatar_emoji]);
      }

      res.json({ success: true, count: pseudonyms.length });

    } catch (error) {
      console.error('Error managing pseudonyms:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ==================== HELPER FUNCTIONS ====================

async function verifyRecaptcha(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    });
    
    const data = await response.json();
    return data.success && data.score > 0.5;
  } catch {
    return false;
  }
}

async function verifySession(userId: string, sessionId: string): Promise<boolean> {
  const result = await db.query(`
    SELECT is_valid 
    FROM user_sessions 
    WHERE user_id = $1 AND session_token = $2 
    AND last_activity > NOW() - INTERVAL '1 hour'
  `, [userId, sessionId]);
  
  return result.rows[0]?.is_valid || false;
}

async function getRandomLocation(): Promise<any> {
  const locations = await redis.get('active_locations');
  if (locations) {
    const locs = JSON.parse(locations);
    return locs[Math.floor(Math.random() * locs.length)];
  }
  
  // Fallback to database
  const result = await db.query(`
    SELECT DISTINCT 
      ROUND(latitude::numeric, 1) as lat,
      ROUND(longitude::numeric, 1) as lng,
      COUNT(*) as activity
    FROM mood_entries
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY lat, lng
    HAVING COUNT(*) > 5
    ORDER BY RANDOM()
    LIMIT 1
  `);
  
  if (result.rows[0]) {
    return {
      lat: parseFloat(result.rows[0].lat),
      lng: parseFloat(result.rows[0].lng),
      hint: 'Aktive Region mit vielen Einträgen'
    };
  }
  
  // Ultimate fallback
  return {
    lat: 50.94 + (Math.random() - 0.5) * 10,
    lng: 6.96 + (Math.random() - 0.5) * 10,
    hint: 'Zufällige Location'
  };
}

// ==================== WebSocket for Live Updates ====================

import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room for live updates
  socket.on('subscribe_live_mood', (params) => {
    socket.join('live_mood_updates');
    console.log('Client subscribed to live mood updates');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast updates every 30 seconds
setInterval(async () => {
  try {
    const cacheKey = 'mood:live:15m:5';
    const data = await redis.get(cacheKey);
    
    if (data) {
      io.to('live_mood_updates').emit('mood_update', JSON.parse(data));
    }
  } catch (error) {
    console.error('Error broadcasting mood updates:', error);
  }
}, 30000);

// ==================== Start Server ====================

server.listen(port, () => {
  console.log(`🚀 WAMELI API Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;