<?php

function getApiDataTemplate(){
	return '{
		application_day: isInt(),
		schedule: isInt(),
		is_external?: isBln() || isNull(),
		is_published?: isBln() || isNull(),
		note?: isStr() || isNull(),
		changes?:[true]
	}'; 
}

function calledApiFunction($data){
	global $changeset;

	if(!isset($data['is_external'])) $data['is_external'] = false;
	if(!isset($data['is_published'])) $data['is_published'] = false;
	if(!isset($data['note'])) $data['note'] = null;
	if(!isset($data['changes'])) $data['changes'] = array();
	
	//FIXME: poor changes validation
	foreach($data['changes'] as $change) if(!is_array($change)) throw new Exception('not_validated');
	
	$result = $changeset->create($data);
	return $result['id'];
}