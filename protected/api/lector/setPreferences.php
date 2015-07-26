<?php

function getApiDataTemplate(){
	/*
	return '{
		merged_cohorts?: [{
			cohort_a: isInt(),
			cohort_b: isInt(),
			subject?: isInt() || isNull()
		}], 
		splitted_cohorts?: [{
			cohort: isInt(),
			subject?: isInt() || isNull(),
			parts?: (isInt() && me > 1) || isNull()
		}],
		room_to_subject?: [{
			room: isInt(),
			subject: isInt()
		}]
	}'; */
	return '[{
		cohort_a?: isInt(),
		cohort_b?: isInt(),
		cohort?: isInt(),
		subject?: isInt(),
		parts?: isInt(),
		room?: isInt(),
		type: me == "merge_cohorts" || me == "split_cohort" || me == "room_to_subject",
		schedule?: isInt() || isNull()
	}]';
}

function calledApiFunction($data){
	global $sessionData;
	global $preference;
	global $schedule;
	
	$mentioned_cohorts = array();
	
	foreach($data as &$val){
		if($val['type'] !== 'merge_cohorts') continue;
		if(!isset($val['cohort_a']) || !isset($val['cohort_b'])) throw new Exception('not_validated');
		if(!isset($val['subject'])) $val['subject'] = null;
		
		if($val['cohort_a'] === $val['cohort_b']) throw new Exception('wrong_data');
	} unset($val);
	
	foreach($data as &$val){
		if($val['type'] !== 'split_cohort') continue;
		if(!isset($val['cohort'])) throw new Exception('not_validated');
		if(!isset($val['subject'])) $val['subject'] = null;
		if(!isset($val['parts'])) $val['parts'] = 2;
	} unset($val);
	
	foreach($data as &$val){
		if($val['type'] !== 'room_to_subject') continue;
		if(!isset($val['room']) || !isset($val['subject'])) throw new Exception('not_validated');
	} unset($val);
	
	$lector = $sessionData['id'];
	
	$sch = null;
	foreach($data as &$val) {
		$val['lector'] = $lector;
		if(!isset($val['schedule'])){
			if(!isset($sch)){
				$sch = $schedule->fetchSingleBy(array('is_main' => true));
				if(!isset($sch['id'])) throw new Exception('inavailable');
				$sch = $sch['id'];
			}
			$val['schedule'] = $sch;
		}
	} unset($val);
	
	
	
	$preference->delete(array('lector' => $lector));
	$preference->createPack($data);
}