"""
LifeQuest Hero Telegram Bot
Handles Mini App launch and daily reminders
"""
import os
import asyncio
import logging
from datetime import time
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp
from telegram.ext import Application, CommandHandler, ContextTypes
from dotenv import load_dotenv
from pathlib import Path
from supabase_client import get_supabase

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration
TELEGRAM_BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
WEB_APP_URL = os.environ.get('WEB_APP_URL')

supabase = get_supabase()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start command"""
    user = update.effective_user
    
    if not WEB_APP_URL:
        await update.message.reply_text("WEB_APP_URL не настроен")
        return

    # Create inline keyboard with Mini App
    keyboard = [
        [InlineKeyboardButton(
            "🦸 Запустить LifeQuest Hero",
            web_app=WebAppInfo(url=WEB_APP_URL)
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    welcome_message = (
        f"🎮 Привет, {user.first_name}!\n\n"
        "Добро пожаловать в **LifeQuest Hero** — приложение для геймификации твоей жизни!\n\n"
        "💪 Создай своего AI-героя\n"
        "⭐ Выполняй квесты и прокачивайся\n"
        "🎯 Достигай реальных целей\n\n"
        "Нажми кнопку ниже, чтобы начать своё приключение! 👇"
    )
    
    await update.message.reply_text(
        welcome_message,
        parse_mode='Markdown',
        reply_markup=reply_markup
    )

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command"""
    help_text = (
        "📚 *Команды LifeQuest Hero:*\n\n"
        "/start - Запустить приложение\n"
        "/help - Показать эту справку\n"
        "/stats - Твоя статистика\n\n"
        "❓ *Как играть:*\n"
        "1. Создай своего AI-героя из селфи\n"
        "2. Выбери ветку развития (Сила, Стабильность, Долголетие)\n"
        "3. Выполняй ежедневные квесты\n"
        "4. Прокачивай уровень и характеристики\n"
        "5. Достигай своих целей!\n\n"
        "🌟 PRO-подписка открывает все ветки развития!"
    )
    
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show user stats"""
    user = update.effective_user
    
    try:
        # Get user from database
        result = supabase.table('users').select('*').eq('tg_id', user.id).execute()
        
        if not result.data:
            await update.message.reply_text(
                "❌ Ты ещё не зарегистрирован! Нажми /start чтобы начать."
            )
            return
        
        user_data = result.data[0]
        
        # Get progress
        progress_result = supabase.table('progress').select('*').eq('user_id', user_data['id']).execute()
        progress = progress_result.data[0] if progress_result.data else {}
        
        stats_text = (
            f"📊 *Статистика {user_data.get('first_name', 'Героя')}*\n\n"
            f"⭐ Уровень: {progress.get('current_level', 1)}\n"
            f"✨ XP: {progress.get('current_xp', 0)}/{progress.get('next_level_xp', 100)}\n"
            f"💎 Всего XP: {progress.get('total_xp', 0)}\n\n"
            "💪 *Характеристики:*\n"
            f"Сила: {user_data.get('strength', 1)}\n"
            f"Здоровье: {user_data.get('health', 1)}\n"
            f"Интеллект: {user_data.get('intellect', 1)}\n"
            f"Ловкость: {user_data.get('agility', 1)}\n"
            f"Уверенность: {user_data.get('confidence', 1)}\n"
            f"Стабильность: {user_data.get('stability', 1)}\n\n"
            f"🌳 Активные ветки: {', '.join(user_data.get('active_branches', ['power']))}\n"
            f"{'🌟 PRO активен!' if user_data.get('is_pro') else ''}\n\n"
            f"🎯 Цель: {progress.get('goal_text', 'Не установлена')}"
        )
        
        await update.message.reply_text(stats_text, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        await update.message.reply_text(
            "❌ Ошибка при получении статистики. Попробуй позже."
        )

async def send_daily_reminders(context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send daily quest reminders to all active users"""
    try:
        # Get all users active in last 7 days
        from datetime import datetime, timedelta
        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        
        result = supabase.table('users').select('tg_id, first_name').gte('last_active_at', week_ago).execute()
        
        if not result.data:
            logger.info("No active users found")
            return
        
        reminder_text = (
            "🌅 *Доброе утро, Герой!*\n\n"
            "💪 Новые квесты уже ждут тебя!\n"
            "🎯 Сегодня отличный день для прокачки!\n\n"
            "Открой приложение и начни свой путь к цели! 🚀"
        )
        
        sent_count = 0
        for user in result.data:
            try:
                await context.bot.send_message(
                    chat_id=user['tg_id'],
                    text=reminder_text,
                    parse_mode='Markdown'
                )
                sent_count += 1
                await asyncio.sleep(0.1)  # Rate limiting
            except Exception as e:
                logger.error(f"Error sending reminder to {user['tg_id']}: {e}")
        
        logger.info(f"Daily reminders sent to {sent_count} users")
        
    except Exception as e:
        logger.error(f"Error sending daily reminders: {e}")

def main() -> None:
    """Start the bot"""
    # Create application
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("stats", stats_command))
    
    # Schedule daily reminders (9 AM UTC)
    job_queue = application.job_queue
    job_queue.run_daily(
        send_daily_reminders,
        time=time(hour=9, minute=0),  # 9 AM UTC
        name="daily_reminders"
    )
    
    logger.info("Bot started...")
    
    # Start the bot
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
