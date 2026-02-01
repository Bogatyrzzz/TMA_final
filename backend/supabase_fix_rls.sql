-- Временно отключаем RLS для тестирования
-- ВАЖНО: В production нужно настроить правильные политики!

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_quests DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_generations DISABLE ROW LEVEL SECURITY;

-- Или создадим публичные политики для тестирования:

-- Политика для чтения всех пользователей
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);

-- Политика для прогресса
DROP POLICY IF EXISTS "Users can view own progress" ON progress;
CREATE POLICY "Allow all access to progress" ON progress FOR ALL USING (true);

-- Политика для квестов
CREATE POLICY "Allow all access to user_quests" ON user_quests FOR ALL USING (true);

-- Политика для транзакций
CREATE POLICY "Allow all access to transactions" ON transactions FOR ALL USING (true);

-- Политика для генерации аватаров
CREATE POLICY "Allow all access to avatar_generations" ON avatar_generations FOR ALL USING (true);
