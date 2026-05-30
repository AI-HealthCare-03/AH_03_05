SELECT 'CREATE DATABASE ozcoding' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ozcoding')\gexec
