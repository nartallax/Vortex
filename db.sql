/*
	===== ВТОРИЧНЫЕ СУЩНОСТИ =====
*/
/* заметки, самые разные.
	почти для каждого объекта базы можно создать заметку */
drop table if exists notes cascade;
create table notes(
	id serial primary key,
	
	value text not null
);

/* информация, с помощью которой идентифицируются сущности при сборе 
	такая информация должна быть у каждого собираемого объекта */
drop table if exists looting_info cascade;
create table looting_info(
	id serial primary key,
	
	value varchar(255) not null, /* собственно информация */
	is_regexp boolean /* расценивать ли информацию как регулярное выражение или как литерал */
);

/*
	===== РАСПИСАНИЕНЕЗАВИСИМЫЕ ПЕРВИЧНЫЕ СУЩНОСТИ =====
*/
/* преподы */
drop table if exists lectors cascade;
create table lectors(
	id serial primary key,
	
	name varchar(255) not null,
	surname varchar(255),
	patronym varchar(255),
	password char(128), /* пароль - для предложения изменений от имени; хеш */
	salt char(128), /* соль для пароля; хеш */
	is_external boolean default false,
	wage_rate float not null default 1.0,
	
	note int references notes(id) on delete set null,
	looting_info int references looting_info(id) on delete set null
);

/* учебные группы */
drop table if exists cohorts cascade;
create table cohorts(
	id serial primary key,
	
	name varchar(255) not null,
	disciples int not null, /* количество учеников. почему именно disciples? так эпичнее */
	is_external boolean default false,
	
	note int references notes(id) on delete set null,
	looting_info int references looting_info(id) on delete set null
);

/* учебный корпус */
drop table if exists buildings cascade;
create table buildings(
	id serial primary key,
	
	name varchar(255) not null,
	is_external boolean default false,
	
	note int references notes(id) on delete set null,
	looting_info int references looting_info(id) on delete set null
);

/* учебная аудитория */
drop table if exists rooms cascade;
create table rooms(
	id serial primary key,
	
	name varchar(255) not null,
	space int not null, /* вместительность аудитории */
	is_external boolean default false,
	is_common boolean default false, /* общая ли аудитория - можно ли ее использовать, если она пуста */
	
	building int references buildings(id) on delete cascade,
	note int references notes(id) on delete set null,
	looting_info int references looting_info(id) on delete set null
);

/* учебные предметы */
drop table if exists subjects cascade;
create table subjects(
	id serial primary key,
	
	name varchar(255) not null,
	is_external boolean default false,
	
	note int references notes(id) on delete set null,
	looting_info int references looting_info(id) on delete set null
);

/* учебные планы */
drop table if exists curriculums cascade;
create table curriculums(
	id serial primary key,
	
	lab int not null, /* количество учебных часов */
	lec int not null, /* возможно, стоило сделать их перечисление отдельной таблицей... впрочем, неважно */
	prk int not null,
	srs int not null,
	etc int not null,

	note int references notes(id) on delete set null,
	subject int references subjects(id) on delete cascade
);

/* тип оборудования */
drop table if exists gear_types cascade;
create table gear_types(
	id serial primary key,
	
	name varchar(255) not null,
	
	note int references notes(id) on delete set null
);

/* слоты расписания */
drop table if exists slots cascade;
create table slots(
	id serial primary key,
	
	start_time int not null, /* время начала промежутка, в секундах, 
		где 0 - полночь понедельника четной недели (минимум), 
		1 209 599 - 23:59:59 воскресенья нечетной недели (максимум) */
	duration int not null, /* продолжительность, также в секундах */
	is_external boolean default false,
	
	note int references notes(id) on delete set null
);

/*
	===== РАСПИСАНИЕНЕЗАВИСИМЫЕ ВТОРИЧНЫЕ СУЩНОСТИ =====
*/

/* оборудование в наличии */
drop table if exists gears_in_rooms cascade;
create table gears_in_rooms(
	amount int not null, /* количество этого самого оборудования */
	
	room int references rooms(id) on delete set null, /* аудитория, к которой это оборудование прикреплено. 
		может не быть такой аудитории - тогда оборудование считается свободноперемещаемым, т.е. может использоваться в любой аудитории */
	type int references gear_types(id) on delete cascade
);

/* какое оборудование необходимо для каких учебных предметов */
drop table if exists gears_for_subjects cascade;
create table gears_for_subjects(
	amount int not null, /* сколько нужно оборудования */
	unit_type int not null, /* нужно amount этого оборудования на группу/ученика/пару: 0/1/2 */
	
	type int references gear_types(id) on delete cascade,
	subject int references subjects(id) on delete cascade
);

/*
	===== РАСПИСАНИЕЗАВИСИМЫЕ ПЕРВИЧНЫЕ СУЩНОСТИ =====
*/

/* инстансы расписания 
	подразумевается, что расписаний в системе единовременно может быть несколько, например, по одному на семестр
	все расписания опираются на общие данные о преподах, группах, аудиториях, слотах, оборудовании и тд */
drop table if exists schedules cascade;
create table schedules(
	id serial primary key,
	
	creation_date bigint not null default extract('epoch' from CURRENT_TIMESTAMP)::bigint, /* actually, timestamp */
	duration int not null, /* продолжительность в неделях - нужно для подсчета исполнения/неисполнения раб.планов */
	name varchar(255) not null,
	is_main boolean not null, /* главное ли расписание - показывается не только администратору системы */
	is_editable boolean not null, /* возможно ли редактирование расписания напрямую (true) или через changeset'ы (false) */
	
	note int references notes(id) on delete set null
);

/*
	===== РАСПИСАНИЕЗАВИСИМЫЕ ВТОРИЧНЫЕ СУЩНОСТИ =====
*/

/* предпочтения преподавателей */
drop table if exists preferences cascade;
create table preferences(
	type int not null,
	item_a int,
	item_b int,
	item_c int,
	item_d int,
	
	lector int references lectors(id) on delete cascade,
	schedule int references schedules(id) on delete cascade
);

/* какие группы занимаются по каким планам в этом расписании 
	нужно для учета количества часов */
drop table if exists curriculums_for_cohorts cascade;
create table curriculums_for_cohorts(
	curriculum int references curriculums(id) on delete cascade,
	cohort int references cohorts(id) on delete cascade,
	schedule int references schedules(id) on delete cascade
);

/* слоты, на которых у преподов/групп/аудиторий есть какие-либо предпочтения */
drop table if exists preconceived_lectors_slots cascade;
create table preconceived_lectors_slots(
	lector int references lectors(id) on delete cascade,
	slot int references slots(id) on delete cascade,
	value int not null, /* negative value for negative desire, positive for positive */
	schedule int references schedules(id) on delete cascade
);

drop table if exists preconceived_cohorts_slots cascade;
create table preconceived_cohorts_slots (
	cohort int references cohorts(id) on delete cascade,
	slot int references slots(id) on delete cascade,
	value int not null,
	schedule int references schedules(id) on delete cascade
);

drop table if exists preconceived_rooms_slots cascade;
create table preconceived_rooms_slots (
	room int references rooms(id) on delete cascade,
	slot int references slots(id) on delete cascade,
	value int not null,
	schedule int references schedules(id) on delete cascade
);

/* пары */
drop table if exists lessons cascade;
create table lessons(
	id serial primary key,

	type int not null, /* считать ли эту пару как пару лабы/лекции/практики/срс/прочего (0/1/2/3/4) */
	
	lector int references lectors(id) on delete set null,
	room int references rooms(id) on delete set null,
	subject int references subjects(id) on delete cascade,
	slot int references slots(id) on delete set null,	
	schedule int references schedules(id) on delete cascade,
	note int references notes(id) on delete set null
);

/* группы, которые должны прийти на пары 
	подразумевается, что на пару может прийти более одной группы */
drop table if exists cohorts_on_lessons cascade;
create table cohorts_on_lessons(
	rate float not null, /* доля людей, которые должны прийти на эту пару из этой группы, от 0 (=0%) до 1 (=100%)*/

	cohort int references cohorts(id) on delete cascade,
	lesson int references lessons(id) on delete cascade,
	note int references notes(id) on delete set null
);

/* события (одноразовые встречи и т.п.) */
drop table if exists events cascade;
create table events (
	id serial primary key,
	
	name varchar[255] not null,
	time_start bigint not null,
	time_end bigint not null,
	
	schedule int references schedules(id) on delete cascade,
	note int references notes(id) on delete set null
);

/* наборы изменений */
drop table if exists changesets cascade;
create table changesets(
	id serial primary key,
	
	application_date int not null, /* день с начала ввода расписания, в котором начинает действовать данное изменение */
	is_external boolean not null, /* загружен ли из внешнего источника */
	is_published boolean not null, /* видим ли набор изменений непосвященным */
	
	schedule int references schedules(id) on delete cascade,
	note int references notes(id) on delete set null
);

/* изменения */
drop table if exists changes cascade;
create table changes(
	id serial primary key,
	
	type int not null, /* тип изменения (поле, которое изменилось) */
	target int references lessons(id) on delete cascade,
	subtarget int, /* some additional data, usually cohort */
	old_value int, /* old and new value of selected property */
	new_value int,
	other_data varchar(255), /* not oftenly used */
	
	changeset int references changesets(id) on delete cascade,
	proposer int references lectors(id) on delete cascade, /* автор предложения */
	creation_date bigint not null default extract('epoch' from CURRENT_TIMESTAMP)::bigint, /* дата внесения предложения */
	note int references notes(id) on delete set null
);

/*
	===== ТАБЛИЦЫ ХРАНЕНИЯ СОБРАННЫХ ДАННЫХ =====
*/

/* одна итерация сбора */
drop table if exists looting_sessions cascade;
create table looting_sessions(
	id serial primary key,
	
	looting_start bigint not null default extract('epoch' from CURRENT_TIMESTAMP)::bigint,
	looting_end bigint default extract('epoch' from CURRENT_TIMESTAMP)::bigint,
	unprocessed_data text, /* any unprocessed data: not loaded URLs etc. if null - looting is ended */
	
	note int references notes(id) on delete set null
);

/* кусочки собранных данных
	подразумевается, что эти кусочки еще не парсились, т.е. хранятся "как на источнике"
	1 кусочек = 1 пара в таблице расписания */
drop table if exists looting_shards cascade;
create table looting_shards(
	lector varchar(512) not null,
	room varchar(512) not null,
	building varchar(512) not null,
	subject varchar(512) not null,
	slot varchar(512) not null,
	cohort varchar(512) not null,
	source varchar(512) not null,
	
	looting_session int references looting_sessions(id) on delete cascade
);

/* немного тестовых данных */
insert into looting_info(value, is_regexp) values 
	('142840', false), /*Андреев*/ 
	('119887', false), /*Балканский*/ 
	('105922', false), /*Большаков*/ 
	('135247', false), /*Васильев*/
	('145582', false), /*Волынкин*/ 
	('148662', false), /*Гельман*/ 
	('145667', false), /*Добкес*/ 
	('115756', false), /*Звягин*/ 
	('115760', false), /*Климов*/ 
	('105136', false), /*Корпан*/ 
	('119914', false), /*Кучин*/ 
	('129889', false), /*Лавров*/ 
	('100173', false), /*Лейко*/ 
	('103638', false), /*Локалов*/ 
	('134236', false), /*Лысков*/ 
	('125555', false), /*Мамутова*/ 
	('104370', false), /*Меженин*/ 
	('127312', false), /*Миронов*/ 
	('105233', false), /*Рущенко*/ 
	('163250', false), /*Смолин*/ 
	('105908', false), /*Сопроненко*/ 
	('179902', false), /*Спиридонова*/ 
	('130837', false), /*Сысоева*/ 
	('106187', false), /*Ушакова*/ 
	('185400', false), /*Швембергер*/ 
	('138571', false), /*Бурлов*/
	('186260', false), /*Логдачева*/
	('165444', false), /*Сергеева*/
	('134632', false), /*Ушакова*/
	('130646', false), /*Хайдаров*/
	('202626', false); /*Семеновых*/

insert into lectors(surname, name, patronym, password, note, looting_info, salt) values 
	('Андреев','Артем','Станиславович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='142840' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Балканский','Андрей','Александрович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='119887' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Большаков','Владимир','Павлович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='105922' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Бурлов','Дмитрий','Игоревич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='138571' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Васильев','Анатолий','Николаевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='135247' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Волынкин','Андрей','Владимирович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='145582' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Гельман','Мария','Ильинична','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='148662' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Добкес','Антон','Олегович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='145667' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Звягин','Кирилл','Александрович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='115756' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Климов','Игорь','Викторович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='115760' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Корпан','Лидия','Михайловна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='105136' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Кучин','Михаил','Дмитриевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='119914' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Лавров','Алексей','Валерьевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='129889' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Лейко','Юрий','Михайлович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='100173' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Логдачева','Елена','Викторовна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='186260' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Локалов','Владимир','Анатольевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='103638' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Лысков','Алексей','Сергеевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='134236' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Мамутова','Людмила','Артемьевна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='125555' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Меженин','Александр','Владимирович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='104370' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Миронов','Андрей','Сергеевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='127312' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Рущенко','Нина','Геннадиевна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='105233' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Сергеева','Юлия','Игоревна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='165444' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Смолин','Артем','Александрович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='163250' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Сопроненко','Лариса','Петровна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='105908' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Спиридонова','Анна','Михайловна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='179902' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Сысоева','Екатерина','Кирилловна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='130837' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Ушакова','Ольга','Борисовна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='134632' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Хайдаров','Геннадий','Гасимович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='130646' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Швембергер','Сергей','Викторович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='185400' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Семеновых','Юлия','Владимировна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='202626' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117');

insert into slots(start_time, duration, note) values 
	(28800,4800,null),(34200,4800,null),(39600,4800,null),(45600,4800,null),(51600,4800,null),(57000,4800,null),(62400,4800,null),(67800,4200,null),(72600,4200,null),(115200,4800,null),(120600,4800,null),(126000,4800,null),(132000,4800,null),(138000,4800,null),(143400,4800,null),(148800,4800,null),(154200,4200,null),(159000,4200,null),(201600,4800,null),(207000,4800,null),(212400,4800,null),(218400,4800,null),(224400,4800,null),(229800,4800,null),(235200,4800,null),(240600,4200,null),(245400,4200,null),(288000,4800,null),(293400,4800,null),(298800,4800,null),(304800,4800,null),(310800,4800,null),(316200,4800,null),(321600,4800,null),(327000,4200,null),(331800,4200,null),(374400,4800,null),(379800,4800,null),(385200,4800,null),(391200,4800,null),(397200,4800,null),(402600,4800,null),(408000,4800,null),(413400,4200,null),(418200,4200,null),(460800,4800,null),(466200,4800,null),(471600,4800,null),(477600,4800,null),(483600,4800,null),(489000,4800,null),(494400,4800,null),(499800,4200,null),(504600,4200,null),(547200,4800,null),(552600,4800,null),(558000,4800,null),(564000,4800,null),(570000,4800,null),(575400,4800,null),(580800,4800,null),(586200,4200,null),(591000,4200,null),(633600,4800,null),(639000,4800,null),(644400,4800,null),(650400,4800,null),(656400,4800,null),(661800,4800,null),(667200,4800,null),(672600,4200,null),(677400,4200,null),(720000,4800,null),(725400,4800,null),(730800,4800,null),(736800,4800,null),(742800,4800,null),(748200,4800,null),(753600,4800,null),(759000,4200,null),(763800,4200,null),(806400,4800,null),(811800,4800,null),(817200,4800,null),(823200,4800,null),(829200,4800,null),(834600,4800,null),(840000,4800,null),(845400,4200,null),(850200,4200,null),(892800,4800,null),(898200,4800,null),(903600,4800,null),(909600,4800,null),(915600,4800,null),(921000,4800,null),(926400,4800,null),(931800,4200,null),(936600,4200,null),(979200,4800,null),(984600,4800,null),(990000,4800,null),(996000,4800,null),(1002000,4800,null),(1007400,4800,null),(1012800,4800,null),(1018200,4200,null),(1023000,4200,null),(1065600,4800,null),(1071000,4800,null),(1076400,4800,null),(1082400,4800,null),(1088400,4800,null),(1093800,4800,null),(1099200,4800,null),(1104600,4200,null),(1109400,4200,null),(1152000,4800,null),(1157400,4800,null),(1162800,4800,null),(1168800,4800,null),(1174800,4800,null),(1180200,4800,null),(1185600,4800,null),(1191000,4200,null),(1195800,4200,null);