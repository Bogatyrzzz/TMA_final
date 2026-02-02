-- LifeQuest Hero Database Schema for Supabase
-- Version 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tg_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    language_code TEXT DEFAULT 'en',
    
    -- Onboarding data
    age INTEGER,
    gender TEXT,
    avatar_url TEXT,
    selfie_url TEXT,
    
    -- Active branches (free: 1, PRO: multiple)
    active_branches TEXT[] DEFAULT ARRAY['power'],
    is_pro BOOLEAN DEFAULT FALSE,
    pro_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Stats (6 parameters)
    strength INTEGER DEFAULT 1,
    health INTEGER DEFAULT 1,
    intellect INTEGER DEFAULT 1,
    agility INTEGER DEFAULT 1,
    confidence INTEGER DEFAULT 1,
    stability INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Level and XP
    current_level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    next_level_xp INTEGER DEFAULT 100,
    total_xp INTEGER DEFAULT 0,
    
    -- Goal tracking
    goal_text TEXT,
    goal_level INTEGER DEFAULT 10,
    goal_progress INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_text TEXT,
    goal_level INTEGER DEFAULT 10,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quests table (templates)
CREATE TABLE IF NOT EXISTS quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    branch TEXT NOT NULL, -- 'power', 'stability', 'longevity', 'global'
    xp_reward INTEGER DEFAULT 20,
    category TEXT, -- 'daily', 'global'
    
    -- Quest type
    is_daily BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User quest completions
CREATE TABLE IF NOT EXISTS user_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
    
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date DATE DEFAULT CURRENT_DATE,
    
    -- For tracking streaks
    is_today BOOLEAN DEFAULT TRUE,
    
    UNIQUE(user_id, quest_id, completion_date)
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    transaction_type TEXT NOT NULL, -- 'pro_subscription', 'boost', etc
    stars_amount INTEGER NOT NULL,
    telegram_payment_charge_id TEXT,
    
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Avatar generation history
CREATE TABLE IF NOT EXISTS avatar_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    level INTEGER,
    prompt TEXT,
    avatar_url TEXT,
    generation_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tg_id ON users(tg_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_date ON user_quests(completion_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_generations_user_id ON avatar_generations(user_id);

-- Create analytics view for DAU
CREATE OR REPLACE VIEW analytics_dau AS
SELECT 
    DATE(last_active_at) as date,
    COUNT(DISTINCT id) as active_users
FROM users
WHERE last_active_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(last_active_at)
ORDER BY date DESC;

-- Function to add XP and check for level up
CREATE OR REPLACE FUNCTION add_xp_and_check_level(
    p_user_id UUID,
    p_xp_amount INTEGER
) RETURNS TABLE (
    leveled_up BOOLEAN,
    new_level INTEGER,
    new_xp INTEGER
) AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_next_level_xp INTEGER;
    v_leveled_up BOOLEAN := FALSE;
BEGIN
    -- Get current progress
    SELECT current_xp, current_level, next_level_xp
    INTO v_current_xp, v_current_level, v_next_level_xp
    FROM progress
    WHERE user_id = p_user_id;
    
    -- Add XP
    v_current_xp := v_current_xp + p_xp_amount;
    
    -- Check for level up
    WHILE v_current_xp >= v_next_level_xp LOOP
        v_current_xp := v_current_xp - v_next_level_xp;
        v_current_level := v_current_level + 1;
        v_next_level_xp := FLOOR(100 * POWER(1.05, v_current_level - 1));
        v_leveled_up := TRUE;
    END LOOP;
    
    -- Update progress
    UPDATE progress
    SET 
        current_xp = v_current_xp,
        current_level = v_current_level,
        next_level_xp = v_next_level_xp,
        total_xp = total_xp + p_xp_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT v_leveled_up, v_current_level, v_current_xp;
END;
$$ LANGUAGE plpgsql;

-- Function to update stats on level up
CREATE OR REPLACE FUNCTION update_stats_on_levelup(
    p_user_id UUID,
    p_branches TEXT[]
) RETURNS VOID AS $$
DECLARE
    v_branch TEXT;
BEGIN
    -- Base +1 to all stats
    UPDATE users
    SET
        strength = strength + 1,
        health = health + 1,
        intellect = intellect + 1,
        agility = agility + 1,
        confidence = confidence + 1,
        stability = stability + 1,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    -- Branch bonuses
    FOREACH v_branch IN ARRAY p_branches
    LOOP
        CASE v_branch
            WHEN 'power' THEN
                UPDATE users
                SET strength = strength + 2, confidence = confidence + 1
                WHERE id = p_user_id;
            WHEN 'stability' THEN
                UPDATE users
                SET stability = stability + 2, intellect = intellect + 1
                WHERE id = p_user_id;
            WHEN 'longevity' THEN
                UPDATE users
                SET health = health + 2, agility = agility + 1
                WHERE id = p_user_id;
        END CASE;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (для Telegram ID авторизации)
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (tg_id = current_setting('app.current_tg_id', true)::BIGINT);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (tg_id = current_setting('app.current_tg_id', true)::BIGINT);

-- Insert default quests
INSERT INTO quests (title, description, branch, xp_reward, category, is_daily, sort_order) VALUES
-- Power branch quests
('💪 Сделай 20 отжиманий', 'Прокачай силу и выносливость', 'power', 20, 'daily', true, 1),
('🏃 Пробеги 2 км', 'Кардио для силы духа', 'power', 25, 'daily', true, 2),
('🥊 5 минут бокса', 'Тренируй реакцию и силу удара', 'power', 20, 'daily', true, 3),
('🏋️ Силовая тренировка', 'Подход упражнений на все группы мышц', 'power', 30, 'daily', true, 4),
('🧘 Растяжка 10 минут', 'Гибкость - основа силы', 'power', 15, 'daily', true, 5),

-- Stability branch quests
('📚 Прочитай 10 страниц', 'Развивай интеллект каждый день', 'stability', 20, 'daily', true, 6),
('💼 2 часа продуктивной работы', 'Без отвлечений и соцсетей', 'stability', 30, 'daily', true, 7),
('🧘‍♂️ Медитация 15 минут', 'Успокой ум и найди баланс', 'stability', 25, 'daily', true, 8),
('📝 Запланируй завтрашний день', 'Стабильность начинается с плана', 'stability', 15, 'daily', true, 9),
('🎓 Изучи что-то новое', 'Онлайн курс, статья или видео', 'stability', 25, 'daily', true, 10),

-- Longevity branch quests
('🥗 Здоровый завтрак', 'Начни день с правильной еды', 'longevity', 20, 'daily', true, 11),
('💧 Выпей 2 литра воды', 'Гидратация - основа здоровья', 'longevity', 15, 'daily', true, 12),
('😴 8 часов сна', 'Легай вовремя, восстанавливайся', 'longevity', 25, 'daily', true, 13),
('🚶 10 000 шагов', 'Активность продлевает жизнь', 'longevity', 20, 'daily', true, 14),
('🧘 Йога 20 минут', 'Гибкость тела и духа', 'longevity', 25, 'daily', true, 15),

-- Global quests (for all branches)
('⭐ Выполни все daily квесты', 'Бонус +20% XP за полное выполнение', 'global', 50, 'daily', true, 16),
('🎯 Сделай шаг к цели', 'Любое действие в сторону твоей мечты', 'global', 30, 'daily', true, 17),
('🌟 Помоги кому-то', 'Доброе дело делает тебя сильнее', 'global', 25, 'daily', true, 18),
('📱 Без соцсетей 3 часа', 'Освободи время для себя', 'global', 30, 'daily', true, 19),
('💪 Выйди из зоны комфорта', 'Сделай то, что давно откладывал', 'global', 40, 'daily', true, 20)
ON CONFLICT DO NOTHING;
