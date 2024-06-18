
class WebSocketService {
    private socket: WebSocket | null = null;
    private pingIntervalId: number | null = null;
    private pingCounter: number = 0;
    public log: Array[string] = [];
  
    public connect(): Promise<Event> {
      return new Promise((resolve, reject) => {
        this.socket = new WebSocket('ws://test.enter-systems.ru/');
  
        this.socket.onopen = (event) => {
            console.log('Соединение установлено.');
            await this.authenticate('enter','A505a')
            resolve()
            this.startSendingPings();
            setTimeout(() => {
                this.stopSendingPings()
            }, 300000);
        };
  
        this.socket.onerror = (event) => {
            console.error('Ошибка соединения.', event);
            reject(event);
        };
  
        this.socket.onmessage = (event) => {
            const data: Array[string] = JSON.parse(event.data);
            
            if(data[0] === 8) this.log = data[2].Items
            console.log('Получено сообщение:', data);
        };
  
        this.socket.onclose = (event) => {
            console.log('Соединение закрыто.', event);
            this.startSendingPings()
        };
      });
    }
  
    private startSendingPings() {
        this.pingIntervalId = setTimeout(() => {
            if (this.socket.readyState === WebSocket.OPEN) {
                this.pingCounter++;
                this.socket.send(JSON.stringify([20, this.pingCounter]));
            }
        }, 29000);
    }
    private stopSendingPings() {
        if (this.pingIntervalId !== null) {
        clearInterval(this.pingIntervalId);
        this.pingIntervalId = null;
        }
    }
    private generateCallID(): string {
      return Math.random().toString(36).substring(2, 18);
    }

    private async authenticate(...params: any[]): Promise<void> {
        if (!this.socket) {
            new Error('Соединение не установлено.');
            return
        }
        const callID = this.generateCallID()
        this.socket.send(JSON.stringify([2, callID, `http://enter.local/login`, ...params]));
    }
  
    public async subscribe(method: string): Promise<void> {
        if (!this.socket) {
            new Error('Соединение не установлено.');
            return
        }
        await this.socket.send(JSON.stringify([5, `http://enter.local/${method}`]));
    }
    public async unsubscribe(method: string): Promise<void> {
        if (!this.socket) {
            new Error('Соединение не установлено.');
            return
        }
        await this.socket.send(JSON.stringify([6, `http://enter.local/${method}`]));
    }
  
    public disconnect(): void {
        if (this.socket) {
            this.socket.close();
        }
    }
}
const wsService = new WebSocketService();
await wsService.connect().then(() => {
    wsService.subscribe('subscription/logs/list')
});