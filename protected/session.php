<?php
	
	/* класс, который рулит сессиями */
	
	class session {
	
		private static function timeExpired($time){
			global $CONFIG;
			return $time + $CONFIG['session']['lifetime'] < time();
		}
		private static function generateKey(){
			return substr(md5(sha1(md5((string)(time()) . ' this is my session key, nyah! ' . strrev((string)(time()))))), 0, 32);;
		}
	
		private static function getSessionFilePath($login){
			global $CONFIG;
			return $CONFIG['session']['path'] . $login . '.session';
		}
	
		private static function removeSessionFile($login){
			unlink(session::getSessionFilePath($login));
		}
		
		public static function isStarted($login){
			return $login != null && $login != '' && file_exists(session::getSessionFilePath($login));
		}
		
		// check for session existance, time is not expired, key matches
		// also updates session time on every successful match
		public static function sessionIsOk($login, $key){
			if($login == null || $key == null || !session::isStarted($login))
				return false;
			$sessionData = session::getSessionContentWithWrap($login);
			if($sessionData['key'] != $key || session::timeExpired($sessionData['time'])){
				session::removeSessionFile($login);
				return false;
			}
			session::putSessionContent($login, $key, $sessionData['data']);
			return true;
		}
	
		public static function putSessionContent($login, $key, $data){
			$file = fopen(session::getSessionFilePath($login), 'w');
			if(is_null($data))
				$data = array();
			$data = array('time' => time(), 'key' => $key, 'data' => $data);
			fwrite($file, json_encode($data));
			fclose($file);
		}
		
		private static function getSessionContentWithWrap($login){
			if(!session::isStarted($login))
				return null;
			$file = fopen(session::getSessionFilePath($login), 'r');
			$content = json_decode(fgets($file), true);
			fclose($file);
			return $content;
		}
		
		public static function getSessionContent($login){
			$wrappedContent = session::getSessionContentWithWrap($login);
			if(is_null($wrappedContent))
				return null;
			return $wrappedContent['data'];
		}
	
		public static function start($login){
			if(session::isStarted($login))
				session::removeSessionFile($login);
			$key = session::generateKey();
			session::putSessionContent($login, $key, null);
			return $key;
		}
		
		public static function end($login){
			session::removeSessionFile($login);
		}
	
	}