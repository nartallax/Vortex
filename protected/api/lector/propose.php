<?php

function getApiDataTemplate(){
	return '{
		date?: isInt() || isNull(),
		note?: isStr() || isNull(),
		
		subject?: isInt(),
		room?: isInt(),
		slot?: isInt(),
		lector?: isInt(),
		lesson?: isInt(),
		cohort?: isInt(),
		end_slot?: isInt(),
		rate?: isFlt() && me > 0 && me <= 1,
		
		cohorts?: [{
			cohort: isInt(), 
			rate?: (isFlt() && me > 0 && me <= 1) || isNull()
		}],
		
		is_lab?: isBln() || isNull(),
		is_lec?: isBln() || isNull(),
		is_prk?: isBln() || isNull(),
		is_srs?: isBln() || isNull(),
		is_etc?: isBln() || isNull(),
		
		type: isStr()
	}'; 
}

function calledApiFunction($data){
	global $sessionData;
	global $schedule;
	global $change;
	global $lesson;
	global $cohortOnLesson;
	global $changeset;
	
	if(!isset($data['date'])) $data['date'] = utils::getTimestamp();
	if(!isset($data['note'])) $data['note'] = null;
	
	$sch = $schedule->fetchSingleByCols(array('is_main' => true), array('id'));
	if(!isset($sch['id'])) throw new Exception('inavailable');
	$sch = $sch['id'];
	$day = roundTimestampToDays($data['date']);
	$targetChangeset = null;
	
	$existingChangeset = $changeset->fetchBareByCols(array('application_date' => $day, 'schedule' => $sch), array('id'));
	if(count($existingChangeset) === 0){
		$targetChangeset = $changeset->create(array(
			'application_date' => $day, 
			'schedule' => $sch, 
			'is_external' => false, 
			'is_published' => false, 
			'note' => null
		));
		
		$targetChangeset = $targetChangeset['id'];
	} else $targetChangeset = $existingChangeset[0]['id'];
	
	$data['changeset'] = $targetChangeset;
	$data['proposer'] = $sessionData['id'];
	
	switch($data['type']){
		case 'alter_lesson_lector':
			if(!isset($data['lesson']) || !isset($data['lector'])) throw new Exception('not_validated');
			break;
		case 'alter_room':
			if(!isset($data['lesson']) || !isset($data['room'])) throw new Exception('not_validated');
			$data['new_val'] = $data['room'];	
			$room = $lesson->fetchSingleByCols(array('id' => $data['lesson']), array('room'));
			$data['old_val'] = isset($room['room'])? $room['room']: null;
			break;
		case 'alter_subject_lector':
			if(!isset($data['subject']) || !isset($data['lector'])) throw new Exception('not_validated');
			break;
		case 'create':
			if(!isset($data['subject']) || !isset($data['room']) || !isset($data['slot']) || !isset($data['cohorts'])) throw new Exception('not_validated');
			$data['lector'] = $sessionData['id'];
			foreach($data['cohorts'] as &$val)
				if(!isset($val['rate'])) $val['rate'] = 1.0;
			break;
		case 'delete':
			if(!isset($data['lesson'])) throw new Exception('not_validated');
			break;
		case 'add_cohort':
			if(!isset($data['lesson']) || !isset($data['cohort'])) throw new Exception('not_validated');
			if(!isset($data['rate'])) $data['rate'] = 1.0;
			break;
		case 'alter_cohort':
			if(!isset($data['lesson']) || !isset($data['cohort']) || !isset($data['rate'])) throw new Exception('not_validated');
			$data['new_val'] = $data['rate'];
			$oldRate = $cohortOnLesson->fetchSingleByCols(array('lesson' => $data['lesson'], 'cohort' => $data['cohort']), array('rate'));
			$data['old_val'] = $oldRate['rate'];
			break;
		case 'remove_cohort':
			if(!isset($data['lesson']) || !isset($data['cohort'])) throw new Exception('not_validated');
			break;
		case 'alter_slot':
			if(!isset($data['lesson']) || !isset($data['end_slot'])) throw new Exception('not_validated');
			$data['new_val'] = $data['end_slot'];
			$oldSlot = $lesson->fetchSingleByCols(array('id' => $data['lesson']), array('slot'));
			$data['old_val'] = isset($oldSlot['slot'])? $oldSlot['slot']: null;
			break;
		case 'alter_type':
			$data['new_val'] = getPrefixedFlagKeyStrict($data, 'is_');
			if(!isset($data['new_val'])) throw new Exception('not_validated');
			$oldType = $lesson->fetchSingleBy(array('id' => $data['lesson']));
			$data['old_val'] = getPrefixedFlagKeyStrict($oldType, 'is_');
			break;
		default: throw new Exception('not_validated');
	}
	
	return $change->fetchBy($change->create($data));
}