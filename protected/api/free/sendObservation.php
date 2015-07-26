<?php

function getApiDataTemplate(){
	return '{
		text: isStr(),
		poster: isStr()
	}';
}
	
function calledApiFunction($data){ 
	$author = $data['poster'] == ''? 'Анонимно': '"' . nl2br(htmlspecialchars($data['poster'])) . '"';
	$text = nl2br(htmlspecialchars($data['text']));
	date_default_timezone_set('Europe/Moscow');
	$date = date('l j F Y H:i:s');
	
	$id = utils::getTimestamp();
	file_put_contents('./observations/' . $id, "$author, $date: $text");
	return $id;
}