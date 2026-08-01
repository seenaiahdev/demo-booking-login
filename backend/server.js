// Purpose: Express server strictly enforcing user authentication against Supabase demo_booking / demo_bookings table with multi-column phone/password matching and video progress tracking in video_progress table.

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Live Supabase Project Credentials
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuovnncsnvabnqapqehm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1b3ZubmNzbnZhYm5xYXBxZWhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM4OTc1NywiZXhwIjoyMTAwOTY1NzU3fQ.VkZDYgRxwC07XoXHhS-7Tzq4t4YqzD2zZjvjJCzgVXA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

// 1. LOGIN ENDPOINT: Authenticates against Supabase demo_booking / demo_bookings table
app.post('/api/login', async (req, res) => {
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

    // Fetch all records from 'demo_booking' or 'demo_bookings'
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

    // 1. Check if user exists by email or mobile number (across mbnum, mobile, phone columns)
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
        message: 'Account does not exist. Email or mobile number is not registered in demo_booking table.'
      });
    }

    // 2. Check password (against explicit password column OR firstname@last4digits format)
    const userPass = String(userExists.password || userExists.pass || userExists.generated_password || '').trim();
    const nameVal = String(userExists.name || userExists.firstname || userExists.first_name || '').trim().toLowerCase();
    const userPhone = String(userExists.mbnum || userExists.mobile || userExists.phone || '').trim().replace(/[^0-9]/g, '');
    const last4 = userPhone.slice(-4);
    const derivedPass = `${nameVal}@${last4}`;

    const passwordMatch = (userPass && userPass === cleanPassword) || (derivedPass && derivedPass === cleanPassword.toLowerCase());

    if (!passwordMatch) {
      return res.json({
        success: false,
        message: 'Incorrect password. Please verify your password and try again.'
      });
    }

    // 3. User authenticated successfully
    const userId = String(userExists.id || userExists.email || userExists.mbnum || userPhone);
    const userName = userExists.name || userExists.firstname || userExists.full_name || (userExists.email ? userExists.email.split('@')[0] : `User ${userPhone}`);

    return res.json({
      success: true,
      message: 'Successfully authenticated via Supabase demo_booking table!',
      user: {
        id: userId,
        email: userExists.email,
        mbnum: userExists.mbnum || userPhone,
        name: userName
      }
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
app.get('/api/progress/:userId', async (req, res) => {
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
          completed: !!data.completed
        }
      });
    }

    return res.json({ success: true, progress: { currentTime: 0, completed: false } });
  } catch (err) {
    return res.json({ success: true, progress: { currentTime: 0, completed: false } });
  }
});

// 3. SAVE PROGRESS ENDPOINT: Upserts watch state into live Supabase 'video_progress' table
app.post('/api/progress/:userId', async (req, res) => {
  const { userId } = req.params;
  const { currentTime, completed } = req.body || {};

  const progressPayload = {
    user_id: String(userId),
    current_time: Math.floor(typeof currentTime === 'number' ? currentTime : 0),
    completed: !!completed,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('video_progress')
      .upsert([progressPayload], { onConflict: 'user_id' })
      .select();

    if (error) {
      console.warn('Supabase video_progress upsert notice:', error.message);
      return res.status(200).json({ success: true, progress: progressPayload });
    }

    return res.json({
      success: true,
      message: 'Progress saved to Supabase video_progress table',
      progress: {
        currentTime: progressPayload.current_time,
        completed: progressPayload.completed
      },
      data
    });
  } catch (err) {
    console.warn('Supabase video_progress upsert error:', err);
    return res.status(200).json({ success: true, progress: progressPayload });
  }
});

// 4. DYNAMIC VIDEO CONFIGURATION & PROXY ENDPOINTS
let currentVideoUrl = 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4';

app.get('/api/video-config', (req, res) => {
  return res.json({
    success: true,
    videoUrl: currentVideoUrl,
    title: 'AspireNext Ultra HD 12-Minute Masterclass'
  });
});

app.post('/api/video-config', async (req, res) => {
  try {
    const { videoUrl } = req.body || {};
    if (videoUrl && typeof videoUrl === 'string' && videoUrl.trim().startsWith('http')) {
      currentVideoUrl = videoUrl.trim();
      return res.json({
        success: true,
        message: 'Video source URL successfully updated in backend!',
        videoUrl: currentVideoUrl
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Invalid video URL. Please provide a valid HTTP/HTTPS video stream link.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error updating video URL.' });
  }
});

// Video proxy endpoint for media playback (supports dynamic ?url= query parameter)
app.get('/api/video-proxy', (req, res) => {
  const requestedUrl = req.query.url;
  const targetUrl = (requestedUrl && typeof requestedUrl === 'string' && requestedUrl.trim().startsWith('http'))
    ? requestedUrl.trim()
    : currentVideoUrl;
  return res.redirect(302, targetUrl);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT} with live Supabase client (${SUPABASE_URL})`);
});
