<?php

function getApiDataTemplate(){
	return '[{
		start_time: isInt(),
		duration: isInt(),
		
		looting_info:{
			value: isStr(),
			is_regexp: isBln()
		},
		
		note?: isStr() || isNull(),
		id?: isInt() || isNull(),
		is_external?: isBln() || isNull()
	}]';
}

function calledApiFunction($data){
	global $slot;

	$obsoleteSlots = reindex($slot->fetch(), 'id');
	
	$oldSlots = array();
	$newSlots = array();
	foreach($data as $key => &$val){
		if(!isset($val['note'])) $val['note'] = null;
		if(!isset($val['is_external'])) $val['is_external'] = false;
		
		if(isset($val['id'])) {
			$oldSlots[] = $val;
			unset($obsoleteSlots[$val['id']]);
		} else $newSlots[] = $val;
	}
	
	$obsoleteSlots = arrcol($obsoleteSlots, 'id');
	$slot->delete(array('id' => $obsoleteSlots));
	$slot->update($oldSlots);
	$slot->create($newSlots);
	
	return $slot->fetch();
}