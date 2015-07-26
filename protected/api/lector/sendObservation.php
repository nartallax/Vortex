<?php

function getApiDataTemplate(){
	return '{
		text: isStr(),
		poster: isStr()
	}'; 
}

function calledApiFunction($data){
	global $sessionData;
	$text = nl2br(htmlspecialchars($data['text']));
	date_default_timezone_set('Europe/Moscow');
	$date = date('l j F Y H:i:s');
	$timestamp = utils::getTimestamp();
	file_put_contents('./observations/lector' . $sessionData['id'] . '_' . $timestamp, $text);
	return $timestamp;
}