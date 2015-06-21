<?php

function getApiDataTemplate(){
	return '[{
		name: isStr(),
		disciples: isInt() && me >= 0,
		is_external?: isBln() || isNull(), 
		note?: isStr() || isNull(), 
		looting_info: {
			value: isStr(),
			is_regexp: isBln()
		}
	}]'; 
}

function calledApiFunction($data){
	global $cohort;

	foreach($data as $k => &$v){
		if(!isset($v['note'])) $v['note'] = null;
		if(!isset($v['is_external'])) $v['is_external'] = false;
	} unset($v);
	
	$cohort->createPack($data);
	return $cohort->fetch();
}