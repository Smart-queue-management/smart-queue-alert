-- Paste this in your Supabase SQL Editor to run

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) for patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can view own record" ON patients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own record" ON patients FOR INSERT WITH CHECK (auth.uid() = id);

-- Create staff_accounts table
CREATE TABLE IF NOT EXISTS staff_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'staff' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for staff
ALTER TABLE staff_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view own record" ON staff_accounts FOR SELECT USING (auth.uid() = id);

-- Alter staff_accounts safely
ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS room_counter TEXT DEFAULT 'Room 101';
ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Dr. Staff';
ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Medicine';

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    average_wait_time INTEGER DEFAULT 15,
    status TEXT DEFAULT 'active',
    services TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialization TEXT,
    experience INTEGER,
    status TEXT DEFAULT 'available',
    department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alter queue safely
ALTER TABLE queue ADD COLUMN IF NOT EXISTS room_counter TEXT;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS patient_phone TEXT;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS patient_age INTEGER;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS patient_gender TEXT;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'self';
ALTER TABLE queue ADD COLUMN IF NOT EXISTS token_data JSONB;

-- Create queue_visits table
CREATE TABLE IF NOT EXISTS queue_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id TEXT REFERENCES queue(token_id) ON DELETE CASCADE,
    department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
    doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'waiting', 'called', 'completed'
    sequence_order INTEGER DEFAULT 0 NOT NULL,
    room_counter TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    called_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for queue_visits
ALTER TABLE queue_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for queue_visits" ON queue_visits FOR SELECT USING (true);
CREATE POLICY "Public insert access for queue_visits" ON queue_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for queue_visits" ON queue_visits FOR UPDATE USING (true);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id TEXT REFERENCES queue(token_id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    department TEXT NOT NULL,
    diagnosis TEXT,
    medicines JSONB DEFAULT '[]'::jsonb,
    advice TEXT,
    mode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for departments, doctors, prescriptions
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Public write departments" ON departments FOR INSERT WITH CHECK (true);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read doctors" ON doctors FOR SELECT USING (true);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read prescriptions" ON prescriptions FOR SELECT USING (true);
CREATE POLICY "Public write prescriptions" ON prescriptions FOR INSERT WITH CHECK (true);

-- Seed mock data for departments and doctors
INSERT INTO departments (id, name, type, average_wait_time, services) VALUES
('gen_med', 'General Medicine', 'clinic', 10, ARRAY['General Consultation', 'Routine Check-up']),
('cardio', 'Cardiology', 'clinic', 20, ARRAY['ECG', 'Echocardiography']),
('ent', 'ENT', 'clinic', 15, ARRAY['Hearing Test', 'Throat Examination']),
('ortho', 'Orthopedics', 'clinic', 15, ARRAY['Joint Pain Consultation', 'Bone Density Test']),
('lab', 'Laboratory', 'diagnostic', 12, ARRAY['Blood Test', 'Urine Analysis']),
('pharm', 'Pharmacy', 'support', 8, ARRAY['Medicine Collection', 'Pharmacist Consultation'])
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, average_wait_time = EXCLUDED.average_wait_time;

INSERT INTO doctors (id, name, specialization, experience, status, department_id) VALUES
('gen1', 'Dr. Satish Kumar', 'General Physician', 12, 'available', 'gen_med'),
('gen2', 'Dr. Ramesh Babu', 'General Physician', 8, 'available', 'gen_med'),
('cardio1', 'Dr. Lakshmi Prasad', 'Cardiologist', 15, 'available', 'cardio'),
('ent1', 'Dr. K. Srinivas', 'ENT Specialist', 10, 'available', 'ent'),
('ortho1', 'Dr. P. Venkat', 'Orthopedic Surgeon', 14, 'available', 'ortho')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
