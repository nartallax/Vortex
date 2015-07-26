<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $schedule;
	
	// тут можно было бы обойтись одним запросом вместо двух, но фиг бы с ним, нечастое действие
	$ids = $schedule->fetchByCols(array('is_main' => 'true'), array('id'));
	foreach($ids as &$row) {
		$row['is_main'] = false;
		$schedule->update($row);
	}
	
	$data['is_main'] = true;
	$schedule->update($data);
}