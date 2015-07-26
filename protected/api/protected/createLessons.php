<?php

function getApiDataTemplate(){
	return '[{
		schedule: isInt(),
		
		lector?: isInt() || isNull(),
		room?: isInt() || isNull(),
		subject?: isInt() || isNull(),
		slot?: isInt() || isNull(),
		
		is_lab?: isBln() || isNull(),
		is_lec?: isBln() || isNull(),
		is_prk?: isBln() || isNull(),
		is_srs?: isBln() || isNull(),
		is_etc?: isBln() || isNull(),
		
		cohorts?:[{
			rate?: (isFlt() && me > 0 && me <= 1) || isNull(),
			cohort: isInt(),
			
			note?: isStr() || isNull()
		}],
		
		note?: isStr() || isNull()
	}]';
}

function calledApiFunction($data){
	global $lesson;
	global $schedule;

	if(count($data) === 0) return;
	
	$sid = null;
	foreach($data as $k => &$v){
		if($sid === null) $sid = $v['schedule'];
		else if($sid !== $v['schedule']) throw new Exception('wrong_data');
		if(	!isset($v['is_lab']) && 
			!isset($v['is_lec']) && 
			!isset($v['is_prk']) && 
			!isset($v['is_srs']) && 
			!isset($v['is_etc']))
			throw new Exception('not_validated');
	
		if(!isset($v['lector'])) $v['lector'] = null;
		if(!isset($v['room'])) $v['room'] = null;
		if(!isset($v['subject'])) $v['subject'] = null;
		if(!isset($v['slot'])) $v['slot'] = null;
		if(!isset($v['cohorts'])) $v['cohorts'] = array();
		
		if(!isset($v['note'])) $v['note'] = null;
		
		foreach($v['cohorts'] as $ck => &$c){
			if(!isset($c['rate'])) $c['rate'] = 1;
			if(!isset($c['note'])) $c['note'] = null;
		} unset($c);
	} unset($v);
	
	$sch = $schedule->fetchSingleBy(array('id' => $sid));
	if(!$sch['is_editable']) throw new Exception('inapplicable');
	
	$lesson->createPack($data);
	return $lesson->fetchBy(array('schedule' => $sid));
}