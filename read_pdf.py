import camelot
from json import loads
from json import dump

# Парсим pdf таблицы
tables = camelot.read_pdf('schedule.pdf', line_scale=80, pages='all')

# Получаем таблицы в json формате
data = []
for table in tables:
    json_table = loads(table.df.to_json(orient='records'))
    data.append(json_table)

# Объединяем все таблицы в один json и записываем в файл
with open('schedule.json', 'w') as json_out:
    dump(data, json_out)
