<?php

function getApiDataTemplate(){
	return '{
		id: isInt(),
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
		
		cohorts:[{
			rate?: (isFlt() && me > 0 && me <= 1) || isNull(),
			cohort: isInt(),
		
			note?: isStr() || isNull()
		}],
		
		note?: isStr() || isNull()
	}:oneOf(is_lab, is_lec, is_prk, is_srs, is_etc)'; 
}

function calledApiFunction($data){
	global $lesson;
	global $schedule;

	$sch = $schedule->fetchSingleBy(array('id' => $data['schedule']));
	if(!$sch['is_editable']) throw new Exception('inapplicable');

	if(!isset($data['lector'])) $data['lector'] = null;
	if(!isset($data['room'])) $data['room'] = null;
	if(!isset($data['subject'])) $data['subject'] = null;
	if(!isset($data['slot'])) $data['slot'] = null;
	if(!isset($data['cohorts'])) $data['cohorts'] = array();
	
	if(!isset($data['note'])) $data['note'] = null;
	
	foreach($data['cohorts'] as $key => &$val){
		if(!isset($val['rate'])) $val['rate'] = 1;
		if(!isset($val['note'])) $val['note'] = null;
	}
	
	$lesson->update($data);
}