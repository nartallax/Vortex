// кусок полоски с элементами управления наверху страницы: логин-поля

shred.define({
	requirements: ['topBar'],
	name: 'notLoggedTopBar',
	priority: 0,
	init: function(markup){ 
		el('top_bar_inner_container').appendChild(markup);
		
		db.listen('roleChanged', function(){
			markup.style.display = db.getRole() === 'free'? 'block': 'none';
		});
		
		db.ents.lector.listen('dataUpdated', function(){
			var select = el('login_target_input');
			select.innerHTML = '';
			select.appendChild(tag('option', null, null, 'Администратор', {value: -0xdeadc0de}));
			db.data.lector.flfield('is_external', false).each(function(l){
				select.appendChild(tag('option', null, null, lector.toString(l), {value: l.id}));
			});
			
			var pwd = cookie.get('pwd'), lid = cookie.get('lector_id');
			if(pwd && lid){
				el('login_remember_checkbox').checked = true;
				el('login_password_input').value = pwd;
				el('login_target_input').value = lid;
			} else el('login_remember_checkbox').checked = false;
			
		});
		
	},	
	methods: {
		loginAsLector: function(){
			var id = parseInt(el('login_target_input').value),
				pwd = Keccak(el('login_password_input').value);
			conjure('logInLector', {id:id, password:pwd}).then(function(r){
				if(r.status === 'wrong_data') return popup.alert('Неправильный пароль.', 'Оповещение');
				if(r.status !== 'ok') return checkOkStatus(r);
				
				db.user.id = id;
				db.setRole('lector');
			});
		},
		loginAsAdmin: function(){
			var pwd = Keccak(el('login_password_input').value);
			conjure('logInAdmin', {password:pwd}).then(function(r){
				if(r.status === 'wrong_data') return popup.alert('Неправильный пароль.', 'Оповещение');
				if(r.status !== 'ok') return checkOkStatus(r);
				
				db.setRole('protected');
			});
		},
		hideInputs: function(){
			shreds.notLoggedTopBar.showLevel--;
			shreds.notLoggedTopBar.checkLevel();
		},
		showInputs: function(){
			shreds.notLoggedTopBar.showLevel++;
			shreds.notLoggedTopBar.checkLevel();
		},
		checkLevel: function(){
			var node = el('login_inputs_panel'),
				button = el('login_panel_switch_button'),
				isShown = node.style.opacity === '1',
				mustBeShown = shreds.notLoggedTopBar.showLevel !== 0;
			if(isShown === mustBeShown) return;
			
			if(shreds.notLoggedTopBar.handle !== undefined)
				clearTimeout(shreds.notLoggedTopBar.handle);
			
			setTimeout(function(){ 
				if(mustBeShown) {
					node.style.opacity = '1'; 
					button.style.background = '#e4e4e4';
					button.style.textDecoration = 'none';
				} else {
					node.style.opacity = '0'; 
					button.style.background = '';
					button.style.textDecoration = 'underline';
				}
			}, 1);
			if(mustBeShown){
				node.style.opacity = '0';
				node.style.display = 'block';
				
			} else shreds.notLoggedTopBar.handle = setTimeout(function(){ node.style.display = 'none'; }, 250);
		},
		showLevel: 0, 
		toggleLoginPanel: function(){
			var node = el('login_inputs_panel');
			shreds.notLoggedTopBar[(shreds.notLoggedTopBar.showLevel? 'hide': 'show') + 'Inputs']();
		},
		onLoginButtonClick: function(){
			if(el('login_remember_checkbox').checked) {
				cookie.set('pwd', el('login_password_input').value);
				cookie.set('lector_id', el('login_target_input').value);
			} else { 
				cookie.delete('pwd');
				cookie.delete('lector_id');
			}
			shreds.notLoggedTopBar['loginAs' + (parseInt(el('login_target_input').value) === -0xdeadc0de? 'Admin': 'Lector')]();
		}
	},
	markup: 
'<div style="position:absolute;right:0px">'+
'	<div style="cursor:pointer;text-decoration:underline;padding:5px 10px;transition-duration:0.5s;" onclick="shreds.notLoggedTopBar.toggleLoginPanel()" id="login_panel_switch_button" class="arial">Вход в систему</div>'+
'	<div style="position:absolute;right:0px;display:none;background:#e4e4e4;opacity:0;width:200px;height:150px;transition-duration:0.5s;" id="login_inputs_panel">'+
'		<select id="login_target_input" style="height:23px;position:absolute;display:block;width:170px;left:15px;right:15px;top:25px">' +
'			<option value="-1">загрузка...<option>' + 
'		</select>'+
'		<input type="password" placeholder="Пароль" style="position:absolute;display:block;left:15px;right:15px;top:60px" id="login_password_input"/>'+
'		<div style="position:absolute;top:90px;left:15px">'+
'			<input type="checkbox" style="position:relative;top:2px" id="login_remember_checkbox"/>'+
'			<span onclick="el(\'login_remember_checkbox\').click();">запомнить меня</span>'+
'		</div>' + 
'		<input type="button" value="Войти" onclick="shreds.notLoggedTopBar.onLoginButtonClick()" style="position:absolute;right:15px;bottom:15px"/>' +
'	</div>'+
'</div>'
});