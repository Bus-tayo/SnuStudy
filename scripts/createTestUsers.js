import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env.local') });

// 🔑 service role key 사용
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PASSWORD = '11111111';

const USERS = [
  {
    email: 'mentee1@gmail.com',
    password: PASSWORD,
    user_metadata: { app_user_id: 1, role: 'MENTEE', name: '멘티1' },
  },
  {
    email: 'mentee2@gmail.com',
    password: PASSWORD,
    user_metadata: { app_user_id: 2, role: 'MENTEE', name: '멘티2' },
  },
  {
    email: 'mentor1@gmail.com',
    password: PASSWORD,
    user_metadata: { app_user_id: 100, role: 'MENTOR', name: '멘토1' },
  },
];

async function main() {
  for (const u of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.user_metadata,
    });

    if (error) {
      console.error('❌ 실패:', u.email, error.message);
    } else {
      console.log('✅ 생성됨:', u.email, data.user.id);
    }
  }
}

main();
