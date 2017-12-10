declare const angular: any;

class SocketService {

    static $inject = ['socketFactory'];
    private socket: any;

    constructor(socketFactory: any) {
        const url = `${document.location.protocol}//${document.location.hostname}:${document.location.port}`;
        const socket = io.connect(url, { forceNew: true });

        this.socket = new socketFactory({
            ioSocket: socket
        });

        this.socket.forward('test');
    }

    public emit(event: string, ... args: any[]) {
        this.socket.emit(event, ...args);
    }
}

angular.module('ParquesAdmin').service('SocketService', SocketService);

export = SocketService;