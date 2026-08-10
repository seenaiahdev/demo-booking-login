try {
  require('dotenv').config();
} catch (e) {}

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Live Supabase Project Credentials (from process.env with fallback)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuovnncsnvabnqapqehm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1b3ZubmNzbnZhYm5xYXBxZWhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4OTc1NywiZXhwIjoyMTAwOTY1NzU3fQ.VkZDYgRxwC07XoXHhS-7Tzq4t4YqzD2zZjvjJCzgVXA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

// Express Router supporting both /api prefix and root paths for serverless & local dev
const router = express.Router();

// 1. LOGIN ENDPOINT: Authenticates against Supabase demo_booking / demo_bookings table
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.json({ success: false, message: 'Please enter both Email/Mobile and Password.' });
    }

    const cleanIdentifier = String(identifier).trim().toLowerCase();
    const cleanPassword = String(password).trim();
    const cleanIdDigits = cleanIdentifier.replace(/[^0-9]/g, '');

    let records = [];
    let queryError = null;

    try {
      const res1 = await supabase.from('demo_booking').select('*');
      if (!res1.error && res1.data && res1.data.length > 0) {
        records = res1.data;
      } else {
        const res2 = await supabase.from('demo_bookings').select('*');
        if (!res2.error && res2.data && res2.data.length > 0) {
          records = res2.data;
        } else {
          queryError = res1.error || res2.error;
        }
      }
    } catch (errQ) {
      console.error('Database fetch error:', errQ);
    }

    if (records.length === 0) {
      console.warn('Supabase query notice:', queryError ? queryError.message : 'No records returned');
    }

    const userExists = records.find(u => {
      const userEmail = String(u.email || u.user_email || u.email_id || '').trim().toLowerCase();
      const userPhone = String(u.mbnum || u.mobile || u.phone || u.phone_number || u.mobile_number || u.mbno || '').trim().replace(/[^0-9]/g, '');

      const emailMatch = userEmail && userEmail === cleanIdentifier;
      const phoneMatch = userPhone && (userPhone === cleanIdentifier || (cleanIdDigits && userPhone === cleanIdDigits));
      return emailMatch || phoneMatch;
    });

    if (!userExists) {
      return res.json({
        success: false,
        message: 'Account does not exist. Please check your email or mobile number.'
      });
    }

    const userPass = String(userExists.password || userExists.pass || userExists.generated_password || '').trim();
    const nameVal = String(userExists.full_name || userExists.name || userExists.firstname || userExists.first_name || '').trim().toLowerCase();
    const userPhone = String(userExists.mobile || userExists.mbnum || userExists.phone || '').trim().replace(/[^0-9]/g, '');
    const last4 = userPhone.slice(-4);
    const derivedPass = `${nameVal}@${last4}`;

    const passwordMatch = (userPass && userPass === cleanPassword) || (derivedPass && derivedPass === cleanPassword.toLowerCase());

    if (!passwordMatch) {
      return res.json({
        success: false,
        message: 'Incorrect password. Please verify your password and try again.'
      });
    }

    const regId = String(userExists.registration_id || userExists.reg_id || userExists.registrationNo || userExists.reg_no || userExists.id || '').trim();
    const userId = String(userExists.id || regId || userExists.email || userPhone);
    const userName = String(userExists.full_name || userExists.name || userExists.firstname || (userExists.email ? userExists.email.split('@')[0] : `User ${userPhone}`)).trim();
    const userEmail = String(userExists.email || userExists.user_email || '').trim();
    const userMobile = String(userExists.mobile || userExists.mbnum || userExists.phone || userPhone).trim();

    const userPayload = {
      id: userId,
      registration_id: regId,
      name: userName,
      email: userEmail,
      mbnum: userMobile
    };

    // 1st Database Sync: Initialize video_progress in Supabase on login ONLY IF it doesn't exist
    let existingTime = 0;
    let existingTs = '00:00';
    let existingCompleted = false;

    try {
      const { data: existingProgress } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', String(userId))
        .maybeSingle();

      if (existingProgress) {
        // User already has progress, preserve it
        existingTime = existingProgress.current_time || 0;
        existingTs = existingProgress.watched_timestamp || '00:00';
        existingCompleted = !!existingProgress.completed;
      } else {
        // Brand new user, initialize to 00:00
        await supabase
          .from('video_progress')
          .insert([{
            user_id: String(userId),
            registration_id: String(regId),
            name: String(userName),
            current_time: 0,
            watched_timestamp: '00:00',
            completed: false,
            updated_at: new Date().toISOString()
          }]);
      }
    } catch (errDb) {
      console.warn('Supabase initial login progress check notice:', errDb);
    }

    // 2nd Database Sync: Trigger user login sync to Google Sheets (sending their true progress)
    syncToGoogleSheets({
      action: 'login',
      ...userPayload,
      current_time: existingTime,
      watched_timestamp: existingTs,
      completed: existingCompleted,
      updated_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Successfully authenticated!',
      user: userPayload
    });
  } catch (err) {
    console.error('Login processing error:', err);
    return res.json({
      success: false,
      message: 'Account does not exist. Please check your credentials.'
    });
  }
});

// 2. GET PROGRESS ENDPOINT: Queries live Supabase 'video_progress' table
router.get('/progress/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', String(userId))
      .maybeSingle();

    if (!error && data) {
      return res.json({
        success: true,
        progress: {
          currentTime: data.current_time || 0,
          completed: !!data.completed,
          registration_id: data.registration_id || '',
          name: data.name || ''
        }
      });
    }

    return res.json({ success: true, progress: { currentTime: 0, completed: false } });
  } catch (err) {
    return res.json({ success: true, progress: { currentTime: 0, completed: false } });
  }
});

// Helper Function: 2nd Database - Real-Time Google Sheets Webhook Synchronizer
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbzlDpnryyngX4FNHaWxX4NxZXYpEzBykiHo92JSydkuZuM-VJXYfgEdepGo7dQWlT-g/exec';

async function syncToGoogleSheets(payload) {
  if (!GOOGLE_SHEETS_WEBHOOK_URL) return;
  try {
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.warn('Google Sheets 2nd database sync notice:', err.message);
  }
}

// 3. SAVE PROGRESS ENDPOINT: Upserts watch state into Supabase 'video_progress' and 2nd DB Google Sheets
router.post('/progress/:userId', async (req, res) => {
  const { userId } = req.params;
  let { currentTime, completed, registration_id, name, email, mbnum } = req.body || {};

  // Auto-enrich user registration_id, full_name, email, mobile from demo_booking table if missing
  if (!registration_id || !name || name === userId) {
    try {
      let records = [];
      const res1 = await supabase.from('demo_booking').select('*');
      if (!res1.error && res1.data) records = res1.data;
      else {
        const res2 = await supabase.from('demo_bookings').select('*');
        if (!res2.error && res2.data) records = res2.data;
      }

      const cleanUserId = String(userId).trim();
      const matched = records.find(u => {
        const uId = String(u.id || '').trim();
        const uReg = String(u.registration_id || u.reg_id || '').trim();
        const uEmail = String(u.email || u.user_email || '').trim().toLowerCase();
        const uMobile = String(u.mobile || u.mbnum || u.phone || '').trim().replace(/[^0-9]/g, '');

        return uId === cleanUserId || uReg === cleanUserId || (uEmail && uEmail === cleanUserId.toLowerCase()) || (uMobile && uMobile === cleanUserId.replace(/[^0-9]/g, ''));
      });

      if (matched) {
        registration_id = registration_id || matched.registration_id || matched.reg_id || matched.id || '';
        name = matched.full_name || matched.name || matched.firstname || name || '';
        email = email || matched.email || matched.user_email || '';
        mbnum = mbnum || matched.mobile || matched.mbnum || matched.phone || '';
      }
    } catch (errEnrich) {
      console.warn('Backend auto-enrichment notice:', errEnrich);
    }
  }

  const rawSeconds = Math.floor(typeof currentTime === 'number' ? currentTime : 0);
  const h = Math.floor(rawSeconds / 3600);
  const m = Math.floor((rawSeconds % 3600) / 60);
  const s = rawSeconds % 60;
  const watchedTimestamp = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const progressPayload = {
    user_id: String(userId),
    registration_id: String(registration_id || ''),
    name: String(name || ''),
    current_time: rawSeconds,
    watched_timestamp: watchedTimestamp,
    completed: !!completed,
    updated_at: new Date().toISOString()
  };

  try {
    // 1st Database: Upsert to Supabase video_progress table
    const { data, error } = await supabase
      .from('video_progress')
      .upsert([progressPayload], { onConflict: 'user_id' })
      .select();

    if (error) {
      console.warn('Supabase video_progress upsert notice:', error.message);
    }

    // 2nd Database: Sync to Google Sheets with both raw seconds and video-format timestamp
    syncToGoogleSheets({
      action: 'progress',
      user_id: String(userId),
      registration_id: String(registration_id || ''),
      name: String(name || ''),
      email: String(email || ''),
      mbnum: String(mbnum || ''),
      current_time: rawSeconds,
      watched_timestamp: watchedTimestamp,
      completed: progressPayload.completed,
      updated_at: progressPayload.updated_at
    });

    return res.json({
      success: true,
      message: 'Progress saved to Supabase and Google Sheets 2nd Database',
      progress: {
        currentTime: progressPayload.current_time,
        completed: progressPayload.completed,
        registration_id: progressPayload.registration_id,
        name: progressPayload.name
      },
      data
    });
  } catch (err) {
    console.warn('Progress save notice:', err);
    return res.status(200).json({ success: true, progress: progressPayload });
  }
});

// 4. ADMIN ENDPOINTS
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

router.post('/admin/verify', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Invalid admin password' });
});

router.get('/admin/users', async (req, res) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false });

  try {
    const { data, error } = await supabase.from('video_progress').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, users: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/admin/reset-progress', async (req, res) => {
  const { password, user_id, registration_id, name } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false });

  try {
    await supabase.from('video_progress').delete().eq('user_id', user_id);
    
    syncToGoogleSheets({
      action: 'progress',
      user_id: String(user_id),
      registration_id: String(registration_id || ''),
      name: String(name || ''),
      email: '',
      mbnum: '',
      current_time: 0,
      watched_timestamp: '00:00',
      completed: false,
      updated_at: new Date().toISOString()
    });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});

// 5. DYNAMIC VIDEO CONFIGURATION
let currentVideoId = '8KCuHHeC_M0'; // Default Learn Python video

router.get('/video-config', (req, res) => {
  return res.json({
    success: true,
    videoId: currentVideoId
  });
});

router.post('/video-config', async (req, res) => {
  const { password, videoId } = req.body || {};
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ success: false });

  try {
    if (videoId && typeof videoId === 'string' && videoId.trim().length > 0) {
      currentVideoId = videoId.trim();
      return res.json({ success: true, videoId: currentVideoId });
    }
    return res.status(400).json({ success: false });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
});
// Mount router under /api
app.use('/api', router);

// Serve built static frontend dist files
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// SPA Fallback: Serve index.html for all non-API routes so "Cannot GET /" never occurs
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexHtml = path.join(__dirname, '../frontend/dist/index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AspireNext | Portal Sign In</title>
      </head>
      <body>
        <div id="root">Loading AspireNext Portal...</div>
      </body>
    </html>
  `);
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT} with live Supabase client (${SUPABASE_URL})`);
  });
}

module.exports = app;
