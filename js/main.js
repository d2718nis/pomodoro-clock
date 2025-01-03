var model = {
	workControlsDisplay: 'none',
	restControlsDisplay: 'none',
	hintText: '',
	hintOpacity: 0,
	dateStart: new Date(),
	workLength: 25 * 60 * 1000,
	restLength: 5 * 60 * 1000,
	filledLength: 0,
	timerIsStopped: true,
	timerStateIsWork: true,
	timerTick: function() {
		if (this.timerIsStopped) {
			// Also check paused time
			this.dateStart = new Date(Date.now() - this.filledLength);
		} else {
			this.filledLength = Date.now() - this.dateStart.getTime();
			if ((this.timerStateIsWork && this.filledLength >= this.workLength) ||
			(!this.timerStateIsWork && this.filledLength >= this.restLength)) {
				this.timerSwitchState();
			}
		}
		return this.getAllTimerInfo();
	},
	timerSwitchState: function() {
		this.timerStateIsWork = !this.timerStateIsWork;
		this.timerClearSet();
	},
	timerClearSet: function() {
		this.filledLength = 0;
		this.dateStart = new Date();
	},
	getAllTimerInfo: function() {
		return {
			stopped: this.timerIsStopped,
			stateIsWork: this.timerStateIsWork,
			remain: this.timerStateIsWork ? (this.workLength - this.filledLength) : (this.restLength - this.filledLength),
			wStart: this.timerStateIsWork ? this.dateStart.getTime() : (this.dateStart.getTime() + this.restLength),
			wFilled: this.timerStateIsWork ? (this.filledLength > this.workLength ? this.workLength : this.filledLength) : 0,
			wLength: this.workLength,
			rStart: this.timerStateIsWork ? (this.dateStart.getTime() + this.workLength) : this.dateStart.getTime(),
			rFilled: this.timerStateIsWork ? 0 : (this.filledLength > this.restLength ? this.restLength : this.filledLength),
			rLength: this.restLength,
			faviconCircleColor: this.calculateFaviconColors().circleColor,
			faviconTextColor: this.calculateFaviconColors().textColor
		};
	},
	setSetsLength: function(wSetsSeconds, rSetsSeconds) {
		this.workLength = wSetsSeconds;
		this.restLength = rSetsSeconds;
		return this.getAllTimerInfo();
	},
	timerToggle: function() {
		this.timerIsStopped = !this.timerIsStopped;
		return this.getAllTimerInfo();
	},

	calculateControls: function(target) {
		if (this.timerIsStopped) {
			switch(target) {
				case 'w-bars':
					this.workControlsDisplay = 'block';
					this.restControlsDisplay = 'none';
					break;
				case 'r-bars':
					this.workControlsDisplay = 'none';
					this.restControlsDisplay = 'block';
					break;
				default:
					this.workControlsDisplay = 'none';
					this.restControlsDisplay = 'none';
			}
		}
		return {
			workDisplay: this.workControlsDisplay,
			restDisplay: this.restControlsDisplay
		};
	},
	calculateHint: function(target, action) {
		if (action === 'mouseleave') {
			this.hintOpacity = 0;
		} else if (action === 'mouseenter') {
			switch(target) {
				case 'w-bars':
					if (this.timerIsStopped) {
						this.hintText = 'Adjust work time';
					} else {
						if (this.timerStateIsWork) {
							this.hintText = 'Restart work set';
						} else {
							this.hintText = 'Fast forward to work';
						}
					}
					this.hintOpacity = 1;
					break;
				case 'r-bars':
					if (this.timerIsStopped) {
						this.hintText = 'Adjust rest time';
					} else {
						if (this.timerStateIsWork) {
							this.hintText = 'Fast forward to rest';
						} else {
							this.hintText = 'Restart rest set';
						}
					}
					this.hintOpacity = 1;
					break;
				case 'pomodoro-clock':
				case 'timer':
					if (this.timerIsStopped && this.timerStateIsWork && this.filledLength === 0) {
						this.hintText = '<kbd>Space</kbd> Start timer';
					} else if (this.timerIsStopped && this.timerStateIsWork) {
						this.hintText = '<kbd>Space</kbd> Continue working';
					} else if (this.timerIsStopped && !this.timerStateIsWork) {
						this.hintText = '<kbd>Space</kbd> Continue resting';
					} else {
						this.hintText = '<kbd>Space</kbd> Pause timer';
					}
					this.hintOpacity = 1;
					break;
				default:
					this.hintOpacity = 0;
			}
		}
		return {
			text: this.hintText,
			opacity: this.hintOpacity
		};
	},
	calculateFaviconColors: function() {
		if (this.timerStateIsWork) {
			return {
				circleColor: this.timerIsStopped ? '#540d6e' : '#ee4266',
				textColor: this.timerIsStopped ? '#ee4266' : '#fff'
			};
		} else {
			return {
				circleColor: this.timerIsStopped ? '#540d6e' : '#ffd23f',
				textColor: this.timerIsStopped ? '#ffd23f' : '#555'
			};
		}
	}
};



var view = {
	notificationPermissionGranted: false,
	showControls: function(workDisplay, restDisplay) {
		document.getElementById('work-controls').style.display = workDisplay;
		document.getElementById('rest-controls').style.display = restDisplay;
	},
	showHint: function(hintText, hintOpacity) {
		document.getElementById('hint').innerHTML = hintText;
		// TODO: make this cross-browser
		document.getElementById('hint').style.opacity = hintOpacity;
	},
	showSetsTime: function(wSetsSeconds, rSetsSeconds) {
		document.getElementById('work-sets-value').innerHTML = wSetsSeconds;
		document.getElementById('rest-sets-value').innerHTML = rSetsSeconds;
	},
	showTimerValue: function(val) {
		document.getElementById('timer').innerHTML = val;
	},
	toggleEasterEgg: function(element) {
		if (element.innerHTML === 'Pomodoro') {
			element.innerHTML = 'Code is ticking';
		} else {
			element.innerHTML = 'Pomodoro';
		}
	},
	playSound: function(elementId, startVolume, duration) {
		var audio = document.getElementById(elementId);
		audio.volume = startVolume;
		audio.currentTime = 0;
		audio.play();
		this.animateSound(audio, duration);
	},
	animateSound: function(audio, prefDuration) {
		var realDuration = prefDuration <= audio.duration*1000 ? prefDuration : audio.duration*1000;
		var decreaseBy = audio.volume / Math.floor(realDuration/100);
		var animateInterval = setInterval(function() {
			if (audio.volume === 0) {
				audio.pause();
				audio.currentTime = 0;
				clearInterval(animateInterval);
			} else {
				audio.volume = audio.volume >= decreaseBy ? audio.volume - decreaseBy : 0;
			}
		}, 100);
	},
	requestNotificationPermission: function() {
		if ('Notification' in window) {
			if (Notification.permission !== 'granted') {
				Notification.requestPermission().then(function(result) {
					this.notificationPermissionGranted = true;
				});
			} else {
				this.notificationPermissionGranted = true;
			}
		}
	},
	spawnNotification: function(body, icon, title) {
		if (this.notificationPermissionGranted && Notification.permission === 'granted') {
			var n = new Notification(title, { body: body, icon: icon });
			n.onclick = function() { window.focus(); this.close(); };
		}
	},
	drawSvg: function(wStart, wLength, wFilled, rStart, rLength, rFilled) {
		var bigRadius = 150;
		var smallRadius = 130;
		var borderWidth = 2;
		var shift = 10*1000;
		document.getElementById('w-cont').setAttribute('d', this.calculateArc(this.timeToAngle(wStart),
			this.timeToAngle(wStart + wLength), smallRadius, bigRadius, wLength));
		document.getElementById('w-fill').setAttribute('d', this.calculateArc(this.timeToAngle(wStart+shift),
			this.timeToAngle(wStart+((wLength-2*shift)/wLength)*wFilled+shift),
			smallRadius+borderWidth, bigRadius-borderWidth, ((wLength-2*shift)/wLength)*wFilled));
		document.getElementById('r-cont').setAttribute('d', this.calculateArc(this.timeToAngle(rStart),
			this.timeToAngle(rStart + rLength), smallRadius, bigRadius, rLength));
		document.getElementById('r-fill').setAttribute('d', this.calculateArc(this.timeToAngle(rStart+shift),
			this.timeToAngle(rStart + +((rLength-2*shift)/rLength)*rFilled+shift),
			smallRadius+borderWidth, bigRadius-borderWidth, ((rLength-2*shift)/rLength)*rFilled));
	},
	drawFavicon: function(circleColor, textColor, minutes) {
		var canvas = document.createElement('canvas');
		canvas.width = 16;
		canvas.height = 16;
		var ctx = canvas.getContext('2d');
		// Circle
		ctx.beginPath();
		ctx.arc(canvas.width/2, canvas.height/2, canvas.height/2, 0, 2*Math.PI);
		ctx.fillStyle = circleColor;
		ctx.fill();
		// Text
		ctx.font = 'Roboto';
		ctx.fillStyle = textColor;
		ctx.textAlign = 'center';
		ctx.fillText(minutes, canvas.width/2, canvas.height/2+4);
		// Draw favicons
		document.getElementsByTagName('head')[0].querySelector('[rel="icon"]').href = canvas.toDataURL("image/x-icon");
		document.getElementsByTagName('head')[0].querySelector('[rel="shortcut icon"]').href = canvas.toDataURL("image/x-icon");
	},
	calculateArc: function(a1, a2, smallRadius, bigRadius, functionTime) {
		return 'M' + (Math.cos(a1)*smallRadius) + ' ' + (Math.sin(a1)*smallRadius) + ' ' +
			(Math.cos(a1)*bigRadius) + ' ' + (Math.sin(a1)*bigRadius) +
			'A' + bigRadius + ' ' + bigRadius + ' 0 ' + (0.0001*functionTime > 180 ? '1' : '0') +
			' 1 ' + (Math.cos(a2)*bigRadius) + ' ' + (Math.sin(a2)*bigRadius) +
			'L' + (Math.cos(a2)*smallRadius) + ' ' + (Math.sin(a2)*smallRadius) +
			'A' + smallRadius + ' ' + smallRadius + ' 0 ' + (0.0001*functionTime > 180 ? '1' : '0') +
			' 0 ' + (Math.cos(a1)*smallRadius) + ' ' + (Math.sin(a1)*smallRadius) +
			'Z';
	},
	timeToAngle: function(seconds) {
		return (-1) * ((-0.0001) * seconds + 90) * Math.PI / 180;
	}
};



var controller = {
	currentTimerStateIsWork: true,
	startTimer: function() {
		var timer = model.timerTick();
		if (!timer.stopped) {
			var minutes = controller.addStartingZero(Math.floor(Math.round(timer.remain/1000)/60));
			var seconds = controller.addStartingZero(Math.round(Math.round(timer.remain/1000)%60));
			view.showTimerValue(minutes + ' : ' + seconds);
			if (controller.timerStateIsChanged(timer.stateIsWork)) {
				if (timer.stateIsWork) {
					view.spawnNotification('It\'s time to work', 'img/icon.png', 'Good luck!');
					view.playSound('set-end', 0.2, 4000);
				} else {
					view.spawnNotification('It\'s time to rest', 'img/icon.png', 'Good job!');
					view.playSound('set-end', 0.2, 4000);
				}
			}
		}
		view.drawFavicon(timer.faviconCircleColor, timer.faviconTextColor, Math.ceil(Math.round(timer.remain/1000)/60));
		view.drawSvg(timer.wStart, timer.wLength, timer.wFilled, timer.rStart, timer.rLength, timer.rFilled);
	},
	addStartingZero: function(val) {
		return val > 9 ? val : '0' + val;
	},
	timerStateIsChanged: function(stateIsWork) {
		if (this.currentTimerStateIsWork !== stateIsWork) {
			this.currentTimerStateIsWork = stateIsWork;
			return true;
		}
		return false;
	},
	toggleTimer: function() {
		var controls = model.calculateControls('');
		view.showControls(controls.workDisplay, controls.restDisplay);
		if (!model.timerToggle().stopped) {
			view.playSound('timer-start', 0.1, 4000);
		} else {
			view.showTimerValue('Continue');
			view.playSound('timer-pause', 0.4, 1200);
		}
		var hint = model.calculateHint('timer', '');
		view.showHint(hint.text, hint.opacity);
	},
	// ========== Onload handler ==========
	handlerOnload: function() {
		var timer = model.timerTick();
		view.drawFavicon(timer.faviconCircleColor, timer.faviconTextColor, Math.ceil(Math.round(timer.remain/1000)/60));
		view.drawSvg(timer.wStart, timer.wLength, timer.wFilled, timer.rStart, timer.rLength, timer.rFilled);
		view.requestNotificationPermission();
		setInterval(this.startTimer, 1000);
	},
	// ========== Click handlers ==========
	handleClick: function(target) {
		switch(target.id) {
			case 'app-title':
				view.toggleEasterEgg(target);
				break;
			case 'pomodoro-clock':
			case 'timer':
				this.toggleTimer();
				break;
			case 'w-cont':
			case 'w-fill':
				var controls = model.calculateControls('w-bars');
				view.showControls(controls.workDisplay, controls.restDisplay);
				var timer = model.getAllTimerInfo();
				if (!timer.stopped) {
					if (timer.stateIsWork) {
						// Restart current set
						model.timerClearSet();
						view.playSound('set-restart', 0.4, 4000);
					} else {
						// Fast forward to work
						model.timerSwitchState();
						this.currentTimerStateIsWork = model.getAllTimerInfo().stateIsWork;
						view.playSound('set-restart', 0.4, 4000);
					}
				}
				break;
			case 'r-cont':
			case 'r-fill':
				var controls = model.calculateControls('r-bars');
				view.showControls(controls.workDisplay, controls.restDisplay);
				var timer = model.getAllTimerInfo();
				if (!timer.stopped) {
					if (timer.stateIsWork) {
						// Fast forward to rest
						model.timerSwitchState();
						this.currentTimerStateIsWork = model.getAllTimerInfo().stateIsWork;
						view.playSound('set-restart', 0.4, 4000);
					} else {
						// Restart current set
						model.timerClearSet();
						view.playSound('set-restart', 0.4, 4000);
					}
				}
				break;
			case 'controls':
			case 'credits':
				break;
			default:
				var controls = model.calculateControls('');
				view.showControls(controls.workDisplay, controls.restDisplay);
		}
	},
	// ========== Hover handlers ==========
	handleHover: function(target, action) {
		switch(target.id) {
			case 'pomodoro-clock':
				var hint = model.calculateHint('pomodoro-clock', action);
				break;
			case 'timer':
				var hint = model.calculateHint('timer', action);
				break;
			case 'w-bars':
				var hint = model.calculateHint('w-bars', action);
				break;
			case 'r-bars':
				var hint = model.calculateHint('r-bars', action);
				break;
			default:
				var hint = model.calculateHint('', action);
		}
		view.showHint(hint.text, hint.opacity);
	},
	// ========== Drag range handler ==========
	handleRangesDrag: function(wVal, rVal) {
		var timer = model.setSetsLength(wVal*60*1000, rVal*60*1000);
		view.showSetsTime(Math.round(timer.wLength/60/1000), Math.round(timer.rLength/60/1000));
		view.drawFavicon(timer.faviconCircleColor, timer.faviconTextColor, Math.ceil(Math.round(timer.remain/1000)/60));
		view.drawSvg(timer.wStart, timer.wLength, timer.wFilled, timer.rStart, timer.rLength, timer.rFilled);
	},
};



(function() {
	var app = {
		init: function() {
			this.main();
			this.control();
			this.event();
		},
		main: function() {
		},
		control: function() {
			controller.handlerOnload();
		},
		event: function() {
			// Keyboard events
			document.addEventListener('keyup', function(e) {
				if (e.code === 'Space') {
					controller.toggleTimer();
				}
			});
			// Click events
			document.getElementById('app-title').addEventListener('click', function(e) {
				controller.handleClick(e.target);
			});
			document.getElementById('pomodoro-clock').addEventListener('click', function(e) {
				controller.handleClick(e.target);
			});
			document.getElementById('timer').addEventListener('click', function(e) {
				controller.handleClick(e.target);
			});
			document.getElementById('w-bars').addEventListener('click', function(e) {
				controller.handleClick(e.target);
			});
			document.getElementById('r-bars').addEventListener('click', function(e) {
				controller.handleClick(e.target);
			});
			window.addEventListener('click', function(e) {
				if(e.target.tagName.toLowerCase() === 'body') {
					controller.handleClick(e.target);
				}
			});
			// Hover events
			document.getElementById('pomodoro-clock').addEventListener('mouseenter', function(e) {
				controller.handleHover(e.target, e.type);
			});
			document.getElementById('pomodoro-clock').addEventListener('mouseleave', function(e) {
				controller.handleHover(e.target, e.type);
			});
			document.getElementById('timer').addEventListener('mouseenter', function(e) {
				controller.handleHover(e.target, e.type);
			});
			document.getElementById('timer').addEventListener('mouseleave', function(e) {
				controller.handleHover(e.target, e.type);
			});
			document.getElementById('w-bars').addEventListener('mouseenter', function(e) {
				controller.handleHover(e.target, e.type);
			});
			document.getElementById('w-bars').addEventListener('mouseleave', function(e) {
				controller.handleHover(e.target, e.type);
			});
			document.getElementById('r-bars').addEventListener('mouseenter', function(e) {
				controller.handleHover(e.target, e.type);
			});
			document.getElementById('r-bars').addEventListener('mouseleave', function(e) {
				controller.handleHover(e.target, e.type);
			});
			// Range drag events
			document.getElementById('work-range').addEventListener('input', function() {
				controller.handleRangesDrag(this.value, document.getElementById('rest-range').value);
			});
			document.getElementById('rest-range').addEventListener('input', function() {
				controller.handleRangesDrag(document.getElementById('work-range').value, this.value);
			});
		}
	}

	app.init();

}());
