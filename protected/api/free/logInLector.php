<?php
	
function getApiDataTemplate(){
	return '{
			id: isInt(), 
			password: isStr() && matches("/^[a-fA-F\\d]{128}$/")
		}';
}
	
function calledApiFunction($data){
	if(!db\checkLectorPassword($data['id'], $data['password']))
		throw new Exception('wrong_data');
				
	$loginHash = md5((string)$data['id']);
	$sessionID = session::start($loginHash);
	$sessionData = array('is_admin' => false, 'id' => $data['id']);
	session::putSessionContent($loginHash, $sessionID, $sessionData);
	setcookie('sessionID', $sessionID, 0, "/", "", false, true);
	setcookie('sessionName', $loginHash, 0, "/", "", false, true);
}