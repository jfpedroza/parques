
import SocketService = require("../services/SocketService");
import BaseController = require("./BaseController");
import {Game, GameStatus} from "../../../../models/Game";
import {Player} from "../../../../models/Player";

declare const angular: ng.IAngularStatic;

class RoomController extends BaseController {
    static $inject = ['$scope', '$routeParams', 'SocketService', '$location'];

    room: Game;
    splitterSettings: any;
    showPieces: boolean[];
    json: any;
    jsonViewerText: string;
    socketSerivce: SocketService;

    constructor($scope: ng.IScope, $routeParams: any, socketService: SocketService, $location: ng.ILocationService) {
        super();

        this.socketSerivce = socketService;
        const roomId: number = $routeParams.roomId;
        console.log(`Entered room [${roomId}]: Loading...`);
        this.splitterSettings = { width: '100%', height: '99vh', orientation: 'vertical', panels: [{ size: '50%', min: 100 }, { size: '50%', min: 100 }] };
        this.showPieces = [];
        this.json = {};
        this.jsonViewerText = '';

        $scope.$on('socket:update-game', (ev, game: Game) => {
            if (game) {
                if (roomId == game.id) {
                    game.created = new Date(game.created);
                    if (!this.room) {
                        console.log(`Room game loaded.`);
                        game.players.forEach(player => this.showPieces[player.id] = false);
                        this.json = game;
                        this.jsonViewerText = 'Game';
                    }

                    this.room = game;
                }
            } else {
                console.log(`Room not found... Redirecting to home.`);
                $location.path('/');
            }
        });

        $scope.$on('socket:delete-game', (ev, game: Game) => {
            if (roomId == game.id) {
                $location.path('/');
            }
        });

        $scope.$on('socket:requested-data', (ev, gameId: number, message: string, data: any) => {
            if (roomId == gameId) {
                this.json = data;
                switch (message) {
                    case 'path-points':
                        this.jsonViewerText = 'Path Points';
                        break;
                    case 'piece-positions':
                        this.jsonViewerText = 'Piece Positions';
                        break;
                }

                console.log(`Received requested data, message=${message}`);
            }
        });

        socketService.emit('register-admin');
        socketService.emit('get-game', roomId);
    }

    showPlayerPieces(game: Game, player: Player): boolean {
        return game.status != GameStatus.CREATED && this.showPieces[player.id];
    }

    togglePlayerPieces(player: Player): void {
        this.showPieces[player.id] = !this.showPieces[player.id];
    }

    requestData(player: Player, message: string): void {
        console.log(`Requesting data for player '${player.name}', message=${message}`);
        this.socketSerivce.emit('request-data', this.room.id, player, message);
    }
}

angular.module('ParquesAdmin').controller('RoomController', RoomController);

export = RoomController;