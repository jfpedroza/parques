
declare const angular: ng.IAngularStatic;

class SocketService {

    static $inject = ['socketFactory'];
    private socket: any;

    constructor(socketFactory: any) {
        const url = `${document.location.protocol}//${document.location.hostname}:${document.location.port}`;
        const socket = io.connect(url, { forceNew: true });

        this.socket = new socketFactory({
            ioSocket: socket
        });

        this.socket.forward('game-list');
        this.socket.forward('add-game');
        this.socket.forward('update-game');
        this.socket.forward('delete-game');
        this.socket.forward('player-list');
        this.socket.forward('add-player');
        this.socket.forward('update-player');
        this.socket.forward('delete-player');
    }

    public emit(event: string, ... args: any[]) {
        this.socket.emit(event, ...args);
    }
}

angular.module('ParquesAdmin').service('SocketService', SocketService);

export = SocketService;