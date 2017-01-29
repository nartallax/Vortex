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
	('андреев артем станиславович', false),
	('балканский андрей александрович', false),
	('большаков владимир павлович', false),
	('бурлов дмитрий игоревич', false),
	('васильев анатолий николаевич', false),
	('волынкин андрей владимирович', false),
	('гельман мария ильинична', false),
	('добкес антон олегович', false),
	('звягин кирилл александрович', false),
	('климов игорь викторович', false),
	('корпан лидия михайловна', false),
	('кучин михаил дмитриевич', false),
	('лавров алексей валерьевич', false),
	('лейко юрий михайлович', false),
	('логдачева елена викторовна', false),
	('локалов владимир анатольевич', false),
	('лысков алексей сергеевич', false),
	('мамутова людмила артемьевна', false),
	('меженин александр владимирович', false),
	('миронов андрей сергеевич', false),
	('рущенко нина геннадиевна', false),
	('сергеева юлия игоревна', false),
	('смолин артем александрович', false),
	('сопроненко лариса петровна', false),
	('спиридонова анна михайловна', false),
	('сысоева екатерина кирилловна', false),
	('ушакова ольга борисовна', false),
	('хайдаров геннадий гасимович', false),
	('швембергер сергей викторович', false),
	('семеновых юлия владимировна', false);

insert into lectors(surname, name, patronym, password, note, looting_info, salt) values 
	('Андреев','Артем','Станиславович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='андреев артем станиславович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Балканский','Андрей','Александрович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='балканский андрей александрович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Большаков','Владимир','Павлович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='большаков владимир павлович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Бурлов','Дмитрий','Игоревич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='бурлов дмитрий игоревич' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Васильев','Анатолий','Николаевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='васильев анатолий николаевич' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Волынкин','Андрей','Владимирович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='волынкин андрей владимирович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Гельман','Мария','Ильинична','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='гельман мария ильинична' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Добкес','Антон','Олегович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='добкес антон олегович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Звягин','Кирилл','Александрович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='звягин кирилл александрович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Климов','Игорь','Викторович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='климов игорь викторович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Корпан','Лидия','Михайловна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='корпан лидия михайловна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Кучин','Михаил','Дмитриевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='кучин михаил дмитриевич' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Лавров','Алексей','Валерьевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='лавров алексей валерьевич' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Лейко','Юрий','Михайлович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='лейко юрий михайлович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Логдачева','Елена','Викторовна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='логдачева елена викторовна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Локалов','Владимир','Анатольевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='локалов владимир анатольевич' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Лысков','Алексей','Сергеевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='лысков алексей сергеевич' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Мамутова','Людмила','Артемьевна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='мамутова людмила артемьевна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Меженин','Александр','Владимирович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='меженин александр владимирович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Миронов','Андрей','Сергеевич','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='миронов андрей сергеевич' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Рущенко','Нина','Геннадиевна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='рущенко нина геннадиевна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Сергеева','Юлия','Игоревна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='сергеева юлия игоревна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Смолин','Артем','Александрович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='смолин артем александрович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Сопроненко','Лариса','Петровна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='сопроненко лариса петровна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Спиридонова','Анна','Михайловна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='спиридонова анна михайловна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Сысоева','Екатерина','Кирилловна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='сысоева екатерина кирилловна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Ушакова','Ольга','Борисовна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='ушакова ольга борисовна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Хайдаров','Геннадий','Гасимович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='хайдаров геннадий гасимович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Швембергер','Сергей','Викторович','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='швембергер сергей викторович' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'),
	('Семеновых','Юлия','Владимировна','f1da538a65a2900cd00127ce8cc9a2dfebc968c27701bb706a905aa15b78bc8e3a1e7aca474ff13920d61fa0c0f658dbb09b86f2583e199bedfb89799c0b997d',null,(select id from looting_info where value='семеновых юлия владимировна' limit 1), '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117');

insert into slots(start_time, duration, note) values 
	(30000,5400,null),
	(36000,5400,null),
	(42000,5400,null),
	(48600,5400,null),
	(55200,5400,null),
	(61200,5400,null),
	(67200,5400,null),
	(73200,5400,null),
	(116400,5400,null),
	(122400,5400,null),
	(128400,5400,null),
	(135000,5400,null),
	(141600,5400,null),
	(147600,5400,null),
	(153600,5400,null),
	(159600,5400,null),
	(202800,5400,null),
	(208800,5400,null),
	(214800,5400,null),
	(221400,5400,null),
	(228000,5400,null),
	(234000,5400,null),
	(240000,5400,null),
	(246000,5400,null),
	(289200,5400,null),
	(295200,5400,null),
	(301200,5400,null),
	(307800,5400,null),
	(314400,5400,null),
	(320400,5400,null),
	(326400,5400,null),
	(332400,5400,null),
	(375600,5400,null),
	(381600,5400,null),
	(387600,5400,null),
	(394200,5400,null),
	(400800,5400,null),
	(406800,5400,null),
	(412800,5400,null),
	(418800,5400,null),
	(462000,5400,null),
	(468000,5400,null),
	(474000,5400,null),
	(480600,5400,null),
	(487200,5400,null),
	(493200,5400,null),
	(499200,5400,null),
	(505200,5400,null),
	(548400,5400,null),
	(554400,5400,null),
	(560400,5400,null),
	(567000,5400,null),
	(573600,5400,null),
	(579600,5400,null),
	(585600,5400,null),
	(591600,5400,null),
	(634800,5400,null),
	(640800,5400,null),
	(646800,5400,null),
	(653400,5400,null),
	(660000,5400,null),
	(666000,5400,null),
	(672000,5400,null),
	(678000,5400,null),
	(721200,5400,null),
	(727200,5400,null),
	(733200,5400,null),
	(739800,5400,null),
	(746400,5400,null),
	(752400,5400,null),
	(758400,5400,null),
	(764400,5400,null),
	(807600,5400,null),
	(813600,5400,null),
	(819600,5400,null),
	(826200,5400,null),
	(832800,5400,null),
	(838800,5400,null),
	(844800,5400,null),
	(850800,5400,null),
	(894000,5400,null),
	(900000,5400,null),
	(906000,5400,null),
	(912600,5400,null),
	(919200,5400,null),
	(925200,5400,null),
	(931200,5400,null),
	(937200,5400,null),
	(980400,5400,null),
	(986400,5400,null),
	(992400,5400,null),
	(999000,5400,null),
	(1005600,5400,null),
	(1011600,5400,null),
	(1017600,5400,null),
	(1023600,5400,null),
	(1066800,5400,null),
	(1072800,5400,null),
	(1078800,5400,null),
	(1085400,5400,null),
	(1092000,5400,null),
	(1098000,5400,null),
	(1104000,5400,null),
	(1110000,5400,null),
	(1153200,5400,null),
	(1159200,5400,null),
	(1165200,5400,null),
	(1171800,5400,null),
	(1178400,5400,null),
	(1184400,5400,null),
	(1190400,5400,null),
	(1196400,5400,null);