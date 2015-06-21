<?php
	mb_internal_encoding('UTF-8');
	
	/*
	
	TODO:
		разобраться с временем на клиенте и на сервере. изобрести какое-нибудь надежное общее решение. протестировать для случая разных временных зон клиента и сервера.

		вкрутить в просмотр/редактирование занятий колонку "тип занятия"
		
		сделать аудиторию занятия массивом
		
		запилить возможность произвольного количества алгоритмов сбора
		запилить сбор для документов
		запилить генерацию документов
		
		пофиксить сбор: преподаватель Фамилия И.О., комната &nbsp;, Неопознанное Строение, слоты на весь день
	
	*/
	
	require_once('./protected/utils.php');
	require_once('./protected/config.php');
	require_once('./protected/session.php');
	require_once('./protected/benchmark.php');
	require_once('./protected/keccak.php');
	require_once('./protected/db.php');
	require_once('./protected/narval/narval.php');
	require_once('./protected/packer.php');

	$sessionData = null;
	$sessionName = null;
	$packedCommunication = false;
	
	$REQUEST_STATES = array(
		'no_such_function', 		// вызов несуществующей функции апи
		'malformed_input', 			// нарушена структура запроса (тело, заголовки, куки итд)
		'not_logged_in', 			// имеющихся у пользователя привилегий недостаточно для вызова этой функции
		'not_enough_parameters', 	// функции апи недостаточно параметров или функция апи не указана
		'wrong_parameter_type', 	// в функцию апи передан параметр неожиданного типа
		'not_validated', 			// значение параметра или имени функции не прошло валидацию
		'failed',					// функция апи не смогла успешно выполниться из-за каких-то внешних причин
		'inapplicable', 			// выбранная операция не может быть применена к выбранному объекту
		'inavailable',				// в данный момент данное действие недоступно
		'wrong_data',				// данные, вступающие в противоречие либо с уже имеющимися, либо сами с собой
		'server_error',				// любая внутрисерверная ошибка, о которой пользователю знать не положено
		'ok', 						// все хорошо
		'unknown_error' 			// произошло что-то страшное и неизвестное (непойманный эксепшн?)
	);
	
	// функции работы с разделенными функциями АПИ
	function loadApiFunction($api, $function){ require("./protected/api/$api/$function.php"); }
	function apiFunctionExists($api, $function){ return file_exists("./protected/api/$api/$function.php"); }
	function validateApiInputData($data){ return Narval\check(getApiDataTemplate(), $data); }
	function invokeApiFunction($data){ return calledApiFunction($data); }
	
	function getTargetApi($loggedIn, $isAdmin, $apiFunctionName){
		$haveFunctionInFree = apiFunctionExists('free', $apiFunctionName);
		$haveFunctionInProtected = apiFunctionExists('protected', $apiFunctionName);;
		$haveFunctionInLector = apiFunctionExists('lector', $apiFunctionName);;
		
		$couldInvokeLector = $haveFunctionInLector && $loggedIn && !$isAdmin;
		$couldInvokeProtected = $haveFunctionInProtected && $isAdmin;
		
		if(!$haveFunctionInProtected && !$haveFunctionInFree && !$haveFunctionInLector)
			throw new Exception('no_such_function');
			
		if(!$haveFunctionInFree && !$couldInvokeProtected && !$couldInvokeLector)
			throw new Exception('not_logged_in');
		
		if($haveFunctionInProtected && $isAdmin) return 'protected';
		if($haveFunctionInLector && !$isAdmin && $loggedIn) return 'lector';
		return 'free';
	}
	
	// функции вывода ответа
	function outputResponse($data){
		global $packedCommunication;
		
		if($packedCommunication){
			header('Content-Type','application/octet-stream');
			packer\write($data);
		} else {
			header('Content-Type','application/json');
			echo(json_encode($data));
		}
	}
	function apiResponseSuccess($data){
		$response = array('status' => 'ok');
		if(!is_null($data))
			$response['data'] = $data;
		outputResponse($response);
	}
	function apiResponseFail($reason){
		global $REQUEST_STATES;
		$response = array('status' => in_array($reason, $REQUEST_STATES)? $reason: 'unknown_error');
		outputResponse($response);
	}
	
	// функции обработки запроса
	function tryResumeSession(){
		global $sessionData;
		global $sessionName;
		$sessionData = null;
		$sessionName = null;
		
		if(!array_key_exists('sessionID', $_COOKIE) || !array_key_exists('sessionName', $_COOKIE))
			return false;
			
		if(preg_match('/^[a-fA-F\d]{32}$/', $_COOKIE['sessionName']) <= 0 || preg_match('/^[a-fA-F\d]{32}$/', $_COOKIE['sessionID']) <= 0)
			throw new Exception('malformed_input');
			
		if(!session::sessionIsOk($_COOKIE['sessionName'], $_COOKIE['sessionID']))
			return false;
			
		$sessionName = $_COOKIE['sessionName'];
		$sessionData = session::getSessionContent($sessionName);
		return true;
	}
	function readInputData(){
		global $packedCommunication;
		
		try{
			$apiInputData = $packedCommunication?
				packer\read():
				json_decode(file_get_contents('php://input'), true);
				
			if($apiInputData === null)
				throw new Exception('malformed_input');
			return $apiInputData;
		} catch(Exception $e){
			throw new Exception('malformed_input');
		}
	}
	function getApiFunctionName(){
		if(!isset($_GET['f']) || $_GET['f'] === null)
			throw new Exception('not_enough_parameters');
			
		$apiFunctionName = $_GET['f'];
		if(preg_match('/^[a-zA-Z_]{3,128}$/', $apiFunctionName) <= 0)
			throw new Exception('not_validated');
				
		return $apiFunctionName;
	}
	
	// Самая Главная Функция
	function processHttpRequest(){
		global $sessionData;
		global $packedCommunication;
		
		try{
			if(isset($_GET['packed']) && $_GET['packed'] === 'true')
				$packedCommunication = true;
		
			$apiFunctionName = getApiFunctionName();
			$targetApi = getTargetApi(tryResumeSession(), $sessionData == null? false: $sessionData['is_admin'], $apiFunctionName);
			$apiInputData = readInputData();
				
			loadApiFunction($targetApi, $apiFunctionName);
			
			if(!validateApiInputData($apiInputData))
				throw new Exception('not_validated');
			return apiResponseSuccess(invokeApiFunction($apiInputData));
		} catch(Exception $e){
			// uncomment this to disable additional verbose
			//return apiResponseFail($e->getMessage());
			apiResponseFail($e->getMessage());
			echo("\n" . $e->getMessage() . "\nat " . $e->getFile() . ':' . $e->getLine() . "\n" . $e->getTraceAsString());
			return;
		}
	}
	
	// выводить ошибки, да побольше
	set_error_handler(function($errno, $errstr, $errfile, $errline, array $errcontext) {
		if (error_reporting() === 0) return false;
		throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
	});
	error_reporting(-1);
	ini_set('display_errors', 'On');
	
	// фпиред
	processHttpRequest();