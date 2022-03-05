import { signalHub } from "./signalHub";

enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
}

export class LogManager {
    public recentLogs: any[]
    constructor(public logLevel: LogLevel = LogLevel.INFO) {
        this.recentLogs = []
        const old_console_debug = window.console.debug;
        const old_console_log = window.console.log;
        const old_console_info = window.console.info;
        const old_console_warn = window.console.warn;
        const old_console_error = window.console.error;
        switch (this.logLevel) {
            case LogLevel.DEBUG:
                window.console.debug = (...args) => {
                    const newArgs = [this.getTimestamp(), ...args]
                    old_console_debug(...args)
                    this.addLog(...newArgs)
                }
            case LogLevel.INFO:
                window.console.info = (...args) => {
                    const newArgs = [this.getTimestamp(), ...args]
                    old_console_info(...args)
                    this.addLog(...newArgs)
                }
                window.console.log = (...args) => {
                    const newArgs = [this.getTimestamp(), ...args]
                    old_console_log(...args)
                    this.addLog(...newArgs)
                }
            case LogLevel.WARN:
                window.console.warn = (...args) => {
                    const newArgs = [this.getTimestamp(), ...args]
                    old_console_warn(...args)
                    this.addLog(...newArgs)
                }
            case LogLevel.ERROR:
                window.console.error = (...args) => {
                    const newArgs = [this.getTimestamp(), ...args]
                    old_console_error(...args)
                    this.addLog(...newArgs)
                }

        }


        window['logManager'] = this

    }

    addLog(...args) {
        this.recentLogs = [args, ...this.recentLogs.slice(0, 99)]
        signalHub.local.emit('new_log', {})
    }

    getTimestamp() {
        let d = new Date();
        return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`
    }

    recentLogsAsText() {
        return this.recentLogs.map(row => (this.rowToString(row))).join("\n")
    }

    rowToString(row: any[]) {
        return row.map(col => {
            if (typeof col === 'string') {
                return col
            } else {
                return JSON.stringify(col)
            }
        }).join(" ")
    }



}