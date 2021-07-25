const colors = require('colors')
const { Telegraf, Markup, session } = require('telegraf')
const { parseSchedule, findSchedule } = require('./parseSchedule')

const jsonData = require('./schedule.json');

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(Telegraf.log())
bot.use(session());

// Парсим JSON расписание
const schedule = parseSchedule(jsonData);

// Запрашиваем нужную группу у пользователя
const askGroup = (ctx, groups) => {
    const keyboard = groups.map(group => ({
        text: `${group}`,
        callback_data: `${group}`
    }));

    return ctx.reply('Для какой группы ты хочешь получить расписание?', Markup.inlineKeyboard(keyboard, {
        wrap: (btn, index, currentRow) => currentRow.length > 3
    }));
}

// Подсказка по началу работы с ботом
bot.help((ctx) => ctx.reply('Напиши /start'));

// Обработка команды /start
bot.start(async (ctx) => {
    await ctx.reply('Привет, я могу показать тебе расписание занятий/экзаменов протвинского филиала университета Дубна')
    await askGroup(ctx, schedule.groups);
})

// Шаблон сообщения
const scheduleDayMessageTemplate = ({items}) => `
${items.length ? items.map(item => `- ${item.lesson}`).join('\n') : '- нет пар'}
`;

// Регулярное выражение для определения даты
const dateRegexp = /^(0[1-9]|[12]\d|3[01]).(0[1-9]|1[0-2]).(19|20)\d{2}$/gm;

bot.on('callback_query', async (ctx, next) => {
    const query = ctx.callbackQuery.data;

    // Обрабатываем выбранную группу
    if (schedule.groups.includes(query)) {
        ctx.session = {
            lessonGroup: query,
        };

        const keyboard = schedule.dates.map(date => ({
            text: `${date.substring(0, 5)}`,
            callback_data: `${date}`
        }));

        await ctx.editMessageText(`👥 ${query}`)

        return await ctx.reply('А на какую дату?', Markup.inlineKeyboard(keyboard, {
            wrap: (btn, index, currentRow) => currentRow.length > 4
        }));
    }

    // Обрабатываем выбранную дату
    if (dateRegexp.test(query)) {
        let { lessonGroup } = ctx.session
        if (!lessonGroup) return false;
        let data = findSchedule(schedule, query, lessonGroup);
        let layout = scheduleDayMessageTemplate(data);

        ctx.editMessageText(`📆 ${query}`)
        ctx.editMessageReplyMarkup({});

        return ctx.replyWithMarkdown(layout, Markup.inlineKeyboard([
            { text: 'Выбрать другую группу/дату', callback_data: 'ask_group' }
        ]));
    }

    if (query === 'ask_group') {
        await ctx.editMessageReplyMarkup({});
        return await askGroup(ctx, schedule.groups);
    }

    next()
})

bot.launch().then(() => console.log(colors.blue('Server is running 🚀')));
