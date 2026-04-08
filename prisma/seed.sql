-- ============================================
-- StaffingHub Seed Data
-- Generated from prisma/generate-seed-sql.ts
-- Canonical source: src/server/demo/seed-data.ts
-- ============================================

BEGIN;

-- Clean existing data
DELETE FROM "proposal_slots";
DELETE FROM "proposals";
DELETE FROM "tentative_assignments";
DELETE FROM "scenarios";
DELETE FROM "opportunity_skills";
DELETE FROM "opportunities";
DELETE FROM "wellbeing_signals";
DELETE FROM "assignments";
DELETE FROM "consultant_goals";
DELETE FROM "consultant_skills";
DELETE FROM "engagement_skills";
DELETE FROM "consultants";
DELETE FROM "engagements";
DELETE FROM "skills";

-- Skills
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-1', 'Financial Modeling', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-2', 'Change Management', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-3', 'Data Analytics', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-4', 'Due Diligence', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-5', 'Process Optimization', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-6', 'Digital Strategy', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-7', 'Stakeholder Management', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-8', 'Market Analysis', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-9', 'Risk Assessment', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-10', 'Supply Chain', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-11', 'M&A Integration', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-12', 'Cost Reduction', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-13', 'Agile Transformation', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-14', 'Cloud Migration', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-15', 'People Analytics', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-16', 'Regulatory Compliance', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-17', 'Revenue Growth', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-18', 'Customer Experience', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-19', 'Organizational Design', '2026-04-08T17:11:41.557Z');
INSERT INTO "skills" ("id", "name", "created_at") VALUES ('skill-20', 'Performance Management', '2026-04-08T17:11:41.557Z');

-- Consultants
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-1', 'Mr. Maybelle Wisozk', 'Partner', 'strategy', 'partner', 'https://api.dicebear.com/9.x/notionists/svg?seed=bbiwqiB8', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-2', 'Mr. Arnold Wintheiser', 'Partner', 'operations', 'partner', 'https://api.dicebear.com/9.x/notionists/svg?seed=6Gr7u2Ug', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-3', 'Cornelius Hane', 'Senior Manager', 'digital', 'senior_manager', 'https://api.dicebear.com/9.x/notionists/svg?seed=gPmhx8N4', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-4', 'Esta Hahn', 'Senior Manager', 'risk', 'senior_manager', 'https://api.dicebear.com/9.x/notionists/svg?seed=JDTt7ILy', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-5', 'Gregory Fay', 'Senior Manager', 'people', 'senior_manager', 'https://api.dicebear.com/9.x/notionists/svg?seed=h9VODSNb', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-6', 'Janis Carter', 'Manager', 'strategy', 'manager', 'https://api.dicebear.com/9.x/notionists/svg?seed=WkwHmYXf', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-7', 'Cecil Yost', 'Manager', 'operations', 'manager', 'https://api.dicebear.com/9.x/notionists/svg?seed=FLeJmDDx', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-8', 'Joe O''Connell', 'Manager', 'digital', 'manager', 'https://api.dicebear.com/9.x/notionists/svg?seed=GnW8l7VS', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-9', 'Lisandro Heller', 'Manager', 'risk', 'manager', 'https://api.dicebear.com/9.x/notionists/svg?seed=TSMD5aTB', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-10', 'Damian Ferry', 'Manager', 'people', 'manager', 'https://api.dicebear.com/9.x/notionists/svg?seed=KEQEz5mg', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-11', 'Cornelius Goyette', 'Consultant', 'strategy', 'consultant', 'https://api.dicebear.com/9.x/notionists/svg?seed=EaWXUm0V', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-12', 'Thelma Marks', 'Consultant', 'operations', 'consultant', 'https://api.dicebear.com/9.x/notionists/svg?seed=CZ8wSJHH', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-13', 'Pansy Hauck', 'Consultant', 'digital', 'consultant', 'https://api.dicebear.com/9.x/notionists/svg?seed=5z2sxhA1', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-14', 'Andy Lindgren', 'Consultant', 'risk', 'consultant', 'https://api.dicebear.com/9.x/notionists/svg?seed=JYwkNgr4', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-15', 'Mona Goyette DDS', 'Consultant', 'people', 'consultant', 'https://api.dicebear.com/9.x/notionists/svg?seed=yBqfmK07', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-16', 'Jennifer Morissette', 'Consultant', 'strategy', 'consultant', 'https://api.dicebear.com/9.x/notionists/svg?seed=2nCvREa4', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-17', 'Virgil Dietrich', 'Analyst', 'operations', 'analyst', 'https://api.dicebear.com/9.x/notionists/svg?seed=615G4jQ1', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-18', 'Haskell Sanford', 'Analyst', 'digital', 'analyst', 'https://api.dicebear.com/9.x/notionists/svg?seed=VRqKK6Tv', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-19', 'Lyle Greenholt', 'Analyst', 'risk', 'analyst', 'https://api.dicebear.com/9.x/notionists/svg?seed=FKNM5u3y', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "consultants" ("id", "name", "role", "practice_area", "seniority_level", "avatar_url", "status", "created_at", "updated_at") VALUES ('consultant-20', 'Ron Bode', 'Analyst', 'people', 'analyst', 'https://api.dicebear.com/9.x/notionists/svg?seed=ZnmOWZKn', 'active', '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');

-- Consultant Skills
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-1', 'skill-3');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-1', 'skill-11');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-1', 'skill-14');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-1', 'skill-20');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-2', 'skill-4');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-2', 'skill-15');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-2', 'skill-9');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-2', 'skill-8');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-3', 'skill-16');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-3', 'skill-4');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-3', 'skill-19');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-3', 'skill-10');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-3', 'skill-7');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-4', 'skill-11');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-4', 'skill-12');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-4', 'skill-14');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-4', 'skill-1');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-4', 'skill-4');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-4', 'skill-16');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-5', 'skill-17');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-5', 'skill-2');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-5', 'skill-1');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-5', 'skill-8');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-5', 'skill-20');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-5', 'skill-10');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-6', 'skill-4');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-6', 'skill-2');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-6', 'skill-6');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-6', 'skill-17');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-6', 'skill-16');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-6', 'skill-11');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-7', 'skill-11');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-7', 'skill-1');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-7', 'skill-6');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-7', 'skill-7');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-8', 'skill-4');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-8', 'skill-7');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-8', 'skill-17');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-9', 'skill-18');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-9', 'skill-10');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-9', 'skill-16');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-9', 'skill-14');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-10', 'skill-1');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-10', 'skill-13');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-10', 'skill-3');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-11', 'skill-17');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-11', 'skill-8');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-11', 'skill-20');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-12', 'skill-6');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-12', 'skill-16');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-12', 'skill-19');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-12', 'skill-20');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-13', 'skill-18');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-13', 'skill-15');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-13', 'skill-16');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-13', 'skill-6');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-14', 'skill-3');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-14', 'skill-7');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-14', 'skill-17');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-15', 'skill-13');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-15', 'skill-16');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-15', 'skill-20');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-16', 'skill-13');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-16', 'skill-17');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-16', 'skill-1');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-17', 'skill-7');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-17', 'skill-10');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-17', 'skill-17');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-17', 'skill-12');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-17', 'skill-1');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-18', 'skill-12');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-18', 'skill-15');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-18', 'skill-11');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-18', 'skill-13');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-18', 'skill-3');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-18', 'skill-6');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-19', 'skill-2');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-19', 'skill-15');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-19', 'skill-1');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-19', 'skill-8');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-19', 'skill-18');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-19', 'skill-7');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-20', 'skill-20');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-20', 'skill-3');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-20', 'skill-7');
INSERT INTO "consultant_skills" ("consultant_id", "skill_id") VALUES ('consultant-20', 'skill-18');

-- Consultant Goals
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-1', 'skill-1');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-2', 'skill-1');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-2', 'skill-13');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-3', 'skill-11');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-3', 'skill-17');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-3', 'skill-20');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-4', 'skill-20');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-4', 'skill-7');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-4', 'skill-3');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-5', 'skill-11');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-5', 'skill-7');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-6', 'skill-20');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-6', 'skill-18');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-7', 'skill-8');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-7', 'skill-2');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-8', 'skill-13');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-9', 'skill-2');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-10', 'skill-12');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-11', 'skill-10');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-11', 'skill-15');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-12', 'skill-5');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-12', 'skill-15');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-13', 'skill-13');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-13', 'skill-9');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-13', 'skill-10');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-14', 'skill-5');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-14', 'skill-16');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-15', 'skill-19');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-15', 'skill-3');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-16', 'skill-9');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-16', 'skill-3');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-17', 'skill-11');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-17', 'skill-9');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-18', 'skill-16');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-18', 'skill-4');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-18', 'skill-5');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-19', 'skill-20');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-20', 'skill-17');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-20', 'skill-2');
INSERT INTO "consultant_goals" ("consultant_id", "skill_id") VALUES ('consultant-20', 'skill-12');

-- Engagements
INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "is_bet", "created_at", "updated_at") VALUES ('engagement-1', 'Meridian Financial', 'Post-Merger Integration', '2026-03-23', '2026-04-13', 'completed', '#4F46E5', FALSE, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "is_bet", "created_at", "updated_at") VALUES ('engagement-2', 'Atlas Manufacturing', 'Supply Chain Transformation', '2026-03-30', '2026-04-27', 'active', '#0891B2', FALSE, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "is_bet", "created_at", "updated_at") VALUES ('engagement-3', 'Zenith Healthcare', 'Digital Patient Experience', '2026-04-06', '2026-05-18', 'active', '#059669', FALSE, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "is_bet", "created_at", "updated_at") VALUES ('engagement-4', 'Vanguard Retail', 'Omnichannel Strategy', '2026-04-13', '2026-06-08', 'upcoming', '#D97706', TRUE, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "is_bet", "created_at", "updated_at") VALUES ('engagement-5', 'Pinnacle Energy', 'Regulatory Compliance Review', '2026-03-16', '2026-04-20', 'at_risk', '#DC2626', FALSE, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "is_bet", "created_at", "updated_at") VALUES ('engagement-6', 'Horizon Telecom', 'Cost Optimization Program', '2026-04-20', '2026-06-29', 'upcoming', '#7C3AED', FALSE, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "is_bet", "created_at", "updated_at") VALUES ('engagement-7', 'Sterling Insurance', 'Agile Transformation', '2026-03-30', '2026-05-18', 'active', '#DB2777', FALSE, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "engagements" ("id", "client_name", "project_name", "start_date", "end_date", "status", "color", "is_bet", "created_at", "updated_at") VALUES ('engagement-8', 'Nova Pharmaceuticals', 'Market Entry Assessment', '2026-04-27', '2026-07-20', 'upcoming', '#2563EB', TRUE, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');

-- Engagement Skills
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-1', 'skill-8');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-1', 'skill-11');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-1', 'skill-16');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-2', 'skill-18');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-2', 'skill-8');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-2', 'skill-1');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-2', 'skill-10');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-2', 'skill-3');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-3', 'skill-14');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-3', 'skill-13');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-3', 'skill-3');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-4', 'skill-15');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-4', 'skill-6');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-4', 'skill-8');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-4', 'skill-20');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-5', 'skill-18');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-5', 'skill-1');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-5', 'skill-20');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-6', 'skill-20');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-6', 'skill-11');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-6', 'skill-18');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-7', 'skill-10');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-7', 'skill-19');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-7', 'skill-12');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-8', 'skill-10');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-8', 'skill-12');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-8', 'skill-9');
INSERT INTO "engagement_skills" ("engagement_id", "skill_id") VALUES ('engagement-8', 'skill-14');

-- Assignments
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-1', 'consultant-1', 'engagement-1', 'lead', '2026-03-23', '2026-04-13', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-2', 'consultant-3', 'engagement-1', 'manager', '2026-03-23', '2026-04-13', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-3', 'consultant-6', 'engagement-1', 'consultant', '2026-03-23', '2026-04-13', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-4', 'consultant-11', 'engagement-1', 'analyst', '2026-03-23', '2026-04-13', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-5', 'consultant-2', 'engagement-2', 'lead', '2026-03-30', '2026-04-27', 60, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-6', 'consultant-7', 'engagement-2', 'consultant', '2026-03-30', '2026-04-27', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-7', 'consultant-12', 'engagement-2', 'analyst', '2026-03-30', '2026-04-27', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-8', 'consultant-3', 'engagement-3', 'lead', '2026-04-06', '2026-05-18', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-9', 'consultant-8', 'engagement-3', 'manager', '2026-04-06', '2026-05-18', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-10', 'consultant-13', 'engagement-3', 'consultant', '2026-04-06', '2026-05-18', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-11', 'consultant-17', 'engagement-3', 'analyst', '2026-04-06', '2026-05-18', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-12', 'consultant-4', 'engagement-4', 'lead', '2026-04-13', '2026-06-08', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-13', 'consultant-9', 'engagement-4', 'manager', '2026-04-13', '2026-06-08', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-14', 'consultant-14', 'engagement-4', 'consultant', '2026-04-13', '2026-06-08', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-15', 'consultant-1', 'engagement-5', 'lead', '2026-03-16', '2026-04-20', 40, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-16', 'consultant-5', 'engagement-5', 'manager', '2026-03-16', '2026-04-20', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-17', 'consultant-10', 'engagement-5', 'consultant', '2026-03-16', '2026-04-20', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-18', 'consultant-15', 'engagement-5', 'consultant', '2026-03-16', '2026-04-20', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-19', 'consultant-18', 'engagement-5', 'analyst', '2026-03-16', '2026-04-20', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-20', 'consultant-2', 'engagement-6', 'lead', '2026-04-20', '2026-06-29', 40, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-21', 'consultant-8', 'engagement-6', 'consultant', '2026-04-20', '2026-06-29', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-22', 'consultant-19', 'engagement-6', 'analyst', '2026-04-20', '2026-06-29', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-23', 'consultant-4', 'engagement-7', 'manager', '2026-03-30', '2026-05-18', 60, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-24', 'consultant-10', 'engagement-7', 'consultant', '2026-03-30', '2026-05-18', 60, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-25', 'consultant-16', 'engagement-7', 'analyst', '2026-03-30', '2026-05-18', 60, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-26', 'consultant-5', 'engagement-8', 'lead', '2026-04-27', '2026-07-20', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "assignments" ("id", "consultant_id", "engagement_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('assignment-27', 'consultant-20', 'engagement-8', 'analyst', '2026-04-27', '2026-07-20', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');

-- Wellbeing Signals
INSERT INTO "wellbeing_signals" ("id", "consultant_id", "signal_type", "severity", "recorded_at", "created_at") VALUES ('signal-1', 'consultant-1', 'overwork', 'high', '2026-04-08', '2026-04-08T17:11:41.557Z');
INSERT INTO "wellbeing_signals" ("id", "consultant_id", "signal_type", "severity", "recorded_at", "created_at") VALUES ('signal-2', 'consultant-8', 'no_break', 'medium', '2026-04-08', '2026-04-08T17:11:41.557Z');
INSERT INTO "wellbeing_signals" ("id", "consultant_id", "signal_type", "severity", "recorded_at", "created_at") VALUES ('signal-3', 'consultant-2', 'weekend_work', 'medium', '2026-04-08', '2026-04-08T17:11:41.557Z');
INSERT INTO "wellbeing_signals" ("id", "consultant_id", "signal_type", "severity", "recorded_at", "created_at") VALUES ('signal-4', 'consultant-10', 'overwork', 'high', '2026-04-08', '2026-04-08T17:11:41.557Z');
INSERT INTO "wellbeing_signals" ("id", "consultant_id", "signal_type", "severity", "recorded_at", "created_at") VALUES ('signal-5', 'consultant-4', 'high_travel', 'low', '2026-04-08', '2026-04-08T17:11:41.557Z');
INSERT INTO "wellbeing_signals" ("id", "consultant_id", "signal_type", "severity", "recorded_at", "created_at") VALUES ('signal-6', 'consultant-3', 'overwork', 'high', '2026-04-08', '2026-04-08T17:11:41.557Z');

-- Opportunities
INSERT INTO "opportunities" ("id", "client_name", "project_name", "start_date", "end_date", "stage", "probability", "estimated_value", "color", "is_bet", "notes", "converted_engagement_id", "created_at", "updated_at") VALUES ('opportunity-1', 'Crestview Capital', 'Due Diligence — Series B Target', '2026-04-20', '2026-06-01', 'verbal_commit', 85, 420000, '#7C3AED', FALSE, NULL, NULL, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "opportunities" ("id", "client_name", "project_name", "start_date", "end_date", "stage", "probability", "estimated_value", "color", "is_bet", "notes", "converted_engagement_id", "created_at", "updated_at") VALUES ('opportunity-2', 'Orbit Logistics', 'Supply Chain Digitization', '2026-04-27', '2026-07-06', 'proposal_sent', 55, 680000, '#0891B2', TRUE, NULL, NULL, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "opportunities" ("id", "client_name", "project_name", "start_date", "end_date", "stage", "probability", "estimated_value", "color", "is_bet", "notes", "converted_engagement_id", "created_at", "updated_at") VALUES ('opportunity-3', 'Beacon Health Systems', 'Regulatory Readiness Program', '2026-05-04', '2026-06-29', 'qualifying', 35, 350000, '#059669', FALSE, NULL, NULL, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "opportunities" ("id", "client_name", "project_name", "start_date", "end_date", "stage", "probability", "estimated_value", "color", "is_bet", "notes", "converted_engagement_id", "created_at", "updated_at") VALUES ('opportunity-4', 'Apex Consumer Group', 'Customer Experience Redesign', '2026-05-18', '2026-08-10', 'identified', 20, NULL, '#D97706', TRUE, NULL, NULL, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "opportunities" ("id", "client_name", "project_name", "start_date", "end_date", "stage", "probability", "estimated_value", "color", "is_bet", "notes", "converted_engagement_id", "created_at", "updated_at") VALUES ('opportunity-5', 'Titanium Manufacturing', 'Cost Optimization Phase 2', '2026-04-13', '2026-06-08', 'proposal_sent', 60, 520000, '#DC2626', FALSE, NULL, NULL, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');

-- Opportunity Skills
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-1', 'skill-4');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-1', 'skill-1');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-1', 'skill-8');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-2', 'skill-10');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-2', 'skill-6');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-2', 'skill-5');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-3', 'skill-16');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-3', 'skill-9');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-3', 'skill-2');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-4', 'skill-18');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-4', 'skill-3');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-4', 'skill-6');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-5', 'skill-12');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-5', 'skill-5');
INSERT INTO "opportunity_skills" ("opportunity_id", "skill_id") VALUES ('opportunity-5', 'skill-1');

-- Scenarios
INSERT INTO "scenarios" ("id", "opportunity_id", "name", "is_default", "fit_score", "burnout_impact", "created_at") VALUES ('scenario-1-default', 'opportunity-1', 'Primary Team', TRUE, NULL, NULL, '2026-04-08T17:11:41.557Z');
INSERT INTO "scenarios" ("id", "opportunity_id", "name", "is_default", "fit_score", "burnout_impact", "created_at") VALUES ('scenario-1-lean', 'opportunity-1', 'Lean Team', FALSE, NULL, NULL, '2026-04-08T17:11:41.557Z');
INSERT INTO "scenarios" ("id", "opportunity_id", "name", "is_default", "fit_score", "burnout_impact", "created_at") VALUES ('scenario-2-default', 'opportunity-2', 'Primary Team', TRUE, NULL, NULL, '2026-04-08T17:11:41.557Z');
INSERT INTO "scenarios" ("id", "opportunity_id", "name", "is_default", "fit_score", "burnout_impact", "created_at") VALUES ('scenario-2-lean', 'opportunity-2', 'Lean Team', FALSE, NULL, NULL, '2026-04-08T17:11:41.557Z');
INSERT INTO "scenarios" ("id", "opportunity_id", "name", "is_default", "fit_score", "burnout_impact", "created_at") VALUES ('scenario-3-default', 'opportunity-3', 'Primary Team', TRUE, NULL, NULL, '2026-04-08T17:11:41.557Z');
INSERT INTO "scenarios" ("id", "opportunity_id", "name", "is_default", "fit_score", "burnout_impact", "created_at") VALUES ('scenario-4-default', 'opportunity-4', 'Primary Team', TRUE, NULL, NULL, '2026-04-08T17:11:41.557Z');
INSERT INTO "scenarios" ("id", "opportunity_id", "name", "is_default", "fit_score", "burnout_impact", "created_at") VALUES ('scenario-5-default', 'opportunity-5', 'Primary Team', TRUE, NULL, NULL, '2026-04-08T17:11:41.557Z');

-- Tentative Assignments
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-1-1', 'scenario-1-default', 'consultant-1', 'lead', '2026-04-20', '2026-06-01', 60, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-1-2', 'scenario-1-default', 'consultant-6', 'manager', '2026-04-20', '2026-06-01', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-1-3', 'scenario-1-default', 'consultant-13', 'consultant', '2026-04-20', '2026-06-01', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-1-4', 'scenario-1-default', 'consultant-17', 'analyst', '2026-04-20', '2026-06-01', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-alt-1-1', 'scenario-1-lean', 'consultant-1', 'lead', '2026-04-20', '2026-06-01', 40, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-alt-1-2', 'scenario-1-lean', 'consultant-13', 'consultant', '2026-04-20', '2026-06-01', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-alt-1-3', 'scenario-1-lean', 'consultant-17', 'analyst', '2026-04-20', '2026-06-01', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-2-1', 'scenario-2-default', 'consultant-2', 'lead', '2026-04-27', '2026-07-06', 40, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-2-2', 'scenario-2-default', 'consultant-8', 'manager', '2026-04-27', '2026-07-06', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-2-3', 'scenario-2-default', 'consultant-12', 'consultant', '2026-04-27', '2026-07-06', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-2-4', 'scenario-2-default', 'consultant-16', 'analyst', '2026-04-27', '2026-07-06', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-alt-2-1', 'scenario-2-lean', 'consultant-2', 'lead', '2026-04-27', '2026-07-06', 40, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-alt-2-2', 'scenario-2-lean', 'consultant-12', 'consultant', '2026-04-27', '2026-07-06', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-3-1', 'scenario-3-default', 'consultant-5', 'lead', '2026-05-04', '2026-06-29', 60, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-3-2', 'scenario-3-default', 'consultant-10', 'consultant', '2026-05-04', '2026-06-29', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-3-3', 'scenario-3-default', 'consultant-18', 'analyst', '2026-05-04', '2026-06-29', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-4-1', 'scenario-4-default', 'consultant-3', 'lead', '2026-05-18', '2026-08-10', 40, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-4-2', 'scenario-4-default', 'consultant-14', 'consultant', '2026-05-18', '2026-08-10', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-5-1', 'scenario-5-default', 'consultant-4', 'lead', '2026-04-13', '2026-06-08', 60, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-5-2', 'scenario-5-default', 'consultant-7', 'manager', '2026-04-13', '2026-06-08', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-5-3', 'scenario-5-default', 'consultant-15', 'consultant', '2026-04-13', '2026-06-08', 100, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');
INSERT INTO "tentative_assignments" ("id", "scenario_id", "consultant_id", "role", "start_date", "end_date", "allocation_percentage", "created_at", "updated_at") VALUES ('tentative-5-4', 'scenario-5-default', 'consultant-19', 'analyst', '2026-04-13', '2026-06-08', 80, '2026-04-08T17:11:41.557Z', '2026-04-08T17:11:41.557Z');

COMMIT;

-- Done! Check your tables in Supabase Table Editor.
