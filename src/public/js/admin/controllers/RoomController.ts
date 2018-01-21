
import SocketService = require("../services/SocketService");
import {Game} from "../../../../models/Game";

declare const angular: ng.IAngularStatic;

class RoomController {
    static $inject = ['$scope', '$routeParams', 'SocketService', '$location'];

    room: Game;
    
    constructor($scope: ng.IScope, $routeParams: any, socketService: SocketService, $location: ng.ILocationService) {

        const roomId: number = $routeParams.roomId;
        console.log(`Entered room [${roomId}]: Loading...`);

        $scope.$on('socket:update-game', (ev, game: Game) => {
            if (roomId == game.id) {
                game.created = new Date(game.created);
                if (!this.room) {
                    console.log(`Room game loaded.`);
                }

                this.room = game;
            }
        });

        $scope.$on('socket:delete-game', (ev, game: Game) => {
            if (roomId == game.id) {
                $location.path('/');
            }
        });

        socketService.emit('register-admin');
        socketService.emit('get-game', roomId);
    }
}

angular.module('ParquesAdmin').controller('RoomController', RoomController);

export = RoomController;