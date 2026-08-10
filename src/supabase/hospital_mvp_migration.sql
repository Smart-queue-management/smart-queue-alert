-- HOSPITAL MVP SAFE MIGRATION SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR TO SETUP TABLES AND SCHEMAS WITHOUT DATA LOSS

-- 0. Ensure queue table exists
CREATE TABLE IF NOT EXISTS queue (
    id UUID DEFAULT gen_random_uuid(),
    token_id TEXT PRIMARY KEY,
    patient_name TEXT,
    department TEXT,
    status TEXT DEFAULT 'waiting' NOT NULL,
    booking_type TEXT DEFAULT 'self' NOT NULL,
    patient_phone TEXT,
    patient_age INTEGER,
    patient_gender TEXT,
    token_data JSONB,
    room_counter TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1. Ensure ALTER TABLE queue ADD COLUMN statements (for backward compatibility)
ALTER TABLE queue ADD COLUMN IF NOT EXISTS room_counter TEXT;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS patient_phone TEXT;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS patient_age INTEGER;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS patient_gender TEXT;
ALTER TABLE queue ADD COLUMN IF NOT EXISTS booking_type TEXT DEFAULT 'self';
ALTER TABLE queue ADD COLUMN IF NOT EXISTS token_data JSONB;

-- 2. Ensure ALTER TABLE staff_accounts ADD COLUMN statements
ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS room_counter TEXT DEFAULT 'Room 101';
ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Dr. Staff';
ALTER TABLE staff_accounts ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General Medicine';

-- 3. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    average_wait_time INTEGER DEFAULT 15,
    status TEXT DEFAULT 'active',
    services TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialization TEXT,
    experience INTEGER,
    status TEXT DEFAULT 'available',
    department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create queue_visits table
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

-- 6. Create prescriptions table
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

-- 7. Seed mock data for departments, doctors, and staff
INSERT INTO departments (id, name, type, average_wait_time, services) VALUES
('gen_med', 'General Medicine', 'clinic', 10, ARRAY['General Consultation', 'Routine Check-up']),
('ortho', 'Orthopedics', 'clinic', 15, ARRAY['Joint Pain Consultation', 'Bone Density Test']),
('cardio', 'Cardiology', 'clinic', 20, ARRAY['ECG', 'Echocardiography']),
('neuro', 'Neurology', 'clinic', 25, ARRAY['Brain Consultation', 'Stroke Care']),
('ped', 'Pediatrics', 'clinic', 15, ARRAY['Child Care', 'Vaccination']),
('lab', 'Laboratory', 'diagnostic', 12, ARRAY['Blood Test', 'Urine Analysis']),
('pharm', 'Pharmacy', 'support', 8, ARRAY['Medicine Collection', 'Pharmacist Consultation']),
('rad', 'Radiology', 'diagnostic', 15, ARRAY['X-Ray', 'CT Scan', 'MRI']),
('emg', 'Emergency', 'clinic', 5, ARRAY['Emergency Care', 'Trauma Treatment', 'Critical Care']),
('ent', 'ENT', 'clinic', 15, ARRAY['Hearing Test', 'Throat Examination']),
('rec', 'Reception', 'administrative', 3, ARRAY['Registration', 'Billing'])
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, average_wait_time = EXCLUDED.average_wait_time;

INSERT INTO doctors (id, name, specialization, experience, status, department_id) VALUES
('gen1', 'Dr. Ravi Sharma', 'Internal Medicine', 25, 'available', 'gen_med'),
('gen2', 'Dr. Anjali Nair', 'Family Medicine', 12, 'available', 'gen_med'),
('gen3', 'Dr. Suresh Iyer', 'Preventive Care', 8, 'available', 'gen_med'),
('orth1', 'Dr. Rajesh Kumar', 'Joint Surgery', 15, 'available', 'ortho'),
('orth2', 'Dr. Priya Singh', 'Sports Medicine', 10, 'available', 'ortho'),
('orth3', 'Dr. Amit Shah', 'Spine Surgery', 12, 'available', 'ortho'),
('card1', 'Dr. Sunita Mehta', 'Heart Surgery', 20, 'available', 'cardio'),
('card2', 'Dr. Vikram Patel', 'Interventional Cardiology', 18, 'available', 'cardio'),
('card3', 'Dr. Kavita Reddy', 'Pediatric Cardiology', 14, 'available', 'cardio'),
('neuro1', 'Dr. Ashok Gupta', 'Brain Surgery', 22, 'available', 'neuro'),
('neuro2', 'Dr. Meera Joshi', 'Stroke Treatment', 16, 'available', 'neuro'),
('ped1', 'Dr. Rekha Varma', 'Child Care', 16, 'available', 'ped'),
('ped2', 'Dr. Mohit Khanna', 'Pediatric Surgery', 11, 'available', 'ped'),
('lab1', 'Dr. Kavya Technician', 'Lab Technology', 8, 'available', 'lab'),
('lab2', 'Dr. Rahul Pathologist', 'Pathology', 12, 'available', 'lab'),
('pharm1', 'Dr. Sita Pharmacist', 'Clinical Pharmacy', 10, 'available', 'pharm'),
('pharm2', 'Dr. Ram Chemist', 'Pharmaceutical Sciences', 15, 'available', 'pharm'),
('rad1', 'Dr. Priya Radiologist', 'Medical Imaging', 14, 'available', 'rad'),
('rad2', 'Dr. Arjun Scanner', 'Diagnostic Radiology', 11, 'available', 'rad'),
('emg1', 'Dr. Kiran Emergency', 'Emergency Medicine', 18, 'available', 'emg'),
('emg2', 'Dr. Deepak Trauma', 'Trauma Surgery', 20, 'available', 'emg'),
('rec1', 'Reception Staff', 'Administrative', 5, 'available', 'rec'),
('ent1', 'Dr. K. Srinivas', 'ENT Specialist', 10, 'available', 'ent')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, department_id = EXCLUDED.department_id;

INSERT INTO staff_accounts (staff_id, password_hash, role, name, department, room_counter) VALUES
('doc_satish', 'password123', 'staff', 'Dr. Satish Kumar', 'General Medicine', 'Room 101'),
('doc_ramesh', 'password123', 'staff', 'Dr. Ramesh Babu', 'General Medicine', 'Room 101'),
('doc_lakshmi', 'password123', 'staff', 'Dr. Lakshmi Prasad', 'Cardiology', 'Room 102'),
('doc_srinivas', 'password123', 'staff', 'Dr. K. Srinivas', 'ENT', 'Room 103'),
('doc_venkat', 'password123', 'staff', 'Dr. P. Venkat', 'Orthopedics', 'Room 104'),
('doc_lab', 'password123', 'staff', 'Dr. Lab Technician', 'Laboratory', 'Lab Counter 1'),
('doc_pharm', 'password123', 'staff', 'Dr. Pharmacist', 'Pharmacy', 'Pharmacy Counter 2'),
('doc_neuro', 'password123', 'staff', 'Dr. Ashok Gupta', 'Neurology', 'Room 105'),
('doc_ped', 'password123', 'staff', 'Dr. Rekha Varma', 'Pediatrics', 'Room 106'),
('doc_emg', 'password123', 'staff', 'Dr. Kiran Emergency', 'Emergency', 'Emergency Room 1'),
('receptionist', 'password123', 'receptionist', 'Reception Counter', 'Receptionist', 'Reception Desk 1')
ON CONFLICT (staff_id) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, department = EXCLUDED.department, room_counter = EXCLUDED.room_counter;

-- 8. RLS Policies Check & Enablement
ALTER TABLE queue_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- queue_visits policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_visits' AND policyname = 'Public read access for queue_visits') THEN
        CREATE POLICY "Public read access for queue_visits" ON queue_visits FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_visits' AND policyname = 'Public insert access for queue_visits') THEN
        CREATE POLICY "Public insert access for queue_visits" ON queue_visits FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_visits' AND policyname = 'Public update access for queue_visits') THEN
        CREATE POLICY "Public update access for queue_visits" ON queue_visits FOR UPDATE USING (true);
    END IF;

    -- departments policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Public read departments') THEN
        CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Public write departments') THEN
        CREATE POLICY "Public write departments" ON departments FOR INSERT WITH CHECK (true);
    END IF;

    -- doctors policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doctors' AND policyname = 'Public read doctors') THEN
        CREATE POLICY "Public read doctors" ON doctors FOR SELECT USING (true);
    END IF;

    -- prescriptions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'Public read prescriptions') THEN
        CREATE POLICY "Public read prescriptions" ON prescriptions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'Public write prescriptions') THEN
        CREATE POLICY "Public write prescriptions" ON prescriptions FOR INSERT WITH CHECK (true);
    END IF;
END
$$;

-- 9. Create otp_verification table (needed by Vercel serverless functions)
CREATE TABLE IF NOT EXISTS otp_verification (
    phone TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely drop any foreign key constraints that prevent OTP generation for unregistered phone numbers
ALTER TABLE otp_verification DROP CONSTRAINT IF EXISTS otp_verification_phone_fkey;

-- Ensure patients ID column auto-generates a UUID if not supplied
ALTER TABLE patients ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 10. Configure RLS Policies for OTP Verification, Patients, queue and staff_accounts tables
ALTER TABLE otp_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_accounts DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- otp_verification policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'otp_verification' AND policyname = 'Public read access for otp_verification') THEN
        CREATE POLICY "Public read access for otp_verification" ON otp_verification FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'otp_verification' AND policyname = 'Public insert access for otp_verification') THEN
        CREATE POLICY "Public insert access for otp_verification" ON otp_verification FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'otp_verification' AND policyname = 'Public delete access for otp_verification') THEN
        CREATE POLICY "Public delete access for otp_verification" ON otp_verification FOR DELETE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'otp_verification' AND policyname = 'Public update access for otp_verification') THEN
        CREATE POLICY "Public update access for otp_verification" ON otp_verification FOR UPDATE USING (true);
    END IF;

    -- patients public policies (required to query/insert patient records anonymously before Supabase Auth session)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Public read access for patients') THEN
        CREATE POLICY "Public read access for patients" ON patients FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Public insert access for patients') THEN
        CREATE POLICY "Public insert access for patients" ON patients FOR INSERT WITH CHECK (true);
    END IF;

    -- queue public policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue' AND policyname = 'Public read access for queue') THEN
        CREATE POLICY "Public read access for queue" ON queue FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue' AND policyname = 'Public insert access for queue') THEN
        CREATE POLICY "Public insert access for queue" ON queue FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue' AND policyname = 'Public update access for queue') THEN
        CREATE POLICY "Public update access for queue" ON queue FOR UPDATE USING (true);
    END IF;
END
$$;


