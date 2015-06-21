<?php
	
function getApiDataTemplate(){//login: isStr() && matches("/^[a-zA-Z\d_\-\s]{0,31}$/"), 
	return '{
			
			password: isStr() && matches("/^[a-fA-F\d]{128}$/")
		}';
}
	
function calledApiFunction($data){
	global $CONFIG;
	
	if(	//strtolower($CONFIG['admin']['login']) !== strtolower($data['login']) || 
		strtolower($CONFIG['admin']['password']) !== strtolower(Keccak::of(strtolower($data['password']))))
		throw new Exception('wrong_data');
				
	$loginHash = md5($CONFIG['admin']['login']);
	$sessionID = session::start($loginHash);
	$sessionData = array('is_admin' => true);
	session::putSessionContent($loginHash, $sessionID, $sessionData);
	setcookie('sessionID', $sessionID, 0, "/", "", false, true);
	setcookie('sessionName', $loginHash, 0, "/", "", false, true);
}