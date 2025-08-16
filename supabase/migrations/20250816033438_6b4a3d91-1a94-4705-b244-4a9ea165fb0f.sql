-- Enable public access to all directory tables since they are reference data

-- Bookings Directory
CREATE POLICY "Anyone can view bookings directory" 
ON "Bookings Directory" 
FOR SELECT 
USING (true);

-- Collaborators
CREATE POLICY "Anyone can view collaborators directory" 
ON "Collaborators" 
FOR SELECT 
USING (true);

-- Entertainment Directory
CREATE POLICY "Anyone can view entertainment directory" 
ON "Entertainment Directory" 
FOR SELECT 
USING (true);

-- Hospitality Directory
CREATE POLICY "Anyone can view hospitality directory" 
ON "Hospitality Directory" 
FOR SELECT 
USING (true);

-- Service Rental/Sale Directory
CREATE POLICY "Anyone can view service rental directory" 
ON "Service Rental/Sale Directory" 
FOR SELECT 
USING (true);

-- Service Vendor Directory
CREATE POLICY "Anyone can view service vendor directory" 
ON "Service Vendor Directory" 
FOR SELECT 
USING (true);

-- Supplier Directory
CREATE POLICY "Anyone can view supplier directory" 
ON "Supplier Directory" 
FOR SELECT 
USING (true);

-- Transportation Directory
CREATE POLICY "Anyone can view transportation directory" 
ON "Transportation Directory" 
FOR SELECT 
USING (true);

-- Vendor Directory
CREATE POLICY "Anyone can view vendor directory" 
ON "Vendor Directory" 
FOR SELECT 
USING (true);

-- Venue Directory
CREATE POLICY "Anyone can view venue directory" 
ON "Venue Directory" 
FOR SELECT 
USING (true);