const colors = require('colors')
const { Telegraf, Markup, session } = require('telegraf')
const { parseSchedule, findSchedule } = require('./parseSchedule')

const jsonData = require('./schedule.json');

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(Telegraf.log())
bot.use(session());

const schedule = parseSchedule(jsonData);
// console.log(JSON.stringify(schedule.items.splice(0, 2), null, 4))

bot.help((ctx) => ctx.reply('Напиши /start'));

bot.start((ctx) => {
    ctx.reply('Привет, я могу показать тебе расписание занятий протвинского филиала университета Дубна');

    const keyboard = schedule.groups.map(group => ({
        text: `${group}`,
        callback_data: `${group}`
    }));

    return ctx.reply('Для какой группы ты хочешь получить расписание?', Markup.inlineKeyboard(keyboard, {
        wrap: (btn, index, currentRow) => currentRow.length > 3
    }));
})

// Hears lesson group
bot.on('callback_query', (ctx, next) => {
    if (schedule.groups.includes(ctx.callbackQuery.data)) {
        ctx.session = {
            lessonGroup: ctx.callbackQuery.data,
        };

        const keyboard = schedule.dates.map(date => ({
            text: `${date.substring(0, 5)}`,
            callback_data: `${date}`
        }));

        return ctx.reply('А на какую дату?', Markup.inlineKeyboard(keyboard, {
            wrap: (btn, index, currentRow) => currentRow.length > 4
        }));
    }

    next()
})

const scheduleDayMessageTemplate = ({date, group, items}) => `
📆 ${date} (${group})\n
${items.length ? items.map(item => `- ${item.lesson}`).join('\n') : '- нет пар'}
`;

const dateRegexp = /^(0[1-9]|[12]\d|3[01]).(0[1-9]|1[0-2]).(19|20)\d{2}$/gm;

// Hears date
bot.on('callback_query', (ctx, next) => {
    if (dateRegexp.test(ctx.callbackQuery.data)) {
        let { lessonGroup } = ctx.session
        if (!lessonGroup) return false;
        let data = findSchedule(schedule, ctx.callbackQuery.data, lessonGroup);
        let layout = scheduleDayMessageTemplate(data);

        return ctx.replyWithMarkdown(layout);
    }
    next();
})

bot.launch().then(() => console.log(colors.blue('Server is running 🚀')));
