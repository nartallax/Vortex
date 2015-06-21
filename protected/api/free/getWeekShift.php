<?php

function getApiDataTemplate(){
	return '{}'; 
}

function calledApiFunction($data){
	global $sessionData;
	
	$result = 0;
	if(file_exists('./vars/week_shift')){	
		$file = fopen('./vars/week_shift', 'r');
		$result = (int)fgets($file);
		fclose($file);
	}
	
	return array('value' => $result);
}