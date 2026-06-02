SELECT 'CREATE DATABASE ozcoding' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ozcoding')\gexec

SELECT 'CREATE DATABASE ai_health' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ai_health')\gexec
