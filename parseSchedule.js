const moment = require('moment');

const clearDate = (date) => date.replace(/[^0-9.]/g, '');
const clearText = (text) => text.replace(/[\\n]/g, '').replace(/\s{2,}/g, ' ').trim();

const getAllGroups = (data) => data.flatMap((table) => {
    let groups = Object.values(table[0]);
    groups.splice(0, 2);
    return groups;
})

const getAllDates = (data) => {
    const dates = data
      .map((item) => clearDate(item.date))
      .filter((date) => date)
      .sort((a, b) => moment(a, 'DD.MM.YYYY') - moment(b, 'DD.MM.YYYY'));

    return [...new Set(dates)];
}

const parseSchedule = (data) => {
    const items = data.flatMap((table) => {
        let groups = Object.values(table[0]);
        groups.splice(0, 2);

        return table.reduce((acc, row, index) => {
            if (index > 0) {
                const date = row[0];
                let lessons = Object.values(row);
                lessons.splice(0, 2);

                lessons.map((lesson, lessonIndex) => {
                    if (date && lesson) {
                        acc.push({
                            date: clearDate(date),
                            group: groups[lessonIndex],
                            lesson: clearText(lesson),
                        });
                    }
                })
            }
            return acc;
        }, [])
    })

    return {
        groups: getAllGroups(data),
        dates: getAllDates(items),
        items: items,
    }
}

const findSchedule = (data, date, group) => {
    if (!date || !group) {
        return null;
    }

    const matches = data.items.filter((item) => item.date === date && item.group === group)

    return {
        group,
        date,
        items: matches,
    };
}

module.exports = {
    parseSchedule,
    findSchedule,
};
