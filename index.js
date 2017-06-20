
const EventEmitter = require('events');
const util = require('util');
const ps = require('ps-node');
const lookup = util.promisify(ps.lookup);
const {spawn} = require('child_process')

class SeleniumStandalone extends EventEmitter {
	constructor() {
		super();
		this.pid = null;
		this.check = this.check.bind(this);
		this.start = this.start.bind(this);
	}
	check() {
		if (this.pid) {
			return Promise.resolve({pid: this.pid});
		}
		lookup({command: '/usr/bin/java'})
		.then(result => {
			const regex = new RegExp('selenium-standalone');
			for (let i = 0; i < result.length; i++) {
				if (result[i]['arguments'] && result[i]['arguments'].length) {
					result[i]['arguments'].forEach(arg => {
						if (regex.test(arg)) {
							this.pid = result[i]['pid']
							this.emit('ready');
						}
					})
				}
			}
		})
		return Promise.resolve({pid: this.pid});
	}

	start({pid}) {
		if (pid) {
			return Promise.resolve({pid});
		}
		let regex = new RegExp('Selenium started');
		const start = spawn('selenium-standalone', ['start'])
		start.stdout.on('data', (data) => {
			if (regex.test(data.toString())) {
				this.check();
			}
		})
	}

	kill() {
		ps.kill(this.pid, (err) => {
			if (err) {
				throw err;
			}
			console.log(`Process ${this.pid} has been killed`);
		})
	}

	forceKill() {
		spawn('pkill', ['-f', 'selenium-standalone'])
	}

	init() {
		const {check, start} = this;
		return check().then(start)
	}
}

module.exports = new SeleniumStandalone();