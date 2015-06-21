<?php
	/* обертка вокруг базы данных */
	
	namespace db;
	
	require_once('db_entity.php');
	use dbEntity;
	use Keccak;
	use Exception;
	
	// mappings of some inner DB values to outer values
	$lessonTypeMap = array(0 => 'is_lab', 1 => 'is_lec', 2 => 'is_prk', 3 => 'is_srs', 4 => 'is_etc');
	$typeLessonMap = array('is_lab' => 0, 'is_lec' => 1, 'is_prk' => 2, 'is_srs' => 3, 'is_etc' => 4);
	
	$gearsTypeMap = array(0 => 'per_group', 1 => 'per_disciple', 2 => 'per_lesson');
	$typeGearsMap = array('per_group' => 0, 'per_disciple' => 1, 'per_lesson' => 2);
	
	// connection data and ruling functions
	$connectionObject = null;
	$transactionIsOpen = false;
	
	function setupDBconnection(){
		global $CONFIG;
		global $connectionObject;
		global $transactionIsOpen;
		
		$connectionObject = pg_connect(
			'host=' . $CONFIG['db']['host'] . 
			' user=' . $CONFIG['db']['user'] . 
			' password=\'' . $CONFIG['db']['password'] . 
			'\' dbname=' . $CONFIG['db']['name'] . 
			' port=' . $CONFIG['db']['port'] . 
			' connect_timeout=' . $CONFIG['db']['connect_timeout'] . 
			" options='--client_encoding=UTF8'");
		if ($connectionObject === false)
			throw new Exception('server_error');
		executeQuery('start transaction');
		$transactionIsOpen = true;
		dbEntity::setQueryRowsFunction(function($q, $d){ 
		
			//echo($q);
			//var_dump($d);
		
			return executeQuery($q, $d);
		});
	}
	function shutdownDBconnection(){
		global $connectionObject;
		global $transactionIsOpen;
		
		if($transactionIsOpen)
			executeQuery('commit');
		pg_close($connectionObject);
	}
	
	function executeQuery($query, $data = array()){
		global $connectionObject;
		
		foreach($data as $k => $v)
			if(is_bool($v))
				$data[$k] = $v? 't': 'f';
		
		//echo(" $query: ");
		//var_dump($data);
		
		try{
			$result = pg_query_params($connectionObject, $query, $data);
			if($result === false) throw new Exception('server_error');
			$result = pg_fetch_all($result);
			return $result === false? array(): $result;
		} catch(Exception $e){
			pg_query($connectionObject, 'rollback');
			$transactionIsOpen = false;
			throw $e;
		}
	}
	
	// some conversions
	function hashPass($pass, $salt){
		$result = strtolower(Keccak::of(strtolower($salt) . strtolower($pass) . '9e2a7dc7c07e34d82eea58e588ca6f291d1a7a52fb4d49cb055b279deac855c3bfa150b0fca792a2e911298eb316340fc909da22a7d2500aeaf2044e86383117'));
		return $result;
	}
	function getSalt(){
		return strtolower(Keccak::of(microtime(true) . ''));
	}
	
	function checkLectorPassword($id, $password){
		global $lector;
		
		$l = $lector->fetchSingleBy(array('id' => $id));
		return strtolower($l['password']) === strtolower(hashPass(strtolower($password), $l['salt']));
	}
	
	function reformLessons(&$table){ // sort of bottleneck
		global $lessonTypeMap;
	
		$indices = array();
		foreach($table as $i => &$lesson){
			if(isset($indices[$id = $lesson['id'] = (int)$lesson['id']])){
				$table[$indices[$id]]['cohorts'][] = array('rate' => (float)$lesson['rate'], 'cohort' => (int)$lesson['cohort']);
				unset($table[$i]);
			} else {
				$indices[$id] = $i;
				if(($lesson['cohort']) !== null)
					$lesson['cohorts'] = array(array('rate' => (float)$lesson['rate'], 'cohort' => (int)$lesson['cohort']));
				else $lesson['cohorts'] = array();
				
				$lesson['lector'] = (int)$lesson['lector'];
				$lesson['room'] = (int)$lesson['room'];
				$lesson['subject'] = (int)$lesson['subject'];
				$lesson['slot'] = (int)$lesson['slot'];
				$lesson[$lessonTypeMap[$lesson['type']]] = true;
				
				unset($lesson['type']);
				unset($lesson['cohort']);
				unset($lesson['rate']);
			}
		}
	}
	function getFullSchedule($scheduleBase){
		global $changeset;
		global $curriculumForCohort;
		global $preconceivedLectorSlot;
		global $preconceivedRoomSlot;
		global $preconceivedCohortSlot;
		global $preference;
		
		$idArr = array('schedule' => $scheduleBase['id']);
		$scheduleBase['changesets'] = $changeset->fetchBy($idArr);
		$lessons = executeQuery('select lessons.id, type, lector, room, subject, slot, cohorts_on_lessons.rate as rate, cohorts_on_lessons.cohort as cohort, notes.value as note from lessons left join notes on notes.id = lessons.note left join cohorts_on_lessons on cohorts_on_lessons.lesson = lessons.id where lessons.schedule = $1', array($scheduleBase['id']));
		
		reformLessons($lessons);
		
		$scheduleBase['lessons'] = $lessons;
		$scheduleBase['curriculums_for_cohorts'] = $curriculumForCohort->fetchBy($idArr);
		$scheduleBase['preconceived_lector_slots'] = $preconceivedLectorSlot->fetchBy($idArr);
		$scheduleBase['preconceived_room_slots'] = $preconceivedRoomSlot->fetchBy($idArr);
		$scheduleBase['preconceived_cohort_slots'] = $preconceivedCohortSlot->fetchBy($idArr);
		$scheduleBase['preferences'] = $preference->fetchBy($idArr);
		
		return $scheduleBase;
	}
	function getTruncatedSchedule($scheduleBase){
		global $changeset;
		
		$idArr = array('schedule' => $scheduleBase['id']);
		$scheduleBase['changesets'] = $changeset->fetchBy($idArr);
		$lessons = executeQuery('select lessons.id, type, lector, room, subject, slot, cohorts_on_lessons.rate as rate, cohorts_on_lessons.cohort as cohort, notes.value as note from lessons left join notes on notes.id = lessons.note left join cohorts_on_lessons on cohorts_on_lessons.lesson = lessons.id where lessons.schedule = $1', array($scheduleBase['id']));
		
		reformLessons($lessons);
		
		$scheduleBase['lessons'] = $lessons;
		
		return $scheduleBase;
	}
	
	function getFullCommonData(){
		global $lector;
		global $cohort;
		global $building;
		global $room;
		global $curriculum;
		global $subject;
		global $slot;
		global $gearType;
		global $gearInRoom;
		global $gearForSubject;
		
		$result = array();
		
		$result['lectors'] = $lector->fetch();
		$result['cohorts'] = $cohort->fetch();
		$result['buildings'] = $building->fetch();
		$result['rooms'] = $room->fetch();
		$result['curriculums'] = $curriculum->fetch();
		$result['subjects'] = $subject->fetch();
		$result['slots'] = $slot->fetch();
		$result['gear_types'] = $gearType->fetch();
		$result['gears_in_rooms'] = $gearInRoom->fetch();
		$result['gears_for_subjects'] = $gearForSubject->fetch();
		
		return $result;
	}
	function getTruncatedCommonData(){
		global $lector;
		global $cohort;
		global $building;
		global $room;
		global $curriculum;
		global $subject;
		global $slot;
		
		$result = array();
		
		$result['lectors'] = $lector->fetchCols(array('id', 'name', 'surname', 'patronym', 'is_external'));
		$result['cohorts'] = $cohort->fetchCols(array('id', 'name', 'is_external'));
		$result['buildings'] = $building->fetchCols(array('id', 'name'));
		$result['rooms'] = $room->fetchCols(array('id','name','building', 'is_external'));
		$result['curriculums'] = $curriculum->fetchCols(array('id', 'lec', 'lab', 'prk', 'srs', 'etc', 'subject'));
		$result['subjects'] = $subject->fetchCols(array('id', 'name'));
		$result['slots'] = $slot->fetchCols(array('id', 'start_time', 'duration'));
		
		return $result;
	}
	
	// basic transformations
	$noteToDBtrans = function($ent){ if(isset($ent['note'])) $ent['note'] = array('value' => $ent['note']); return $ent; };
	$noteFromDBtrans = function($ent){ if(isset($ent['note'])) $ent['note'] = $ent['note']['value']; return $ent; };
	
	// table descriptions
	$note = new dbEntity('notes', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'value'			=> array('type' => 'string')
	));
	
	$lootingInfo = new dbEntity('looting_info', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'value'			=> array('type' => 'string'),
		'is_regexp'		=> array('type' => 'boolean')
	));
	
	$building = new dbEntity('buildings', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'name' 			=> array('type' => 'string'),
		'is_external' 	=> array('type' => 'boolean', 'default' => true),
		'note' 			=> array('type' => 'int', 'default' => null),
		'looting_info' 	=> array('type' => 'int')
	));
	$building->registerSecondaryEntity($note, 'note', 'id');
	$building->registerSecondaryEntity($lootingInfo, 'looting_info', 'id');
	$building->registerTransform(false, $noteToDBtrans);
	$building->registerTransform(true, $noteFromDBtrans);
	
	$checkLectorSaltAndPassword = function(&$lectors){
		foreach($lectors as &$lector){
			if(!isset($lector['password'])){
				unset($lector['salt']);
				continue;
			}
			$lector['salt'] = getSalt();
			$lector['password'] = strtolower(hashPass(strtolower($lector['password']), strtolower($lector['salt'])));
		}
	};
	$lector = new dbEntity('lectors', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'name' 			=> array('type' => 'string'),
		'surname' 		=> array('type' => 'string'),
		'patronym' 		=> array('type' => 'string', 'default' => ''),
		'password' 		=> array('type' => 'string', 'default' => null),
		'salt'	 		=> array('type' => 'string', 'default' => null),
		'is_external'	=> array('type' => 'boolean', 'default' => false),
		'note' 			=> array('type' => 'int', 'default' => null),
		'looting_info' 	=> array('type' => 'int'),
		'wage_rate'		=> array('type' => 'float', 'default' => 1.0)
	));
	$lector->registerSecondaryEntity($note, 'note', 'id');
	$lector->registerSecondaryEntity($lootingInfo, 'looting_info', 'id');
	$lector->registerTransform(false, $noteToDBtrans);
	$lector->registerTransform(true, $noteFromDBtrans);
	$lector->registerOnCreate($checkLectorSaltAndPassword, true);
	$lector->registerOnUpdate($checkLectorSaltAndPassword, true);
	
	$cohort = new dbEntity('cohorts', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'name' 			=> array('type' => 'string'),
		'disciples'		=> array('type' => 'int', 'default' => 0),
		'note' 			=> array('type' => 'int', 'default' => null),
		'is_external'	=> array('type' => 'boolean', 'default' => false),
		'looting_info' 	=> array('type' => 'int')
	));
	$cohort->registerSecondaryEntity($note, 'note', 'id');
	$cohort->registerSecondaryEntity($lootingInfo, 'looting_info', 'id');
	$cohort->registerTransform(false, $noteToDBtrans);
	$cohort->registerTransform(true, $noteFromDBtrans);
	$cohort->registerOnDelete(function($args){
		global $cohortOnLesson;
		global $preference;
		
		$cohort = $args['id'];
		//cohorts-on-lessons should not just be deleted by cascade, because that may create dangling note rows
		$cohortOnLesson->delete(array('cohort' => $cohort));
		
		$preference->delete(array('type' => 'merge_cohorts', 'cohort_a' => $cohort));
		$preference->delete(array('type' => 'merge_cohorts', 'cohort_b' => $cohort));
		$preference->delete(array('type' => 'split_cohort', 'cohort' => $cohort));
	}, true);
	
	$cohortOnLesson = new dbEntity('cohorts_on_lessons', array(
		'rate'			=> array('type' => 'float', 'default' => 1.0),
		'cohort'		=> array('type' => 'int'),
		'lesson'		=> array('type' => 'int'),
		'note'			=> array('type' => 'int', 'default' => null)
	));
	$cohortOnLesson->registerSecondaryEntity($note, 'note', 'id');
	$cohortOnLesson->registerTransform(false, $noteToDBtrans);
	$cohortOnLesson->registerTransform(true, $noteFromDBtrans);
	
	$lesson = new dbEntity('lessons', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'type' 			=> array('type' => 'int', 'default' => $typeLessonMap['is_etc']),
		'lector'		=> array('type' => 'int', 'default' => null),
		'room' 			=> array('type' => 'int', 'default' => null),
		'subject'		=> array('type' => 'int', 'default' => null),
		'slot' 			=> array('type' => 'int', 'default' => null),
		'schedule' 		=> array('type' => 'int'),
		'note' 			=> array('type' => 'int', 'default' => null)
	));
	$lesson->registerSecondaryEntity($cohortOnLesson, 'id', 'lesson', false, 'cohorts');
	$lesson->registerSecondaryEntity($note, 'note', 'id');
	$lesson->registerTransform(false, $noteToDBtrans);
	$lesson->registerTransform(false, function($ent) {
		global $typeLessonMap;
		
		$key = getPrefixedFlagKeyStrict($ent, 'is_');
		if($key === null) return $ent;
		unset($ent[$key]);
		$ent['type'] = $typeLessonMap[$key];
		return $ent;
	});
	$lesson->registerTransform(true, $noteFromDBtrans);
	$lesson->registerTransform(true, function($ent) { 
		global $lessonTypeMap;
		
		if(!isset($ent['type'])) return $ent;
		
		$key = $lessonTypeMap[$ent['type']];
		unset($ent['type']);
		$ent[$key] = true;
		return $ent;
	});
	
	$room = new dbEntity('rooms', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'name' 			=> array('type' => 'string'),
		'space'			=> array('type' => 'int', 'default' => 0),
		'is_external'	=> array('type' => 'boolean', 'default' => false),
		'is_common'		=> array('type' => 'boolean', 'default' => false),
		'note' 			=> array('type' => 'int', 'default' => null),
		'looting_info' 	=> array('type' => 'int'),
		'building'	 	=> array('type' => 'int')
	));
	$room->registerSecondaryEntity($note, 'note', 'id');
	$room->registerSecondaryEntity($lootingInfo, 'looting_info', 'id');
	$room->registerTransform(false, $noteToDBtrans);
	$room->registerTransform(true, $noteFromDBtrans);
	$room->registerOnDelete(function($args){
		global $preference;
		global $gearInRoom;
		
		$preference->delete(array('type' => 'room_to_subject', 'room' => $args['id']));
		
		$girs = $gearInRoom->fetchBy(array('room' => null));
		$gearInRoom->delete(array('room' => null));
		
		$newGirs = array();
		foreach($girs as $gir){
			if(!isset($newGirs[$gir['type']])) $newGirs[$gir['type']] = $gir;
			else $newGirs[$gir['type']]['amount'] += $gir['amount'];
		}
		
		$gearInRoom->create(array_values($newGirs));
	}, true);
	
	$curriculum = new dbEntity('curriculums', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'lab'			=> array('type'	=> 'int', 'default' => 0),
		'lec'			=> array('type'	=> 'int', 'default' => 0),
		'prk'			=> array('type'	=> 'int', 'default' => 0),
		'srs'			=> array('type'	=> 'int', 'default' => 0),
		'etc'			=> array('type'	=> 'int', 'default' => 0),
		'note' 			=> array('type' => 'int', 'default' => null),
		'subject'		=> array('type' => 'int')
	));
	
	$subject = new dbEntity('subjects', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'name' 			=> array('type' => 'string'),
		'is_external'	=> array('type' => 'boolean', 'default' => false),
		'note' 			=> array('type' => 'int', 'default' => null),
		'looting_info' 	=> array('type' => 'int')
	));
	$subject->registerSecondaryEntity($note, 'note', 'id');
	$subject->registerSecondaryEntity($lootingInfo, 'looting_info', 'id');
	$subject->registerTransform(false, $noteToDBtrans);
	$subject->registerTransform(true, $noteFromDBtrans);
	$subject->registerOnDelete(function($args){
		global $lesson;
		global $curriculum;
		global $preference;
		
		$lesson->delete(array('subject' => $args['id']));
		$curriculum->delete(array('subject' => $args['id']));
		$preference->delete(array('type' => 'merge_cohorts', 'subject' => $args['id']));
		$preference->delete(array('type' => 'split_cohort', 'subject' => $args['id']));
		$preference->delete(array('type' => 'room_to_subject', 'subject' => $args['id']));
	}, true);
	
	$gearType = new dbEntity('gear_types', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'name' 			=> array('type' => 'string'),
		'note' 			=> array('type' => 'int', 'default' => null)
	));
	$gearType->registerSecondaryEntity($note, 'note', 'id');
	$gearType->registerTransform(false, $noteToDBtrans);
	$gearType->registerTransform(true, $noteFromDBtrans);
	
	$slot = new dbEntity('slots', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'start_time'	=> array('type'	=> 'int'),
		'duration'		=> array('type'	=> 'int'),
		'is_external'	=> array('type' => 'boolean', 'default' => false),
		'note' 			=> array('type' => 'int', 'default' => null)
	));
	$gearType->registerSecondaryEntity($note, 'note', 'id');
	$gearType->registerTransform(false, $noteToDBtrans);
	$gearType->registerTransform(true, $noteFromDBtrans);
	
	$gearInRoom = new dbEntity('gears_in_rooms', array(
		'amount'		=> array('type' => 'int'),
		'room'			=> array('type' => 'int', 'default' => null),
		'type'			=> array('type'	=> 'int')
	));
	
	$gearForSubject = new dbEntity('gears_for_subjects', array(
		'amount'		=> array('type' => 'int'),
		'subject'		=> array('type' => 'int'),
		'type'			=> array('type'	=> 'int'),
		'unit_type'		=> array('type'	=> 'int')
	));
	$gearForSubject->registerTransform(false, function($ent) {
		global $typeGearsMap;
		
		$key = getPrefixedFlagKeyStrict($ent, 'per_');
		if($key === null) return $ent;
		unset($ent[$key]);
		$ent['type'] = $typeGearsMap[$key];
		return $ent;
	});
	$gearForSubject->registerTransform(true, function($ent) { 
		global $gearsTypeMap;
		
		$key = $gearsTypeMap[$ent['type']];
		unset($ent['type']);
		$ent[$key] = true;
		return $ent;
	});
	
	$curriculumForCohort = new dbEntity('curriculums_for_cohorts', array(
		'curriculum'	=> array('type' => 'int'),
		'cohort'		=> array('type' => 'int'),
		'schedule'		=> array('type'	=> 'int')
	));
	
	$schedule = new dbEntity('schedules', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'creation_date'	=> array('type'	=> 'int', 'required' => false),
		'duration'		=> array('type'	=> 'int'),
		'name'			=> array('type'	=> 'string'),
		'is_main'		=> array('type'	=> 'boolean', 'default' => false),
		'is_editable'	=> array('type'	=> 'boolean', 'default' => true),
		'note' 			=> array('type' => 'int', 'default' => null)
	));
	$schedule->registerSecondaryEntity($note, 'note', 'id');
	$schedule->registerTransform(false, $noteToDBtrans);
	$schedule->registerTransform(true, $noteFromDBtrans);
	$schedule->registerOnDelete(function($args){
		global $lesson;
		global $changeset;
		
		$lesson->delete(array('schedule' => $args['id']));
		$changeset->delete(array('schedule' => $args['id']));
	}, true);
	
	// FIXME: no logical validation of created changes! could propose something illogical
	// FIXME: no logical validation of created preferences! could propose something illogical
	$change = new dbEntity('changes', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'type'			=> array('type'	=> 'int', 'default' => null),
		'target'		=> array('type'	=> 'int', 'default' => null),
		'subtarget'		=> array('type'	=> 'int', 'default' => null),
		'old_value'		=> array('type'	=> 'int', 'default' => null),
		'new_value'		=> array('type'	=> 'int', 'default' => null),
		'other_data'	=> array('type'	=> 'string', 'default' => null),
		'changeset'		=> array('type'	=> 'int'),
		'proposer'		=> array('type'	=> 'int', 'default' => null),
		'note'			=> array('type'	=> 'int', 'default' => null),
		'creation_date'	=> array('type'	=> 'int', 'required' => false)
	));
	$change->registerSecondaryEntity($note, 'note', 'id');
	$change->registerTransform(false, $noteToDBtrans);
	$change->registerTransform(true, $noteFromDBtrans);
	$change->registerTransform(false, function($change){
		global $typeLessonMap;
		
		if(count($change) === 1 && isset($change['id'])) return $change;
		if(!isset($change['id']) && !isset($change['type'])) return $change;
		
		$result = array(
			'proposer' => isset($change['proposer'])? $change['proposer']: null,
			'target' => isset($change['lesson'])? $change['lesson']: null,
			'other_data' => null,
			'subtarget' => null,
			'old_value' => null,
			'new_value' => null,
			'note' => isset($change['note'])? $change['note']: null
		);
		
		if(isset($change['id'])) $result['id'] = $change['id'];
		if(isset($change['changeset'])) $result['changeset'] = $change['changeset'];
		if(isset($change['creation_date'])) $result['creation_date'] = $change['creation_date'];
		
		switch($change['type']){
			case 'alter_room':
				$result['type'] = 0;
				$result['old_value'] = $change['old_val'];
				$result['new_value'] = $change['new_val'];
				break;
			case 'create':
				$result['type'] = 1;
				$lector = $change['lector'];
				$slot = $change['slot'];
				$room = $change['room'];
				$subject = $change['subject'];
				$type = $typeLessonMap[getPrefixedFlagKey($change, 'is_')];
				
				$cohorts = $change['cohorts']; // serializing cohorts
				$cohortsStr = '';
				$firstCohort = true;
				foreach($cohorts as $val){
					if(!$firstCohort) $cohortsStr .= '|'; else $firstCohort = false;
					$cohortsStr .= strval($val['cohort']);
					if(isset($val['rate']) && $val['rate'] != 1)
						$cohortsStr .= ':' . sprintf("%.3f", $val['rate']);
				}
				
				$result['other_data'] = "$lector|$slot|$room|$subject|$type|$cohortsStr";
				break;
			case 'delete':
				$result['type'] = 2;
				break;
			case 'alter_type':
				$result['type'] = 3;
				$result['old_value'] = $typeLessonMap[$change['old_val']];
				$result['new_value'] = $typeLessonMap[$change['new_val']];
				break;
			case 'alter_cohort':
				$result['type'] = 4;
				$result['other_data'] = $change['old_val'] . '|' . $change['new_val'];
				$result['subtarget'] = $change['cohort'];
				break;
			case 'add_cohort':
				$result['type'] = 5;
				$result['other_data'] = (string)$change['rate'];
				$result['subtarget'] = $change['cohort'];
				break;
			case 'remove_cohort':
				$result['type'] = 6;
				$result['subtarget'] = $change['cohort'];
				break;
			case 'alter_slot':
				$result['type'] = 7;
				$result['old_value'] = $change['old_val'];
				$result['new_value'] = $change['new_val'];
				break;
			case 'alter_lesson_lector':
				$result['type'] = 8;
				$result['subtarget'] = $change['lector'];
				break;
			case 'alter_subject_lector':
				$result['type'] = 9;
				$result['subtarget'] = $change['lector'];
				$result['target'] = $change['subject'];
				break;
			default:
				throw new Exception('server_error');
		}
		
		return $result;
	});
	$change->registerTransform(true, function($change){
		global $lessonTypeMap;
	
		if(!isset($change['id'])) return $change;
	
		$result = array(
			'id' => $change['id'],
			'proposer' => $change['proposer'],
			'lesson' => $change['target'], 
			'note' => $change['note']
		);
		
		if(isset($change['creation_date'])) $result['creation_date'] = $change['creation_date'];
		if(isset($change['changeset'])) $result['changeset'] = $change['changeset'];
		
		switch($change['type']){
			case 0:
				$result['type'] = 'alter_room';
				$result['old_val'] = $change['old_value'];
				$result['new_val'] = $change['new_value'];
				break;
			case 1:
				$result['type'] = 'create';
				$raw = explode('|', $change['other_data']);
				
				$result['lector'] = (int)$raw[0];
				$result['slot'] = (int)$raw[1];
				$result['room'] = (int)$raw[2];
				$result['subject'] = (int)$raw[3];
				$result[$lessonTypeMap[$raw[4]]] = true;
				
				$cohorts = array(); // cohorts deserialization
				foreach(array_slice($raw, 5) as $part){
					$subparts = explode(':', $part);
					$cohort = intval($subparts[0]);
					$rate = count($subparts) > 1? floatval($subparts[1]): 1.0;
					$cohorts[] = array('cohort' => $cohort, 'rate' => $rate);
				}
				
				$result['cohorts'] = $cohorts;
				break;
			case 2:
				$result['type'] = 'delete';
				break;
			case 3:
				$result['type'] = 'alter_type';
				$result['old_val'] = $lessonTypeMap[$change['old_value']];
				$result['new_val'] = $lessonTypeMap[$change['new_value']];
				break;
			case 4:
				$result['type'] = 'alter_cohort';
				$other_data = explode('|', $change['other_data']);
				$result['old_val'] = $other_data[0] === 'null'? null: (float)$other_data[0];
				$result['new_val'] = $other_data[1] === 'null'? null: (float)$other_data[1];
				$result['cohort'] = $change['subtarget'];
				break;
			case 5:
				$result['type'] = 'add_cohort';
				$result['rate'] = $change['other_data'] === 'null'? null: (float)$change['other_data'];
				$result['cohort'] = $change['subtarget'];
				break;
			case 6:
				$result['type'] = 'remove_cohort';
				$result['cohort'] = $change['subtarget'];
				break;
			case 7:
				$result['type'] = 'alter_slot';
				$result['old_val'] = $change['old_value'];
				$result['new_val'] = $change['new_value'];
				break;
			case 8:
				$result['type'] = 'alter_lesson_lector';
				$result['lector'] = $change['subtarget'];
				break;
			case 9:
				$result['type'] = 'alter_subject_lector';
				$result['lector'] = $change['subtarget'];
				$result['subject'] = $result['lesson'];
				unset($result['lesson']);
				break;
			default:
				throw new Exception('server_error');
		}
		
		return $result;
	});
	
	$changeset = new dbEntity('changesets', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'application_date'=>array('type'=> 'int'),
		'is_external'	=> array('type'	=> 'boolean', 'default' => false),
		'is_published'	=> array('type'	=> 'boolean', 'default' => false),
		'schedule'		=> array('type'	=> 'int'),
		'note'			=> array('type'	=> 'int', 'default' => null)
	));
	$changeset->registerSecondaryEntity($change, 'id', 'changeset', false, 'changes');
	$changeset->registerSecondaryEntity($note, 'note', 'id');
	$changeset->registerTransform(false, $noteToDBtrans);
	$changeset->registerTransform(true, $noteFromDBtrans);
	
	$preconceivedLectorSlot = new dbEntity('preconceived_lectors_slots', array(
		'lector'		=> array('type' => 'int'),
		'slot'			=> array('type' => 'int'),
		'value'			=> array('type' => 'int', 'default' => 0),
		'schedule'		=> array('type' => 'int')
	));
	
	$preconceivedRoomSlot = new dbEntity('preconceived_rooms_slots', array(
		'room'			=> array('type' => 'int'),
		'slot'			=> array('type' => 'int'),
		'value'			=> array('type' => 'int', 'default' => 0),
		'schedule'		=> array('type' => 'int')
	));
	
	$preconceivedCohortSlot = new dbEntity('preconceived_cohorts_slots', array(
		'cohort'		=> array('type' => 'int'),
		'slot'			=> array('type' => 'int'),
		'value'			=> array('type' => 'int', 'default' => 0),
		'schedule'		=> array('type' => 'int')
	));
	
	$preference = new dbEntity('preferences', array(
		'type'			=> array('type' => 'int'),
		'lector'		=> array('type' => 'int'),
		'schedule'		=> array('type' => 'int'),
		'item_a'		=> array('type' => 'int', 'default' => 'null'),
		'item_b'		=> array('type' => 'int', 'default' => 'null'),
		'item_c'		=> array('type' => 'int', 'default' => 'null'),
		'item_d'		=> array('type' => 'int', 'default' => 'null')
	));
	$preference->registerTransform(false, function(&$ent){
		if((!isset($ent['schedule']) || !isset($ent['lector']) || count($ent) === 2) && !isset($ent['type'])) return $ent;
		$result = array(
			'schedule' => $ent['schedule'], 
			'lector' => $ent['lector'],
			'item_d' => isset($ent['subject'])? $ent['subject']: null
		);
		
		$type = null;
		if(isset($ent['type'])) $type = $ent['type'];
		else { // no explicit type is specified, trying to deduce it from other data member names
			if(isset($ent['cohort_a']) && isset($ent['cohort_b'])) $type = 'merge_cohorts';
			elseif(isset($ent['cohort']) && isset($ent['parts'])) $type = 'split_cohort';
			elseif(isset($ent['room'])) $type = 'room_to_subject';
			else throw new Exception('server_error'); // could not determine type
		}
		
		switch($type){
			case 'merge_cohorts':
				$result['type'] = 0;
				$result['item_a'] = $ent['cohort_a'];
				$result['item_b'] = $ent['cohort_b'];
				break;
			case 'split_cohort':
				$result['type'] = 1;
				$result['item_a'] = $ent['cohort'];
				$result['item_b'] = $ent['parts'];
				break;
			case 'room_to_subject':
				$result['type'] = 2;
				$result['item_a'] = $ent['room'];
				break;
			default: throw new Exception('server_error'); // unknown type
		}
		
		return $result;
	});
	$preference->registerTransform(true, function($ent){
		$result = array( 'subject' => isset($ent['item_d'])? $ent['item_d']: null );
		
		if(isset($ent['schedule'])) $result['schedule'] = $ent['schedule'];
		if(isset($ent['lector'])) $result['lector'] = $ent['lector'];
		
		switch($ent['type']){
			case 0:	
				$result['type'] = 'merge_cohorts';
				$result['cohort_a'] = $ent['item_a'];
				$result['cohort_b'] = $ent['item_b'];
				break;
			case 1: 
				$result['type'] = 'split_cohort';
				$result['cohort'] = $ent['item_a'];
				$result['parts'] = $ent['item_b'];
				break;
			case 2:	
				$result['type'] = 'room_to_subject';
				$result['room'] = $ent['item_a'];
				break;
			default: throw new Exception('server_error'); // unknown type code
		}
		
		return $result;
	});
	
	$lootingSession = new dbEntity('looting_sessions', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'looting_start'	=> array('type' => 'int', 'required' => false),
		'looting_end'	=> array('type' => 'int', 'required' => false),
		'unprocessed_data'=>array('type'=> 'string', 'default' => null),
		'note'			=> array('type'	=> 'string', 'default' => null)
	));
	$lootingSession->registerTransform(false, $noteToDBtrans);
	$lootingSession->registerTransform(true, $noteFromDBtrans);
	
	$lootingShard = new dbEntity('looting_shards', array(
		'lector'		=> array('type' => 'string', 'default' => ''),
		'room'			=> array('type' => 'string', 'default' => ''),
		'building'		=> array('type' => 'string', 'default' => ''),
		'subject'		=> array('type' => 'string', 'default' => ''),
		'slot'			=> array('type' => 'string', 'default' => ''),
		'cohort'		=> array('type' => 'string', 'default' => ''),
		'source'		=> array('type' => 'string', 'default' => ''),
		'looting_session'=>array('type' => 'int')
	));
	
	$event = new dbEntity('events', array(
		'id' 			=> array('type' => 'int', 'is_pkey' => true),
		'name'			=> array('type' => 'string'),
		'time_start'	=> array('type' => 'int'),
		'time_end'		=> array('type' => 'int'),
		'note'			=> array('type'	=> 'string', 'default' => null)
	));
	$event->registerSecondaryEntity($note, 'note', 'id');
	$event->registerTransform(false, $noteToDBtrans);
	$event->registerTransform(true, $noteFromDBtrans);
	
	setupDBconnection();
	register_shutdown_function(function(){shutdownDBconnection();});