import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'velocity.db');

const db = new Database(dbPath);

// Enable WAL for better concurrent read performance
db.pragma('journal_mode = WAL');

// --- SCHEMA ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bikes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model TEXT NOT NULL,
    brand TEXT NOT NULL,
    type TEXT NOT NULL,
    price_per_day REAL NOT NULL,
    city TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    available INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bike_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bike_id) REFERENCES bikes(id)
  );
`);

// --- SEED DATA ---
const bikeCount = db.prepare('SELECT COUNT(*) as count FROM bikes').get().count;

if (bikeCount === 0) {
  console.log('🌱 Seeding Velo-City database...');

  // Seed users
  const hash = bcrypt.hashSync('password123', 10);
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (email, password_hash, display_name) VALUES (?, ?, ?)');
  insertUser.run('admin@velocity.com', hash, 'Admin');
  insertUser.run('rider@velocity.com', hash, 'Alex Rider');
  insertUser.run('jane@velocity.com', hash, 'Jane Cooper');

  // Seed bikes
  const insertBike = db.prepare('INSERT INTO bikes (model, brand, type, price_per_day, city, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const bikes = [
    ['Phantom X1', 'VeloTech', 'Electric', 45, 'New York', 'Ultra-lightweight carbon frame electric bike with 80km range and regenerative braking.', '/img/bike-electric-1.jpg'],
    ['Trail Blazer 900', 'Apex Cycles', 'Mountain', 35, 'Denver', 'Full-suspension mountain bike with hydraulic disc brakes and 29-inch wheels.', '/img/bike-mountain-1.jpg'],
    ['Urban Glide Pro', 'CityRide', 'City', 22, 'London', 'Step-through city commuter with integrated lights and mudguards.', '/img/bike-city-1.jpg'],
    ['Aero Sprint R', 'VeloTech', 'Road', 55, 'New York', 'Aerodynamic road bike with Shimano Ultegra groupset and deep section wheels.', '/img/bike-road-1.jpg'],
    ['E-Cruiser 360', 'CityRide', 'Electric', 40, 'Los Angeles', 'Beach-ready electric cruiser with fat tires and Bluetooth speaker.', '/img/bike-electric-2.jpg'],
    ['Summit Pro XT', 'Apex Cycles', 'Mountain', 42, 'Denver', 'Enduro-focused mountain bike with 170mm travel and dropper post.', '/img/bike-mountain-2.jpg'],
    ['Metro Dash', 'SwiftBike', 'City', 18, 'London', 'Foldable urban commuter, fits under any desk. Belt drive, zero maintenance.', '/img/bike-city-2.jpg'],
    ['Volt Fury 500', 'VeloTech', 'Electric', 60, 'Los Angeles', 'High-performance electric with 45km/h top speed and dual battery system.', '/img/bike-electric-3.jpg'],
    ['Carbon Aero SL', 'SwiftBike', 'Road', 70, 'New York', 'Race-grade carbon road bike weighing just 6.8kg with electronic shifting.', '/img/bike-road-2.jpg'],
    ['Gravel King GX', 'Apex Cycles', 'Road', 48, 'Denver', 'Adventure gravel bike with wide tire clearance and bikepacking mounts.', '/img/bike-road-3.jpg'],
  ];
  bikes.forEach(b => insertBike.run(...b));

  // Seed reviews
  const insertReview = db.prepare('INSERT INTO reviews (bike_id, user_name, content, rating) VALUES (?, ?, ?, ?)');
  insertReview.run(1, 'Alex Rider', 'Absolutely incredible ride. The motor assist is seamless and the battery lasts all day.', 5);
  insertReview.run(1, 'Jane Cooper', 'Perfect for my daily commute across Manhattan. Charges fast too.', 4);
  insertReview.run(2, 'Mike Torres', 'Took this on some gnarly trails in Colorado. Handles like a dream.', 5);
  insertReview.run(4, 'Sarah Chen', 'The aero profile is noticeable. Shaved 2 minutes off my usual loop.', 5);
  insertReview.run(5, 'Beach Bum', 'Love cruising Venice Beach on this thing. The speaker is a nice touch.', 4);
  insertReview.run(7, 'Commuter Dave', 'Folds in 10 seconds flat. My office colleagues are jealous.', 4);
  insertReview.run(9, 'Pro Racer', 'Lighter than my team bike. Seriously considering buying one.', 5);

  console.log('✅ Seeded 3 users, 10 bikes, 7 reviews');
}

export default db;
