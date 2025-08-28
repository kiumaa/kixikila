import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('Testing with compromised password: Password123!');
const { data, error } = await supabase.auth.signUp({
  email: "testuser@gmail.com",
  password: "Password123!" // a known pwned password
});

console.log('Error:', error?.message || 'No error');
console.log('Data:', data ? 'User created successfully' : 'No user data');

// Test with an even more common password
console.log('\nTesting with very common password: password123');
const { data: data2, error: error2 } = await supabase.auth.signUp({
  email: "testuser2@gmail.com",
  password: "password123" // extremely common password
});

console.log('Error:', error2?.message || 'No error');
console.log('Data:', data2 ? 'User created successfully' : 'No user data');