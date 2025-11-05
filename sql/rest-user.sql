-- COULDN'T GET THIS TO WORK PROPERLY

DROP USER IF EXISTS restuser;

-- Add a REST API user with CRUD access only.
-- This user is restricted from accessing PostgreSQL system catalogs and information schema.
CREATE USER restuser WITH PASSWORD 'restpassword';

-- Grant CRUD operations on application tables only
GRANT SELECT, INSERT, UPDATE, DELETE ON Game TO restuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON Player TO restuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON PlayerGame TO restuser;

-- Revoke default PUBLIC access to system catalogs and information schema
-- This prevents SQL injection attacks from querying metadata
REVOKE ALL ON SCHEMA information_schema FROM restuser;
REVOKE ALL ON SCHEMA pg_catalog FROM restuser;
REVOKE ALL ON ALL TABLES IN SCHEMA information_schema FROM restuser;
REVOKE ALL ON ALL TABLES IN SCHEMA pg_catalog FROM restuser;
